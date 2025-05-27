"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  register: (name: string, email: string, password: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Set base URL for axios
// axios.defaults.baseURL = "http://localhost:5000"
axios.defaults.baseURL = "https://mern-notes-app-gtab.onrender.com"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem("token")
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
      const userData = localStorage.getItem("user")
      if (userData) {
        setUser(JSON.parse(userData))
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post("/api/auth/login", {
        email,
        password,
      })

      if (response.data.success) {
        const { token, user: userData } = response.data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(userData))
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        setUser(userData)
        toast.success("Login successful!")
        return true
      }
      return false
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Login failed. Please try again."
      toast.error(errorMessage)
      return false
    }
  }

  const register = async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const response = await axios.post("/api/auth/register", {
        name,
        email,
        password,
      })

      if (response.data.success) {
        const { token, user: userData } = response.data
        localStorage.setItem("token", token)
        localStorage.setItem("user", JSON.stringify(userData))
        axios.defaults.headers.common["Authorization"] = `Bearer ${token}`
        setUser(userData)
        toast.success("Registration successful!")
        return true
      }
      return false
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Registration failed. Please try again."
      toast.error(errorMessage)
      return false
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    delete axios.defaults.headers.common["Authorization"]
    setUser(null)
    toast.success("Logged out successfully!")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
