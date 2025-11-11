"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

export interface Notebook {
  _id: string
  name: string
  user: string
  isDefault: boolean
  createdAt: string
  noteCount?: number
}

interface NotebooksContextType {
  notebooks: Notebook[]
  loading: boolean
  defaultNotebook: Notebook | null
  createNotebook: (name: string) => Promise<Notebook>
  updateNotebook: (id: string, name: string) => Promise<Notebook>
  deleteNotebook: (id: string) => Promise<void>
  fetchNotebooks: () => Promise<void>
  getNotebookById: (id: string) => Notebook | undefined
}

const NotebooksContext = createContext<NotebooksContextType | undefined>(undefined)

// Create axios instance with interceptor for authentication
const apiClient = axios.create()

// Add request interceptor to include auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = 
      localStorage.getItem("auth-token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

export function NotebooksProvider({ children }: { children: React.ReactNode }) {
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotebooks = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/api/notebooks")

      if (response.data.success) {
        setNotebooks(response.data.notebooks)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Please log in to view your notebooks")
      } else {
        toast.error("Failed to fetch notebooks")
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const token = 
      localStorage.getItem("auth-token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("jwt")
      
    if (token) {
      fetchNotebooks()
    }
  }, [])

  const createNotebook = async (name: string): Promise<Notebook> => {
    try {
      setLoading(true)
      const response = await apiClient.post("/api/notebooks", { name })

      if (response.data.success) {
        const newNotebook = response.data.notebook
        setNotebooks((prev) => [...prev, newNotebook])
        toast.success("Notebook created successfully!")
        return newNotebook
      }
      throw new Error("Failed to create notebook")
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create notebook"
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateNotebook = async (id: string, name: string): Promise<Notebook> => {
    try {
      setLoading(true)
      const response = await apiClient.put(`/api/notebooks/${id}`, { name })

      if (response.data.success) {
        const updatedNotebook = response.data.notebook
        setNotebooks((prev) => 
          prev.map((notebook) => (notebook._id === id ? updatedNotebook : notebook))
        )
        toast.success("Notebook updated successfully!")
        return updatedNotebook
      }
      throw new Error("Failed to update notebook")
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to update notebook"
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteNotebook = async (id: string) => {
    try {
      setLoading(true)
      const response = await apiClient.delete(`/api/notebooks/${id}`)

      if (response.data.success) {
        setNotebooks((prev) => prev.filter((notebook) => notebook._id !== id))
        toast.success(response.data.message || "Notebook deleted successfully!")
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to delete notebook"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getNotebookById = (id: string): Notebook | undefined => {
    return notebooks.find((notebook) => notebook._id === id)
  }

  const defaultNotebook = notebooks.find((notebook) => notebook.isDefault) || null

  return (
    <NotebooksContext.Provider
      value={{
        notebooks,
        loading,
        defaultNotebook,
        createNotebook,
        updateNotebook,
        deleteNotebook,
        fetchNotebooks,
        getNotebookById,
      }}
    >
      {children}
    </NotebooksContext.Provider>
  )
}

export function useNotebooks() {
  const context = useContext(NotebooksContext)
  if (context === undefined) {
    throw new Error("useNotebooks must be used within a NotebooksProvider")
  }
  return context
}
