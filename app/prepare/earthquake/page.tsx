"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, Home, Car } from "lucide-react"

export default function EarthquakePage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Earthquake Preparedness: Shake, Rattle & Ready</h1>
        <p className="text-gray-500 mb-8">Earthquakes can strike without warning. Being prepared can save your life and protect your property.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <AlertTriangle className="mr-2 text-red-500" />
                During an Earthquake
              </CardTitle>
              <ul className="space-y-2">
                <li>Drop, Cover, and Hold On:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Drop to your hands and knees</li>
                    <li>Cover your head and neck</li>
                    <li>Hold on to sturdy furniture</li>
                  </ul>
                </li>
                <li>If indoors:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Stay inside</li>
                    <li>Stay away from windows</li>
                    <li>Do not use elevators</li>
                  </ul>
                </li>
                <li>If outdoors:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Move to open area</li>
                    <li>Avoid buildings and power lines</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Shield className="mr-2 text-blue-500" />
                Home Preparation
              </CardTitle>
              <ul className="space-y-2">
                <li>Secure heavy furniture</li>
                <li>Install latches on cabinets</li>
                <li>Anchor water heater</li>
                <li>Know how to shut off:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Gas</li>
                    <li>Water</li>
                    <li>Electricity</li>
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
                After an Earthquake
              </CardTitle>
              <ul className="space-y-2">
                <li>Check for injuries</li>
                <li>Check for damage:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Gas leaks</li>
                    <li>Electrical damage</li>
                    <li>Structural damage</li>
                  </ul>
                </li>
                <li>Be prepared for aftershocks</li>
                <li>Listen to emergency broadcasts</li>
                <li>Help neighbors if safe</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <Car className="mr-2 text-purple-500" />
                Emergency Kit
              </CardTitle>
              <ul className="space-y-2">
                <li>Essential supplies:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Water and food</li>
                    <li>First aid kit</li>
                    <li>Flashlight and batteries</li>
                    <li>Whistle</li>
                    <li>Dust mask</li>
                  </ul>
                </li>
                <li>Important documents</li>
                <li>Cash and medications</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="bg-yellow-100 p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-6 text-yellow-900">Earthquake Magnitude Scale</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">2.5 or less</h3>
              <p className="text-gray-700">Usually not felt</p>
              <p className="text-gray-700">Minor damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">2.5 to 5.4</h3>
              <p className="text-gray-700">Often felt</p>
              <p className="text-gray-700">Minor damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">5.5 to 6.0</h3>
              <p className="text-gray-700">Slight damage</p>
              <p className="text-gray-700">Buildings affected</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">6.1 to 6.9</h3>
              <p className="text-gray-700">Serious damage</p>
              <p className="text-gray-700">Widespread damage</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="font-bold text-lg mb-4 text-yellow-800">7.0 or greater</h3>
              <p className="text-gray-700">Major damage</p>
              <p className="text-gray-700">Catastrophic</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 