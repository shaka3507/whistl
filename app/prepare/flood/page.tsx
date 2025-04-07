"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Umbrella, Car, Home } from "lucide-react"

export default function FloodPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Flood Survival: Rising Waters, Rising Awareness</h1>
        <p className="text-gray-500 mb-8">Floods are the most common natural disaster. Learn how to stay safe before, during, and after flooding.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Flood Warnings
              </CardTitle>
              <ul className="space-y-2">
                <li>Flash Flood Watch: Be prepared</li>
                <li>Flash Flood Warning: Take action</li>
                <li>Flood Watch: Flooding possible</li>
                <li>Flood Warning: Flooding occurring or imminent</li>
                <li>Urban and Small Stream Advisory: Minor flooding</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Umbrella className="mr-2 text-blue-500" />
                Before Flooding
              </CardTitle>
              <ul className="space-y-2">
                <li>Know your flood risk</li>
                <li>Purchase flood insurance</li>
                <li>Create a family emergency plan</li>
                <li>Prepare your home:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Install check valves</li>
                    <li>Elevate utilities</li>
                    <li>Waterproof basement</li>
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
                <Car className="mr-2 text-green-500" />
                During Flooding
              </CardTitle>
              <ul className="space-y-2">
                <li>Evacuate if ordered</li>
                <li>Move to higher ground</li>
                <li>Never walk or drive through flood waters:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>6 inches can knock you down</li>
                    <li>12 inches can carry away a car</li>
                  </ul>
                </li>
                <li>Stay away from bridges over fast-moving water</li>
                <li>Turn off utilities if instructed</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Home className="mr-2 text-purple-500" />
                After Flooding
              </CardTitle>
              <ul className="space-y-2">
                <li>Return only when authorities say it's safe</li>
                <li>Be aware of:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Downed power lines</li>
                    <li>Contaminated water</li>
                    <li>Damaged structures</li>
                  </ul>
                </li>
                <li>Document damage for insurance</li>
                <li>Clean and disinfect everything</li>
                <li>Wear protective clothing during cleanup</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-blue-900">Flood Safety Tips</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Home Safety</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep gutters clear</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Install sump pumps</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Elevate appliances</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Store valuables upstairs</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Vehicle Safety</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Never drive through flood waters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Have an evacuation route</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep gas tank full</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Carry emergency supplies</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Community Safety</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Know evacuation routes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Identify shelters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Stay informed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Help neighbors if safe</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 