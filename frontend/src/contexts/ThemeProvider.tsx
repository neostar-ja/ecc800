import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { lightTheme, darkTheme } from '../theme'

interface ThemeContextType {
  isDarkMode: boolean
  toggleTheme: () => void
  setTheme: (dark: boolean) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // Initialize theme from localStorage or default to light mode
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ecc800-theme')
      if (saved) {
        return saved === 'dark'
      }
      // Check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return false
  })

  // Update localStorage and document class when theme changes
  useEffect(() => {
    localStorage.setItem('ecc800-theme', isDarkMode ? 'dark' : 'light')
    
    // Update document class for Tailwind CSS
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't manually set a preference
      const savedTheme = localStorage.getItem('ecc800-theme')
      if (!savedTheme) {
        setIsDarkMode(e.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  const toggleTheme = () => {
    setIsDarkMode(prev => !prev)
  }

  const setTheme = (dark: boolean) => {
    setIsDarkMode(dark)
  }

  const currentTheme = isDarkMode ? darkTheme : lightTheme

  const contextValue: ThemeContextType = {
    isDarkMode,
    toggleTheme,
    setTheme,
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={currentTheme}>
        <CssBaseline />
        <div className={`min-h-full ${isDarkMode ? 'dark' : ''}`}>
          {children}
        </div>
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeProvider