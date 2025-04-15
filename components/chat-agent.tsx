"use client"

import { useState, useRef, useEffect, memo, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Send, Loader2, AlertCircle, Copy, Check } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import ReactMarkdown from "react-markdown"
import { toast } from "sonner"

interface Message {
  role: "user" | "assistant"
  content: string
}

function ChatAgentComponent() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedMessageIndex, setCopiedMessageIndex] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  const handleCopy = useCallback(async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedMessageIndex(index)
      toast.success("Message copied to clipboard")
      setTimeout(() => setCopiedMessageIndex(null), 2000)
    } catch (err) {
      toast.error("Failed to copy message")
    }
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    setIsLoading(true)
    setError(null)

    setMessages(prev => [...prev, { role: "user", content: userMessage }])

    try {
      console.log("Sending chat request...")
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMessage = data.details || data.error || "Failed to get response from AI"
        console.error("Chat API error:", errorMessage)
        throw new Error(errorMessage)
      }

      setMessages(prev => [...prev, { role: "assistant", content: data.response }])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
      console.error("Error in chat:", errorMessage)
      setError(errorMessage)
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "I'm sorry, I encountered an error. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, messages])

  return (
    <div className="w-full h-full flex flex-col">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-3 ${
                message.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.role === "assistant" ? (
                <div className="space-y-2">
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleCopy(message.content, index)}
                  >
                    {copiedMessageIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ) : (
                message.content
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg p-3">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 p-4 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about weather or crisis preparedness..."
          className="flex-1 h-12 text-base"
        />
        <Button 
          type="submit" 
          disabled={isLoading} 
          className="h-12 w-12 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 bg-primary hover:bg-primary/90"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  )
}

export const ChatAgent = memo(ChatAgentComponent) 