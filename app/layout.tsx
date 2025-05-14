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
  generator: 'v0.dev + shaka c',
  icons: {
    icon: [
      {
        media: '(prefers-color-scheme: light)',
        url: '/favicon.svg',
        href: '/favicon.svg',
      },
      {
        media: '(prefers-color-scheme: dark)',
        url: '/favicon/favicon-dark.svg',
        href: '/favicon/favicon-dark.svg',
      },
    ],
    apple: [
      { url: '/apple-touch-icon.svg' }
    ],
    other: [
      {
        rel: 'mask-icon',
        url: '/favicon.svg',
      }
    ]
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={manrope.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="whistl-theme"
          disableTransitionOnChange
        >
          <AuthProvider>{children}</AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}