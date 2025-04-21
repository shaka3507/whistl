"use client"

import { useState, useMemo, useEffect } from "react"
import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, CheckCircle } from "lucide-react"
import Link from "next/link"
import { ChatAgent } from "@/components/chat-agent"
import { FloatingChatButton } from "@/components/floating-chat-button"
import { useParams } from "next/navigation"
import { supabase } from "@/lib/supabase"

// Card data structure
interface CardData {
  id: string
  title: string
  href: string
  is_module?: boolean
}

export default function PreparePage() {
  const { slug } = useParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set())

  // All cards data
  const allCards: CardData[] = [
    { id: "emergency-kit", is_module: true, title: "Emergency Kit Essentials: Your Lifeline in Crisis", href: "/prepare/emergency-kit" },
    { id: "hurricane", is_module: true, title: "Hurricane Preparedness: Before, During & After", href: "/prepare/hurricane" },
    { id: "tornado", is_module: true, title: "Tornado Safety: Your Quick-Action Guide", href: "/prepare/tornado" },
    { id: "flood", title: "Flood Survival: Rising Waters, Rising Awareness", href: "/prepare/flood" },
    { id: "wildfire", is_module: true, title: "Wildfire Preparedness: Stay Safe in the Heat", href: "/prepare/wildfire" },
    { id: "winter", is_module: true, title: "Winter Storm Survival: Beat the Freeze", href: "/prepare/winter-storm" },
    { id: "heatwave", is_module: true, title: "Heat Wave Safety: Cool Tips for Hot Days", href: "/prepare/heatwave" },
    { id: "thunderstorm", title: "Thunderstorm Safety: Weather the Storm", href: "/prepare/thunderstorm" },
    { id: "earthquake", title: "Earthquake Preparedness: Shake, Rattle & Ready", href: "/prepare/earthquake" },
    { id: "family-plan", title: "Family Emergency Plan: Your Safety Blueprint", href: "/prepare/family-plan" },
    { id: "pet-safety", title: "Pet Emergency Preparedness: Keep Your Furry Friends Safe", href: "/prepare/pet-safety" }
  ]
  
  // Filter cards based on search term
  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return allCards
    
    const lowerCaseSearch = searchTerm.toLowerCase()
    return allCards.filter(card => 
      card.title.toLowerCase().includes(lowerCaseSearch)
    )
  }, [searchTerm, allCards])
  
  // Filter cards based on search term and is_module
  const moduleCards = useMemo(() => {
    return filteredCards.filter(card => card.is_module)
  }, [filteredCards])

  const nonModuleCards = useMemo(() => {
    return filteredCards.filter(card => !card.is_module)
  }, [filteredCards])

  // First row cards (modules)
  const firstRowCards = moduleCards

  // Second row cards (non-modules)
  const secondRowCards = nonModuleCards

  useEffect(() => {
    async function fetchCompletionStatuses() {
      // Get the user ID from Supabase auth
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        console.error('User not authenticated')
        return
      }

      // Fetch completion statuses for all modules
      const { data, error } = await supabase
        .from('module_progress')
        .select('module_name')
        .eq('user_id', user.id)
        .eq('completed', true)

      if (error) {
        console.error('Error fetching completion statuses:', error)
        return
      }

      // Create a set of completed module IDs
      const completedSet = new Set(data.map((entry: { module_name: string }) => entry.module_name))
      setCompletedModules(completedSet)
    }

    fetchCompletionStatuses()
  }, [])

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
                <h2 className="text-2xl font-bold mb-4">Prepare and Test</h2>
                <h3 className="text-lg font-medium text-gray-500 mb-4">Complete the following modules to test your knowledge.</h3>
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
                            {card.title.includes(':') ? (
                              <>
                                <CardTitle className="text-xl mb-1">{card.title.split(':')[0]}</CardTitle>
                                <p className="text-sm text-gray-500 font-medium">{card.title.split(':')[1].trim()}</p>
                              </>
                            ) : (
                              <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                            )}
                            {card.is_module && completedModules.has(card.id) && (
                              <div className="flex items-center text-green-500 mt-2">
                                <CheckCircle className="mr-1" />
                                <span>Completed</span>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                    {/* Ensure the chat agent button is in the same row */}
                    <div className="flex-shrink-0 w-[280px] snap-start">
                      <Link href="/chat-agent" className="bg-blue-500 text-white px-6 py-3 text-lg rounded-full shadow-lg hover:bg-blue-600 transition">
                        Ask our whist.AI chat assistant
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Second row - Learn section */}
            {secondRowCards.length > 0 && (
              <div className="px-4">
                <h2 className="text-2xl font-bold mb-4">Learn</h2>
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
                            {card.title.includes(':') ? (
                              <>
                                <CardTitle className="text-xl mb-1">{card.title.split(':')[0]}</CardTitle>
                                <p className="text-sm text-gray-500 font-medium">{card.title.split(':')[1].trim()}</p>
                              </>
                            ) : (
                              <CardTitle className="text-xl mb-2">{card.title}</CardTitle>
                            )}
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

      {/* Mobile Floating Chat Button */}
      <FloatingChatButton />

      {/* Add a new hovering button for the chat agent */}
      <div className="hidden md:block fixed bottom-4 right-4">
        <Link href="/chat-agent" className="bg-blue-500 text-white w-16 h-16 flex items-center justify-center rounded-full shadow-lg hover:bg-blue-600 transition">
          <span className="sr-only">Ask our whist.AI chat assistant</span>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M9 16h6M21 12c0 4.418-3.582 8-8 8a7.963 7.963 0 01-4.9-1.7L3 21l1.7-5.1A7.963 7.963 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
          </svg>
        </Link>
      </div>
    </div>
  )
} 