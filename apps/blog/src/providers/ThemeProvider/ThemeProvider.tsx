import type { ThemeName } from '@channel.io/bezier-react'
import { AppProvider, ToastProvider } from '@channel.io/bezier-react'
import type { PropsWithChildren } from 'react'
import { useMemo, useState } from 'react'
import { ThemeContext } from './themeContext'

interface ThemeProviderProps {
  defaultTheme: ThemeName
}

export function ThemeProvider({
  children,
  defaultTheme,
}: PropsWithChildren<ThemeProviderProps>) {
  const [theme, setTheme] = useState<ThemeName>(defaultTheme)
  const themeContextValue = useMemo(() => ({ theme, setTheme }), [theme])

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <AppProvider themeName={theme}>
        <ToastProvider>{children}</ToastProvider>
      </AppProvider>
    </ThemeContext.Provider>
  )
}
