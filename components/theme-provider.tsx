'use client'

import * as React from 'react'
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from 'next-themes'

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  // Using forcedTheme during initial render to avoid hydration mismatch
  const [mounted, setMounted] = React.useState(false)

  // After mounting, we have access to the client
  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <NextThemesProvider 
      {...props}
      enableSystem={mounted ? props.enableSystem : false}
      enableColorScheme={mounted ? props.enableColorScheme : false}
      storageKey="whistl-theme"
    >
      {children}
    </NextThemesProvider>
  )
}
