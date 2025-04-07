"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Home, Radio } from "lucide-react"

export default function TornadoPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Tornado Safety: Your Quick-Action Guide</h1>
        <p className="text-gray-500 mb-8">Tornadoes can strike with little warning. Knowing what to do can save your life.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Warning Signs
              </CardTitle>
              <ul className="space-y-2">
                <li>Dark, often greenish sky</li>
                <li>Large hail</li>
                <li>Wall cloud or funnel cloud</li>
                <li>Loud roar, similar to a freight train</li>
                <li>Sudden calm after thunderstorm</li>
                <li>Rotating clouds or debris</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Shield className="mr-2 text-blue-500" />
                Safe Locations
              </CardTitle>
              <ul className="space-y-2">
                <li>Basement or storm cellar</li>
                <li>Interior room on lowest floor:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Bathroom</li>
                    <li>Closet</li>
                    <li>Hallway</li>
                  </ul>
                </li>
                <li>Under a sturdy piece of furniture</li>
                <li>Cover yourself with blankets or mattress</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Home className="mr-2 text-green-500" />
                Home Preparation
              </CardTitle>
              <ul className="space-y-2">
                <li>Identify safe rooms in advance</li>
                <li>Practice tornado drills with family</li>
                <li>Keep emergency supplies in safe room</li>
                <li>Secure outdoor items that could become projectiles</li>
                <li>Consider installing a safe room or storm shelter</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Radio className="mr-2 text-purple-500" />
                During a Warning
              </CardTitle>
              <ul className="space-y-2">
                <li>Go to your safe location immediately</li>
                <li>Stay away from windows and doors</li>
                <li>Protect your head and neck</li>
                <li>Monitor weather updates</li>
                <li>If in a mobile home, evacuate to a sturdy building</li>
                <li>If outside, find a ditch or low-lying area</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-yellow-900">Tornado Intensity Scale (EF Scale)</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF0</h3>
              <p className="text-gray-700">65-85 mph</p>
              <p className="text-gray-700">Light damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF1</h3>
              <p className="text-gray-700">86-110 mph</p>
              <p className="text-gray-700">Moderate damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF2</h3>
              <p className="text-gray-700">111-135 mph</p>
              <p className="text-gray-700">Considerable damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF3</h3>
              <p className="text-gray-700">136-165 mph</p>
              <p className="text-gray-700">Severe damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF4</h3>
              <p className="text-gray-700">166-200 mph</p>
              <p className="text-gray-700">Devastating damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">EF5</h3>
              <p className="text-gray-700">200+ mph</p>
              <p className="text-gray-700">Incredible damage</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 