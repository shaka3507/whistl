"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CloudLightning, Home, Car } from "lucide-react"

export default function ThunderstormPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Thunderstorm Safety: Weather the Storm</h1>
        <p className="text-gray-500 mb-8">Thunderstorms can bring dangerous lightning, strong winds, and heavy rain. Learn how to stay safe.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Storm Warnings
              </CardTitle>
              <ul className="space-y-2">
                <li>Severe Thunderstorm Watch: Be prepared</li>
                <li>Severe Thunderstorm Warning: Take action</li>
                <li>Flash Flood Warning: Move to higher ground</li>
                <li>Tornado Watch: Be ready to shelter</li>
                <li>Tornado Warning: Take shelter immediately</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <CloudLightning className="mr-2 text-yellow-500" />
                Lightning Safety
              </CardTitle>
              <ul className="space-y-2">
                <li>When thunder roars, go indoors</li>
                <li>Stay inside for 30 minutes after last thunder</li>
                <li>Avoid:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Water</li>
                    <li>Electronic equipment</li>
                    <li>Corded phones</li>
                    <li>Windows and doors</li>
                  </ul>
                </li>
                <li>If outside, find shelter immediately</li>
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
                <li>Unplug electronic equipment</li>
                <li>Stay away from windows</li>
                <li>Close blinds and curtains</li>
                <li>Prepare for power outages</li>
                <li>Have emergency supplies ready</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                Outdoor Safety
              </CardTitle>
              <ul className="space-y-2">
                <li>If driving:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Pull over safely</li>
                    <li>Stay in vehicle</li>
                    <li>Avoid touching metal</li>
                  </ul>
                </li>
                <li>If outside:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Find shelter immediately</li>
                    <li>Avoid tall objects</li>
                    <li>Stay away from water</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-gray-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Thunderstorm Facts</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Lightning</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Strikes 25 million times/year</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Can reach 50,000°F</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Travels at 1/3 speed of light</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Can strike 10 miles from storm</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Thunder</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Sound of lightning</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Can be heard 10 miles away</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Travels 1 mile in 5 seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Indicates storm distance</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-gray-800">Safety Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Count seconds between lightning and thunder</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Divide by 5 for miles away</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Seek shelter if less than 30 seconds</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Wait 30 minutes after last thunder</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 