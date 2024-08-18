import type { ThemeName } from '@channel.io/bezier-react'
import { createContext } from 'react'

interface ThemeContextProps {
  theme: ThemeName
  setTheme: (themeName: ThemeName) => void
}

export const ThemeContext = createContext<ThemeContextProps>({
  theme: 'light',
  setTheme: () => {},
})
