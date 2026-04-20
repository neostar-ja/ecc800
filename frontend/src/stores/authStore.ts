import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

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
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
  checkTokenExpiration: () => void
}

// Function to decode JWT token
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (username: string, password: string) => {
        set({ isLoading: true });
        
        try {
          const formData = new FormData();
          formData.append('username', username);
          formData.append('password', password);
          
          const response = await axios.post('/ecc800/api/auth/login', formData, {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          });
          
          const { access_token, user } = response.data;
          
          // Store token in localStorage
          localStorage.setItem('token', access_token);
          
          // Set up axios default authorization header
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
          
          // Update store
          set({
            token: access_token,
            user: user,
            isAuthenticated: true,
            isLoading: false,
          });
          
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        // Clear localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("ecc800-auth");
        
        // Clear axios authorization header
        delete axios.defaults.headers.common['Authorization'];
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
        })
        
        // Redirect to login page - use /ecc800/ as root, not /ecc800/login
        window.location.href = "/ecc800/";
      },
      
      updateUser: (user: User) => {
        set({ user })
      },
      
      checkTokenExpiration: () => {
        const { token, logout } = get();
        if (token) {
          const decoded = decodeJWT(token);
          if (decoded && decoded.exp) {
            const currentTime = Date.now() / 1000;
            if (decoded.exp < currentTime) {
              console.log('Token expired, logging out...');
              logout();
            }
          }
        }
      },
    }),
    {
      name: 'ecc800-auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Set up axios header when rehydrating from storage
        if (state?.token) {
          axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
          // Check token expiration on app load
          state.checkTokenExpiration();
        }
      },
    }
  )
)
