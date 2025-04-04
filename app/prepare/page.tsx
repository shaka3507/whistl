"use client"

import { useState, useMemo } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Link from "next/link"

// Card data structure
interface CardData {
  id: string
  title: string
  href: string
}

export default function PreparePage() {
  const [searchTerm, setSearchTerm] = useState("")
  
  // All cards data
  const allCards: CardData[] = [
    { id: "kit", title: "Emergency kit essentials", href: "/prepare/create-plan" },
    { id: "weather", title: "Learn more about extreme weather events in your area", href: "/prepare/weather" },
    { id: "plan", title: "Create a plan for the next disaster", href: "/prepare/create-plan" },
    { id: "events", title: "Upcoming events", href: "/prepare/create-plan" },
    { id: "fire-drills", title: "Mitigate risk", href: "/prepare/create-plan" },
    { id: "test", title: "Think you know it already? Test your knowledge", href: "/prepare/test" },
    { id: "fire-history", title: "The history of fire drills", href: "/prepare/create-plan" },
    { id: "test-2", title: "Think you know it already? Test your knowledge", href: "/prepare/test" },
    { id: "kit-2", title: "Emergency kit essentials", href: "/prepare/create-plan" },
    { id: "hurricane", title: "Hurricane season", href: "/prepare/create-plan" },
    { id: "snow", title: "Lake effect snow", href: "/prepare/create-plan" },
  ]
  
  // Filter cards based on search term
  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return allCards
    
    const lowerCaseSearch = searchTerm.toLowerCase()
    return allCards.filter(card => 
      card.title.toLowerCase().includes(lowerCaseSearch)
    )
  }, [searchTerm, allCards])
  
  // First row cards (first 4 items or less if filtered)
  const firstRowCards = filteredCards.slice(0, 4)
  
  // Second row cards (remaining items)
  const secondRowCards = filteredCards.slice(4)
  
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Prepare Library</h1>
        <p className="text-gray-500 mb-8">Search for resources to help you prepare for disasters.</p>
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {filteredCards.length === 0 ? (
          <div className="py-8 text-center">
            <h3 className="text-lg font-medium text-gray-500">No resources found matching "{searchTerm}"</h3>
          </div>
        ) : (
          <>
            {/* First row - horizontally scrollable */}
            {firstRowCards.length > 0 && (
              <div className="mb-6 sm:px-4 md:px-4 lg:px-0">
                <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
                  <div className="flex gap-4">
                    {firstRowCards.map(card => (
                      <Link 
                        key={card.id} 
                        href={card.href} 
                        className="block flex-shrink-0 w-[280px] snap-start"
                      >
                        <Card className="h-full transition-all hover:shadow-md">
                          <CardContent className="p-6">
                            <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Second row - horizontally scrollable */}
            {secondRowCards.length > 0 && (
              <div className="px-4">
                <div className="flex overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4">
                  <div className="flex gap-4">
                    {secondRowCards.map(card => (
                      <Link 
                        key={card.id}
                        href={card.href}
                        className="block flex-shrink-0 w-[280px] snap-start"
                      >
                        <Card className="h-full transition-all hover:shadow-md">
                          <CardContent className="p-6">
                            <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 