"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Clock, Home, Car } from "lucide-react"

export default function HurricanePage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Hurricane Preparedness: Before, During & After</h1>
        <p className="text-gray-500 mb-8">Hurricanes are among nature's most powerful and destructive phenomena. Being prepared can save lives and property.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Clock className="mr-2 text-blue-500" />
                Before the Storm
              </CardTitle>
              <ul className="space-y-2">
                <li>Know your evacuation zone and route</li>
                <li>Prepare your home:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Install storm shutters or board up windows</li>
                    <li>Clear gutters and downspouts</li>
                    <li>Secure outdoor furniture and items</li>
                    <li>Trim trees and shrubs</li>
                  </ul>
                </li>
                <li>Review your insurance coverage</li>
                <li>Create a family communication plan</li>
                <li>Charge all electronic devices</li>
                <li>Fill your car's gas tank</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                During the Storm
              </CardTitle>
              <ul className="space-y-2">
                <li>Stay indoors and away from windows</li>
                <li>If evacuation is ordered, leave immediately</li>
                <li>Monitor local news and weather updates</li>
                <li>Use flashlights instead of candles</li>
                <li>If power goes out, turn off major appliances</li>
                <li>Stay in your safe room until the storm passes</li>
                <li>Do not go outside during the eye of the storm</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Home className="mr-2 text-green-500" />
                After the Storm
              </CardTitle>
              <ul className="space-y-2">
                <li>Wait for official word that it's safe to return</li>
                <li>Be cautious of:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Downed power lines</li>
                    <li>Flooded areas</li>
                    <li>Damaged buildings</li>
                    <li>Debris</li>
                  </ul>
                </li>
                <li>Document damage for insurance claims</li>
                <li>Check on neighbors, especially elderly</li>
                <li>Use generators safely and outdoors only</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                Evacuation Tips
              </CardTitle>
              <ul className="space-y-2">
                <li>Know your evacuation route in advance</li>
                <li>Pack essential items only</li>
                <li>Bring important documents</li>
                <li>Have a full tank of gas</li>
                <li>Follow designated evacuation routes</li>
                <li>Keep emergency supplies in your car</li>
                <li>Have a plan for pets</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Hurricane Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-bold">Category 1</h3>
              <p>74-95 mph winds</p>
              <p>Minimal damage</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-bold">Category 2</h3>
              <p>96-110 mph winds</p>
              <p>Moderate damage</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-bold">Category 3</h3>
              <p>111-129 mph winds</p>
              <p>Major damage</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-bold">Category 4</h3>
              <p>130-156 mph winds</p>
              <p>Severe damage</p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h3 className="font-bold">Category 5</h3>
              <p>157+ mph winds</p>
              <p>Catastrophic damage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 