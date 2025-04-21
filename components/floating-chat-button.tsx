"use client"

import { useState, memo } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent,DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare } from "lucide-react"
import { ChatAgent } from "./chat-agent"

function FloatingChatButtonComponent() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="fixed top-20 right-4 ">
        <Button
          size="icon"
          className="h-16 w-16 rounded-full shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          whist.AI
        </Button>
      </div>

      {/* Mobile Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[100vw] h-[80vh] bottom-0">
          <DialogHeader>
            <DialogTitle>whist.ai</DialogTitle>
            <DialogDescription>Ask our chatbot more on how to prepare</DialogDescription>
            <DialogDescription className="text-sm text-gray-500 underline">what sources do we use?</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {isOpen && <ChatAgent />}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

export const FloatingChatButton = memo(FloatingChatButtonComponent) 