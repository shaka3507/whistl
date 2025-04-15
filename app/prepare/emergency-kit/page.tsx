"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, Plus } from "lucide-react"

export default function EmergencyKitPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Emergency Kit Essentials</h1>
        <p className="text-gray-500 mb-8">A well-stocked emergency kit can be the difference between safety and danger during a disaster. Here's what you need to prepare.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <CheckCircle2 className="mr-2 text-green-500" />
                Basic Supplies
              </CardTitle>
              Start creating your emergency kit &gt;
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Plus className="mr-2 text-blue-500" />
                Personal Items
              </CardTitle>
              Start collecting the items that matter to you most &gt;
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
} 