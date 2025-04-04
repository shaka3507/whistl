import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function PreparePage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Emergency Preparedness</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/prepare/weather-events" className="block h-full">
            <Card className="h-full transition-all hover:shadow-md">
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">Learn more about extreme weather events in your area</CardTitle>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/prepare/create-plan" className="block h-full">
            <Card className="h-full transition-all hover:shadow-md">
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">Create a plan for the next disaster</CardTitle>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/prepare/test-knowledge" className="block h-full">
            <Card className="h-full transition-all hover:shadow-md">
              <CardContent className="p-6">
                <CardTitle className="text-xl mb-2">Think you know it already? Test your knowledge</CardTitle>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  )
} 