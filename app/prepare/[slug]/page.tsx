"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FloatingChatButton } from "@/components/floating-chat-button"
import ReactMarkdown from "react-markdown"
import { AlertTriangle, BookOpen, ExternalLink } from "lucide-react"
import Link from "next/link"

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

  // Loading state
  if (isLoading) {
    return (
      <div>
        <Header />
        <div className="container py-8 flex justify-center items-center min-h-[50vh]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div>
        <Header />
        <div className="container py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start">
            <AlertTriangle className="text-red-500 mr-4 mt-1 flex-shrink-0" />
            <div>
              <h1 className="text-2xl font-bold text-red-700 mb-2">Content Not Found</h1>
              <p className="text-gray-700 mb-4">{error}</p>
              <Link href="/prepare">
                <Button variant="outline">Return to Prepare Library</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If we have data, display the content
  return (
    <div>
      <Header />
      <div className="container py-8">
        {data && (
          <>
            <div className="mb-8">
              <Link href="/prepare">
                <Button variant="ghost" size="sm" className="mb-4">
                  ← Back to Prepare Library
                </Button>
              </Link>
              <h1 className="text-3xl font-bold mb-4">{data.title}</h1>
              <p className="text-gray-500 mb-8">{data.description}</p>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left column - Table of contents */}
              <div className="lg:col-span-1">
                <div className="sticky top-20">
                  <Card>
                    <CardContent className="p-6">
                      <h2 className="text-xl font-semibold mb-4 flex items-center">
                        <BookOpen className="mr-2 h-5 w-5" />
                        Contents
                      </h2>
                      <nav className="space-y-1">
                        {data.sections.map((section, index) => (
                          <a 
                            key={index}
                            href={`#section-${index}`}
                            className="block p-2 hover:bg-muted rounded-md transition-colors"
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
              <div className="lg:col-span-2 space-y-8">
                {data.sections.map((section, index) => (
                  <div key={index} id={`section-${index}`}>
                    <h2 className="text-2xl font-bold mb-4">{section.title}</h2>
                    <Card>
                      <CardContent className="p-6 prose prose-slate max-w-none">
                        <ReactMarkdown>{section.content}</ReactMarkdown>
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Resources section */}
                {data.resources && data.resources.length > 0 && (
                  <div className="mt-8">
                    <h2 className="text-2xl font-bold mb-4">Additional Resources</h2>
                    <Card>
                      <CardContent className="p-6">
                        <ul className="space-y-2">
                          {data.resources.map((resource, index) => (
                            <li key={index}>
                              <a
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-blue-600 hover:text-blue-800 hover:underline"
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