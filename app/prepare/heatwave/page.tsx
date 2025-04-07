"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Sun, Home, Heart } from "lucide-react"

export default function HeatWavePage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Heat Wave Safety: Cool Tips for Hot Days</h1>
        <p className="text-gray-500 mb-8">Extreme heat can be dangerous. Learn how to stay cool and safe during heat waves.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Heat Alerts
              </CardTitle>
              <ul className="space-y-2">
                <li>Excessive Heat Watch: Be prepared</li>
                <li>Excessive Heat Warning: Take action</li>
                <li>Heat Advisory: Stay alert</li>
                <li>Heat Index: "Feels like" temperature</li>
                <li>UV Index: Sun protection needed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Sun className="mr-2 text-yellow-500" />
                Stay Cool
              </CardTitle>
              <ul className="space-y-2">
                <li>Stay in air-conditioned places</li>
                <li>Use fans and cool showers</li>
                <li>Wear lightweight clothing</li>
                <li>Limit outdoor activities</li>
                <li>Stay hydrated:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Drink water regularly</li>
                    <li>Avoid alcohol and caffeine</li>
                    <li>Eat light meals</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Home className="mr-2 text-green-500" />
                Home Safety
              </CardTitle>
              <ul className="space-y-2">
                <li>Keep windows covered during day</li>
                <li>Use fans to circulate air</li>
                <li>Check on neighbors</li>
                <li>Know cooling centers in your area</li>
                <li>Prepare for power outages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Heart className="mr-2 text-purple-500" />
                Health Risks
              </CardTitle>
              <ul className="space-y-2">
                <li>Heat Exhaustion:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Heavy sweating</li>
                    <li>Weakness</li>
                    <li>Dizziness</li>
                    <li>Nausea</li>
                  </ul>
                </li>
                <li>Heat Stroke:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>High body temperature</li>
                    <li>Confusion</li>
                    <li>Loss of consciousness</li>
                    <li>Call 911 immediately</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-red-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-red-900">Special Considerations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-red-800">For Children</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Never leave in parked cars</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Dress in light clothing</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Schedule outdoor play early/late</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Provide plenty of water</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-red-800">For Seniors</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check medications</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Stay in cool places</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Drink water regularly</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use cooling devices</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-red-800">For Pets</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Provide shade and water</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Limit exercise</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Never leave in cars</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Watch for heat stress</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 