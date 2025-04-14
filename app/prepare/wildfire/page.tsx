"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Home, Car } from "lucide-react"

export default function WildfirePage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Wildfire Preparedness: Stay Safe in the Heat</h1>
        <p className="text-gray-500 mb-8">Wildfires can spread rapidly. Being prepared and knowing what to do can save your life and property.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Warning Signs
              </CardTitle>
              <ul className="space-y-2">
                <li>Unusual smoke or haze</li>
                <li>Strong smell of smoke</li>
                <li>Red flag warnings</li>
                <li>Extreme heat and dry conditions</li>
                <li>High winds</li>
                <li>Local emergency alerts</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Shield className="mr-2 text-blue-500" />
                Home Protection
              </CardTitle>
              <ul className="space-y-2">
                <li>Create defensible space:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Clear vegetation 30 feet from home</li>
                    <li>Remove dead plants and trees</li>
                    <li>Keep grass short</li>
                  </ul>
                </li>
                <li>Use fire-resistant materials</li>
                <li>Clean gutters and roofs</li>
                <li>Install spark arresters</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Home className="mr-2 text-green-500" />
                Evacuation Preparation
              </CardTitle>
              <ul className="space-y-2">
                <li>Pack essential items:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Important documents</li>
                    <li>Medications</li>
                    <li>Emergency supplies</li>
                    <li>Pet supplies</li>
                  </ul>
                </li>
                <li>Know multiple evacuation routes</li>
                <li>Have a communication plan</li>
                <li>Keep gas tank full</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                During Wildfire
              </CardTitle>
              <ul className="space-y-2">
                <li>Evacuate immediately if ordered</li>
                <li>Wear protective clothing</li>
                <li>Close all windows and doors</li>
                <li>Turn off gas and propane</li>
                <li>Leave lights on for visibility</li>
                <li>Follow designated evacuation routes</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-orange-900">Wildfire Safety Zones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg shadow-sm border-2 border-orange-200 relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-orange-500"></div>
              <h3 className="font-bold text-lg mb-4 text-white">Zone 1: Immediate Perimeter</h3>
              <p className="text-white mb-2">0-30 feet from home</p>
              <ul className="space-y-2 text-white">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Remove all flammable materials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use non-combustible materials</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep plants well-watered</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-lg shadow-sm border-2 border-orange-300 relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-orange-500"></div>
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-orange-300"></div>
              <h3 className="font-bold text-lg mb-4 text-white">Zone 2: Intermediate Zone</h3>
              <p className="text-white mb-2">30-100 feet from home</p>
              <ul className="space-y-2 text-white">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Space trees 10 feet apart</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Remove ladder fuels</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep grass mowed</span>
                </li>
              </ul>
            </div>
            <div className="p-6 rounded-lg shadow-sm border-2 border-orange-400 relative">
              <div className="absolute -top-3 -left-3 w-6 h-6 rounded-full bg-orange-500"></div>
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full border-2 border-orange-300"></div>
              <div className="absolute -top-3 -left-3 w-10 h-10 rounded-full border-2 border-orange-400"></div>
              <h3 className="font-bold text-lg mb-4 text-white">Zone 3: Extended Perimeter</h3>
              <p className="text-white mb-2">100-200 feet from home</p>
              <ul className="space-y-2 text-white">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Thin trees and brush</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Remove dead vegetation</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Maintain access roads</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 