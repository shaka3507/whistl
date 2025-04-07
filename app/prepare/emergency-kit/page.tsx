"use client"

import { Header } from "@/components/header"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { CheckCircle2, AlertCircle } from "lucide-react"

export default function EmergencyKitPage() {
  return (
    <div>
      <Header />
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-4">Emergency Kit Essentials: Your Lifeline in Crisis</h1>
        <p className="text-gray-500 mb-8">A well-stocked emergency kit can be the difference between safety and danger during a disaster. Here's what you need to prepare.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <CheckCircle2 className="mr-2 text-green-500" />
                Basic Supplies
              </CardTitle>
              <ul className="space-y-2">
                <li>Water (1 gallon per person per day for at least 3 days)</li>
                <li>Non-perishable food (3-day supply)</li>
                <li>Manual can opener</li>
                <li>Battery-powered or hand crank radio</li>
                <li>Flashlight with extra batteries</li>
                <li>First aid kit</li>
                <li>Whistle to signal for help</li>
                <li>Dust mask to filter contaminated air</li>
                <li>Plastic sheeting and duct tape</li>
                <li>Moist towelettes, garbage bags, and plastic ties</li>
                <li>Wrench or pliers to turn off utilities</li>
                <li>Local maps</li>
                <li>Cell phone with chargers and backup battery</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <CardTitle className="text-xl mb-4 flex items-center">
                <CheckCircle2 className="mr-2 text-green-500" />
                Personal Items
              </CardTitle>
              <ul className="space-y-2">
                <li>Prescription medications (7-day supply)</li>
                <li>Medical supplies (hearing aids, glasses, contact lenses)</li>
                <li>Personal hygiene items</li>
                <li>Change of clothes for each person</li>
                <li>Sleeping bag or warm blanket for each person</li>
                <li>Important documents in waterproof container:
                  <ul className="ml-4 mt-2 space-y-1">
                    <li>Insurance policies</li>
                    <li>Identification</li>
                    <li>Bank account records</li>
                    <li>Emergency contact list</li>
                  </ul>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <CardTitle className="text-xl mb-4 flex items-center">
              <AlertCircle className="mr-2 text-yellow-500" />
              Additional Considerations
            </CardTitle>
            <div className="space-y-4">
              <p><strong>For Families:</strong> Include games and activities for children, and consider their specific needs.</p>
              <p><strong>For Pets:</strong> Food, water, medications, leash, carrier, and vaccination records.</p>
              <p><strong>For Seniors:</strong> Extra medications, medical equipment, and mobility aids.</p>
              <p><strong>For Babies:</strong> Formula, diapers, bottles, and other infant supplies.</p>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Maintenance Tips</h2>
          <ul className="space-y-2">
            <li>Check your kit every 6 months</li>
            <li>Replace expired items</li>
            <li>Update documents and contact information</li>
            <li>Consider seasonal needs (winter/summer items)</li>
            <li>Keep your kit in an easily accessible location</li>
          </ul>
        </div>
      </div>
    </div>
  )
} 