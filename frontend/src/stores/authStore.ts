import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  username: string
  full_name: string
  role: string
  is_active: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (token: string, user: User) => {
        // Also save token to localStorage for direct access
        localStorage.setItem("token", token);
        
        set({
          token,
          user,
          isAuthenticated: true,
        })
      },
      
      logout: () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("ecc800-auth");
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Redirect to login page
        window.location.href = "/ecc800/login";
      },
      
      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'ecc800-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
