import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Manrope } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/context/auth-context"
import { Toaster } from "@/components/ui/toaster"

const manrope = Manrope({ 
  subsets: ["latin"],
  // Optionally specify weights if you don't want all weights
  // weight: ['400', '500', '600', '700', '800'],
  // Variable fonts are recommended for modern typography
  variable: '--font-manrope',
})

export const metadata: Metadata = {
  title: "whistl - emergency preparedness platform",
  description: "Coordinate emergency response and crisis management",
  generator: 'v0.dev + shaka c'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}