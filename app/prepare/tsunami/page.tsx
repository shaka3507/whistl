"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Waves, Home, Car } from "lucide-react"

export default function TsunamiPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Tsunami Preparedness: Wave of Awareness</h1>
        <p className="text-gray-500 mb-8">Tsunamis are powerful waves that can cause devastating damage. Learn how to stay safe before, during, and after a tsunami.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                Warning Signs
              </CardTitle>
              <ul className="space-y-2">
                <li>Natural warnings:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Strong earthquake</li>
                    <li>Unusual ocean behavior</li>
                    <li>Loud ocean roar</li>
                  </ul>
                </li>
                <li>Official warnings:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Tsunami Watch</li>
                    <li>Tsunami Advisory</li>
                    <li>Tsunami Warning</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Waves className="mr-2 text-blue-500" />
                Evacuation
              </CardTitle>
              <ul className="space-y-2">
                <li>Know your evacuation route</li>
                <li>Move to higher ground:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>At least 100 feet above sea level</li>
                    <li>At least 1 mile inland</li>
                  </ul>
                </li>
                <li>Follow evacuation signs</li>
                <li>Do not wait for official warning</li>
                <li>Help others if possible</li>
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
                <li>Know your risk zone</li>
                <li>Prepare emergency kit</li>
                <li>Plan evacuation route</li>
                <li>Secure important documents</li>
                <li>Know community warning systems</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                During Tsunami
              </CardTitle>
              <ul className="space-y-2">
                <li>If near coast:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Move inland immediately</li>
                    <li>Go to higher ground</li>
                    <li>Follow evacuation routes</li>
                  </ul>
                </li>
                <li>If at sea:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Move to deeper water</li>
                    <li>Stay away from harbors</li>
                    <li>Monitor radio for updates</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-blue-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-blue-900">Tsunami Safety Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">Before</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Know evacuation routes</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Prepare emergency kit</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Learn warning signs</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Practice evacuation drills</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">During</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Move to higher ground</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Follow official instructions</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Stay away from coast</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Help others if safe</span>
                </li>
              </ul>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-blue-800">After</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Wait for official clearance</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check for injuries</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Be cautious of debris</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Help with cleanup if safe</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 