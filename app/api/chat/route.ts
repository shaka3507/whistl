import { NextResponse } from "next/server"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = "https://api.deepseek.com/v1/chat/completions"

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!DEEPSEEK_API_KEY) {
      console.error("DeepSeek API key is missing")
      return NextResponse.json(
        { error: "API configuration error" },
        { status: 500 }
      )
    }

    console.log("Making request to DeepSeek API...")
    const response = await fetch(DEEPSEEK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant specialized in weather and crisis preparedness. Provide accurate, concise, and practical information about weather events, emergency preparedness, and crisis management. Focus on safety and actionable advice.",
          },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      const errorMessage = errorData?.error?.message || errorData?.error || response.statusText
      console.error("DeepSeek API error:", {
        status: response.status,
        message: errorMessage,
      })
      return NextResponse.json(
        { 
          error: "Failed to get response from AI",
          details: errorMessage
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json({ response: data.choices[0].message.content })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("Error in chat API:", errorMessage)
    return NextResponse.json(
      { 
        error: "Failed to process chat request",
        details: errorMessage
      },
      { status: 500 }
    )
  }
} 