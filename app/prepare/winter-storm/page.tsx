"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Snowflake, Home, Car } from "lucide-react"

export default function WinterStormPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Winter Storm Survival: Beat the Freeze</h1>
        <p className="text-gray-500 mb-8">Winter storms can be dangerous. Learn how to stay safe and warm during extreme cold and snow.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Winter Storm Warnings
              </CardTitle>
              <ul className="space-y-2">
                <li>Winter Storm Watch: Be prepared</li>
                <li>Winter Storm Warning: Take action</li>
                <li>Blizzard Warning: Stay indoors</li>
                <li>Ice Storm Warning: Avoid travel</li>
                <li>Wind Chill Warning: Extreme cold</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Snowflake className="mr-2 text-blue-500" />
                Home Preparation
              </CardTitle>
              <ul className="space-y-2">
                <li>Insulate pipes and faucets</li>
                <li>Install storm windows or plastic</li>
                <li>Check heating systems</li>
                <li>Stock emergency supplies:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Extra blankets</li>
                    <li>Non-perishable food</li>
                    <li>Water</li>
                    <li>Flashlights</li>
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
                During the Storm
              </CardTitle>
              <ul className="space-y-2">
                <li>Stay indoors if possible</li>
                <li>Keep warm:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Wear layers</li>
                    <li>Use blankets</li>
                    <li>Close off unused rooms</li>
                  </ul>
                </li>
                <li>Check on neighbors</li>
                <li>Monitor weather updates</li>
                <li>Conserve heat and power</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                Travel Safety
              </CardTitle>
              <ul className="space-y-2">
                <li>Check road conditions</li>
                <li>Keep emergency kit in car:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Blankets</li>
                    <li>Food and water</li>
                    <li>Flashlight</li>
                    <li>Shovel</li>
                  </ul>
                </li>
                <li>Keep gas tank full</li>
                <li>Let someone know your route</li>
                <li>Drive slowly and carefully</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-blue-900">Cold Weather Safety</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Frostbite</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Signs: Numbness, white/gray skin</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prevention: Cover exposed skin</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Treatment: Warm gradually</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Seek medical help if severe</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Hypothermia</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Signs: Shivering, confusion</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prevention: Stay dry and warm</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Treatment: Warm core first</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Call 911 if severe</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Power Outages</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use generators safely</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep refrigerator closed</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use flashlights, not candles</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Stay with family/friends if needed</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 