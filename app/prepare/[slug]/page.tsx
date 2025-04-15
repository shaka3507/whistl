"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingChatButton } from "@/components/floating-chat-button"
import ReactMarkdown from "react-markdown"
import { ArrowLeftCircle, AlertTriangle, BookOpen, ExternalLink, ChevronDown } from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"

// Define the type for the JSON data structure
interface PrepareData {
  title: string
  description: string
  sections: {
    title: string
    content: string
  }[]
  resources: {
    title: string
    url: string
  }[]
}

export default function PreparePage() {
  const { slug } = useParams()
  const [data, setData] = useState<PrepareData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [scrollProgress, setScrollProgress] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  // Handle scroll to update text color
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return

      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      
      // Calculate scroll progress (0 to 1)
      const progress = Math.min(scrollTop / (documentHeight - windowHeight), 1)
      setScrollProgress(progress)
    }

    // Initial calculation
    handleScroll()

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true)
      try {
        // Attempt to fetch data from the public JSON file based on slug
        const response = await fetch(`/data/prepare/${slug}.json`)
        
        if (!response.ok) {
          throw new Error(`Failed to load data for ${slug}`)
        }
        
        const jsonData = await response.json()
        setData(jsonData)
        setError(null)
      } catch (err) {
        console.error(`Error loading prepare data for ${slug}:`, err)
        setError(`Unable to load information for "${slug}". Please try another topic.`)
        setData(null)
      } finally {
        setIsLoading(false)
      }
    }

    if (slug) {
      fetchData()
    }
  }, [slug])

  // Determine dark mode class based on scroll progress - always true in dark theme
  const isDarkMode = true;

  // Calculate text color styles based on scroll progress
  const getTextColorStyle = (baseProgress = 0) => {
    // Adjust progress to create a staggered effect for different sections
    const adjustedProgress = Math.max(0, Math.min(1, scrollProgress * 1.5 - baseProgress))
    
    // Interpolate between light grey and pure white text
    const startColor = [220, 220, 220]  // RGB for light grey text
    const endColor = [255, 255, 255]    // RGB for white text
    
    const r = Math.round(startColor[0] + (endColor[0] - startColor[0]) * adjustedProgress)
    const g = Math.round(startColor[1] + (endColor[1] - startColor[1]) * adjustedProgress)
    const b = Math.round(startColor[2] + (endColor[2] - startColor[2]) * adjustedProgress)
    
    return {
      color: `rgb(${r}, ${g}, ${b})`,
      transition: 'color 0.3s ease-out',
    }
  }

  // Get background style based on scroll progress
  const getBackgroundStyle = () => {
    // Create a gradient that stays black and gradually introduces very subtle color
    const black = [0, 0, 0]         // RGB for pure black (starting color)
    const darkCharcoal = [15, 15, 15]  // RGB for very dark charcoal (ending color)
    
    // Calculate interpolated color based on scroll progress
    const r = Math.round(black[0] + (darkCharcoal[0] - black[0]) * scrollProgress)
    const g = Math.round(black[1] + (darkCharcoal[1] - black[1]) * scrollProgress)
    const b = Math.round(black[2] + (darkCharcoal[2] - black[2]) * scrollProgress)
    
    // Create subtle gradient effect
    const gradient = `linear-gradient(to bottom, 
            rgb(${black[0]}, ${black[1]}, ${black[2]}) 0%, 
            rgb(${r}, ${g}, ${b}) 100%)`;

    return {
      background: gradient,
      transition: 'background 0.5s ease-out',
    };
  };

  // Enhanced fade in style that requires scrolling to see elements
  const getFadeStyle = (startPoint = 0.1, endPoint = 0.3) => {
    // Element becomes visible only after startPoint and reaches full opacity at endPoint
    const fadeIn = Math.min(1, Math.max(0, (scrollProgress - startPoint) / (endPoint - startPoint)));
    
    return {
      opacity: fadeIn,
      transform: `translateY(${(1 - fadeIn) * 25}px)`,
      transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
    };
  };

  // Loading state with black theme
  if (isLoading) {
    return (
      <div className="bg-black min-h-screen">
        <Header />
        <div className="container py-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center text-gray-200">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state with black theme
  if (error) {
    return (
      <div className="bg-black min-h-screen">
        <Header />
        <div className="container py-8">
          <div className="bg-red-950 border border-red-800 rounded-lg p-6 flex items-start text-red-100">
            <AlertTriangle className="text-red-400 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-red-300 mb-2">Content Not Found</h1>
              <p className="text-red-100 mb-4">{error}</p>
              <Link href="/prepare">
                <Button variant="outline" className="border-red-500 text-red-300 hover:bg-red-950">Return to Prepare Library</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If we have data, display the content with dark theme
  return (
    <div 
      style={getBackgroundStyle()} 
      className="min-h-screen prepare-transition overflow-x-hidden prepare-content prepare-dark-mode"
    >
      {/* Background glow effects */}
      <div 
        className="prepare-dark-glow fixed top-[20%] left-[10%]" 
        style={{ 
          opacity: Math.max(0, scrollProgress * 0.08 - 0.02),
          transform: `scale(${1 + scrollProgress * 0.5})`,
          transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.07), rgba(120, 120, 120, 0.03))'
        }}
      />
      <div 
        className="prepare-dark-glow fixed bottom-[30%] right-[15%]" 
        style={{ 
          opacity: Math.max(0, scrollProgress * 0.09 - 0.02),
          transform: `scale(${0.8 + scrollProgress * 0.6})`,
          transition: 'transform 0.5s ease-out, opacity 0.5s ease-out',
          background: 'radial-gradient(circle, rgba(200, 200, 200, 0.06), rgba(70, 70, 70, 0.02))'
        }}
      />
      
      <Header />
      <div className="container py-8" ref={contentRef}>
        {data && (
          <>
            <div className="mb-20 max-w-3xl mx-auto relative">
              <Link href="/prepare">
                  <ArrowLeftCircle className="mr-2 h-9 w-9 text-5xl mb-4" />
              </Link>
              <h1 
                className="text-4xl md:text-5xl font-bold mb-2 prepare-animate-title text-gray-100" 
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.min(1, scrollProgress * 4 + 0.2),
                  transform: `translateY(${Math.max(0, (1 - scrollProgress * 3) * 30)}px)`,
                }}
              >
                {data.title.includes(':') ? data.title.split(':')[0] : data.title}
              </h1>
              {data.title.includes(':') && (
                <p 
                  className="text-2xl md:text-3xl font-medium mb-6 prepare-animate-title text-gray-300" 
                  style={{
                    ...getTextColorStyle(0.05),
                    opacity: Math.min(1, scrollProgress * 4 + 0.1),
                    transform: `translateY(${Math.max(0, (1 - scrollProgress * 3) * 30)}px)`,
                  }}
                >
                  {data.title.split(':')[1].trim()}
                </p>
              )}
              <p 
                className="text-lg mb-8 prepare-animate-description text-gray-300" 
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.min(1, scrollProgress * 4),
                  transform: `translateY(${Math.max(0, (1 - scrollProgress * 3) * 30)}px)`,
                }}
              >
                {data.description}
              </p>
              
              {/* Scroll indicator */}
              <div 
                className="hidden md:flex flex-col items-center absolute -bottom-16 left-1/2 transform -translate-x-1/2"
                style={{
                  ...getTextColorStyle(),
                  opacity: Math.max(0, 0.8 - scrollProgress * 2)
                }}
              >
                <span className="text-sm mb-2">Scroll to explore</span>
                <ChevronDown className="h-5 w-5 animate-bounce" />
              </div>
              
              {/* Adjusted decorative elements for dark theme */}
              <div 
                className="absolute top-40 right-10 w-40 h-40 rounded-full blur-[80px] bg-gray-300/5 -z-10"
                style={{
                  ...getFadeStyle(0.1, 0.3),
                  opacity: 0.1 + scrollProgress * 0.2,
                }}
              />
              <div 
                className="absolute top-80 left-20 w-60 h-60 rounded-full blur-[100px] bg-gray-400/5 -z-10"
                style={{
                  ...getFadeStyle(0.2, 0.4),
                  opacity: 0.1 + scrollProgress * 0.15,
                }}
              />
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-16">
              {/* Left column - Table of contents */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <Card className="bg-black/30 border-gray-800/30 backdrop-filter backdrop-blur-sm border transition-all duration-300 shadow-xl">
                    <CardContent className="p-6">
                      <h2 
                        className="text-xl font-semibold mb-4 flex items-center"
                        style={getTextColorStyle()}
                      >
                        <BookOpen 
                          className="mr-2 h-5 w-5" 
                          style={getTextColorStyle()}
                        />
                        Contents
                      </h2>
                      <nav className="space-y-1">
                        {data.sections.map((section, index) => (
                          <a 
                            key={index}
                            href={`#section-${index}`}
                            className="block p-2 rounded-md transition-colors hover:bg-gray-900/50"
                            style={getTextColorStyle(index * 0.1)} // Staggered effect
                          >
                            {section.title}
                          </a>
                        ))}
                      </nav>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Right columns - Content sections */}
              <div className="lg:col-span-2 space-y-12">
                {data.sections.map((section, index) => (
                  <div 
                    key={index} 
                    id={`section-${index}`} 
                    className="scroll-mt-20"
                    style={getFadeStyle(0.1 + index * 0.1, 0.25 + index * 0.1)}
                  >
                    <h2 
                      className="text-2xl font-bold mb-4"
                      style={getTextColorStyle(index * 0.1)} // Staggered effect
                    >
                      {section.title}
                    </h2>
                    <Card className="bg-black/40 border-gray-800/30 backdrop-filter backdrop-blur-sm border transition-all duration-300">
                      <CardContent className="p-6 prose prose-invert max-w-none">
                        <div style={getTextColorStyle(index * 0.1 + 0.05)}>
                          <ReactMarkdown>{section.content}</ReactMarkdown>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Resources section */}
                {data.resources && data.resources.length > 0 && (
                  <div className="mt-16" style={getFadeStyle(0.7, 0.9)}>
                    <h2 
                      className="text-2xl font-bold mb-4"
                      style={getTextColorStyle(0.8)} // Later effect
                    >
                      Additional Resources
                    </h2>
                    <Card className="bg-black/40 border-gray-800/30 backdrop-filter backdrop-blur-sm border transition-all duration-300">
                      <CardContent className="p-6">
                        <ul className="space-y-2">
                          {data.resources.map((resource, index) => (
                            <li key={index}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center hover:underline transition-all duration-300 text-blue-400 hover:text-blue-300"
                                style={getTextColorStyle(0.8 + index * 0.05)}
                              >
                                {resource.title}
                                <ExternalLink className="ml-2 h-4 w-4" />
                              </a>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Mobile Floating Chat Button */}
      <FloatingChatButton />
    </div>
  )
} 