"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CameraIcon, UserPlusIcon, CheckCircleIcon, AlertCircleIcon, UsersIcon, UserIcon } from "lucide-react"

export default function MobileAttendanceApp() {
  const [registered, setRegistered] = useState<string[]>([])
  const [strangers, setStrangers] = useState<string[]>([])
  const [manualName, setManualName] = useState("")
  const [status, setStatus] = useState("")
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [isManualCheckInOpen, setIsManualCheckInOpen] = useState(false)

  // Simulate face recognition
  useEffect(() => {
    if (isCameraActive) {
      const timer = setTimeout(() => {
        const knownNames = ["Alice", "Bob", "Charlie", "David", "Eva"]
        const isRecognized = Math.random() > 0.3 // 70% chance of recognition
        if (isRecognized) {
          const recognizedName = knownNames[Math.floor(Math.random() * knownNames.length)]
          setRegistered(prev => [...prev, recognizedName])
          setStatus(`Recognized: ${recognizedName}`)
        } else {
          const strangerName = `Stranger ${strangers.length + 1}`
          setStrangers(prev => [...prev, strangerName])
          setStatus(`Unrecognized person detected`)
        }
        setIsCameraActive(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isCameraActive, strangers.length])

  const handleManualCheckIn = (name: string) => {
    if (name.trim()) {
      setRegistered(prev => [...prev, name.trim()])
      setStrangers(prev => prev.filter(s => s !== name))
      setStatus(`Manually checked in: ${name.trim()}`)
      setManualName("")
      setIsManualCheckInOpen(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 bg-background min-h-screen flex flex-col">
      <h1 className="text-xl font-bold mb-4 text-center">Attendance App</h1>
      
      <div className="mb-4">
        <Button 
          onClick={() => setIsCameraActive(true)} 
          className="w-full mb-2"
          disabled={isCameraActive}
        >
          <CameraIcon className="mr-2 h-4 w-4" /> 
          {isCameraActive ? "Scanning..." : "Start Face Recognition"}
        </Button>
        {isCameraActive && (
          <div className="bg-muted h-32 flex items-center justify-center rounded-md">
            <CameraIcon className="h-10 w-10 text-muted-foreground animate-pulse" />
          </div>
        )}
      </div>

      <Tabs defaultValue="registered" className="flex-grow flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="registered">
            <UsersIcon className="h-4 w-4 mr-2" />
            Registered
          </TabsTrigger>
          <TabsTrigger value="strangers">
            <UserIcon className="h-4 w-4 mr-2" />
            Strangers
          </TabsTrigger>
        </TabsList>
        <TabsContent value="registered" className="flex-grow">
          <ScrollArea className="h-[calc(100vh-300px)] border rounded-md p-2">
            {registered.map((person, index) => (
              <div key={index} className="flex items-center py-1">
                <CheckCircleIcon className="h-4 w-4 text-green-500 mr-2" />
                {person}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>
        <TabsContent value="strangers" className="flex-grow">
          <ScrollArea className="h-[calc(100vh-300px)] border rounded-md p-2">
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
        </TabsContent>
      </Tabs>

      <div className="mt-4 text-sm text-muted-foreground text-center">{status}</div>

      <Dialog open={isManualCheckInOpen} onOpenChange={setIsManualCheckInOpen}>
        <DialogTrigger asChild>
          <Button className="mt-4">
            <UserPlusIcon className="h-4 w-4 mr-2" />
            Manual Check-In
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manual Check-In</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <Label htmlFor="manualName">Name</Label>
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
        </DialogContent>
      </Dialog>
    </div>
  )
}