"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { CameraIcon, UserPlusIcon, CheckCircleIcon, AlertCircleIcon } from "lucide-react"

export default function AttendanceApp() {
  const [registered, setRegistered] = useState<string[]>([])
  const [strangers, setStrangers] = useState<string[]>([])
  const [manualName, setManualName] = useState("")
  const [status, setStatus] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

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
      const name = data.result

      if (name === "Unknown") {
        const strangerName = `Stranger ${strangers.length + 1}`
        setStrangers(prev => [...prev, strangerName])
        setStatus(`Unrecognized person detected`)
      } else {
        setRegistered(prev => [...prev, name])
        setStatus(`Recognized: ${name}`)
      }
    } catch (error) {
      console.error('Error during face recognition:', error)
      setStatus('Error during face recognition')
    }
  }, [strangers.length, captureImage])

  const handleManualCheckIn = (name: string) => {
    if (name.trim()) {
      setRegistered(prev => [...prev, name.trim()])
      setStrangers(prev => prev.filter(s => s !== name))
      setStatus(`Manually checked in: ${name.trim()}`)
      setManualName("")
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-background shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-center">Attendance App</h1>
      
      <div className="mb-6">
        <Button 
          onClick={isCameraActive ? recognizeFace : startCamera} 
          className="w-full mb-2"
        >
          <CameraIcon className="mr-2 h-4 w-4" /> 
          {isCameraActive ? "Recognize Face" : "Start Camera"}
        </Button>
        {isCameraActive && (
          <Button onClick={stopCamera} className="w-full mb-2">
            Stop Camera
          </Button>
        )}
        <div className="relative bg-muted h-[480px] flex items-center justify-center rounded-md overflow-hidden">
          <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
          <canvas ref={canvasRef} width={640} height={480} className="hidden" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Registered People</h2>
          <ScrollArea className="h-60 border rounded-md p-2">
            {registered.map((person, index) => (
              <div key={index} className="flex items-center py-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                {person}
              </div>
            ))}
          </ScrollArea>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2">Strangers</h2>
          <ScrollArea className="h-60 border rounded-md p-2">
            {strangers.map((stranger, index) => (
              <div key={index} className="flex items-center justify-between py-1">
                <div className="flex items-center">
                  <AlertCircleIcon className="h-4 w-4 text-yellow-500 mr-2" />
                  {stranger}
                </div>
                <Button size="sm" onClick={() => handleManualCheckIn(stranger)}>
                  Register
                </Button>
              </div>
            ))}
          </ScrollArea>
        </div>
      </div>

      <div className="mt-6">
        <Label htmlFor="manualName">Manual Check-In</Label>
        <div className="flex mt-1.5">
          <Input
            id="manualName"
            value={manualName}
            onChange={(e) => setManualName(e.target.value)}
            placeholder="Enter name"
            className="mr-2"
          />
          <Button onClick={() => handleManualCheckIn(manualName)}>
            <UserPlusIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mt-4 text-sm text-muted-foreground text-center">{status}</div>
    </div>
  )
}