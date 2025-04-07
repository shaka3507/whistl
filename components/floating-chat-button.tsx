"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MessageSquare } from "lucide-react"
import { ChatAgent } from "./chat-agent"

export function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Floating Button */}
      <div className="fixed top-20 right-4 md:hidden">
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
            <DialogTitle>whist.AI - ask crisis preparedness questions</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            <ChatAgent />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 