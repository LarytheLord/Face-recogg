"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CameraIcon, UserPlusIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Student {
  id: number
  name: string
  standard: string
  age: number
  roll_no: string
}

export default function AttendanceApp() {
  const [registered, setRegistered] = useState<Student[]>([])
  const [strangers, setStrangers] = useState<string[]>([])
  const [status, setStatus] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [newStudent, setNewStudent] = useState<Omit<Student, 'id'>>({
    name: '',
    standard: '',
    age: 0,
    roll_no: ''
  })

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/get_students')
      const data = await response.json()
      setRegistered(data)
    } catch (error) {
      console.error('Error fetching students:', error)
      setStatus('Error fetching students')
    }
  }

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      console.error("Error accessing the camera", err)
      setStatus("Error accessing the camera")
    }
  }, [])

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      setIsCameraActive(false)
    }
  }, [])

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d')
      if (context) {
        context.drawImage(videoRef.current, 0, 0, 640, 480)
        return canvasRef.current.toDataURL('image/jpeg')
      }
    }
    return null
  }, [])

  const recognizeFace = useCallback(async () => {
    const imageData = captureImage()
    if (!imageData) {
      setStatus("Failed to capture image")
      return
    }

    try {
      const response = await fetch('http://localhost:5000/recognize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: imageData }),
      })

      const data = await response.json()

      if (data.result === "Recognized") {
        setRegistered(prev => [...prev.filter(s => s.id !== data.id), data])
        setStatus(`Recognized: ${data.name}
