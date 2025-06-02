"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"
import toast from "react-hot-toast"

export interface Note {
  _id: string
  title: string
  content: string
  tag: string
  user: string
  date: string
}

interface NotesContextType {
  notes: Note[]
  loading: boolean
  searchTerm: string
  selectedTag: string
  sortBy: "date" | "title"
  setSearchTerm: (term: string) => void
  setSelectedTag: (tag: string) => void
  setSortBy: (sort: "date" | "title") => void
  createNote: (note: Omit<Note, "_id" | "user" | "date">) => Promise<Note>
  updateNote: (id: string, note: Partial<Note>) => Promise<Note>
  deleteNote: (id: string) => Promise<void>
  fetchNotes: () => Promise<void>
  filteredNotes: Note[]
  tags: string[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

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

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get("/api/notes")

      if (response.data.success) {
        setNotes(response.data.notes)
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error("Please log in to view your notes")
      } else {
        toast.error("Failed to fetch notes")
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
      fetchNotes()
    }
  }, [])

  const createNote = async (noteData: Omit<Note, "_id" | "user" | "date">): Promise<Note> => {
    try {
      setLoading(true)
      const response = await apiClient.post("/api/notes", {
        title: noteData.title,
        content: noteData.content,
        tag: noteData.tag || "General",
      })

      if (response.data.success) {
        const newNote = response.data.note
        setNotes((prev) => [newNote, ...prev])
        return newNote
      }
      throw new Error("Failed to create note")
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create note"
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateNote = async (id: string, noteData: Partial<Note>): Promise<Note> => {
    try {
      setLoading(true)
      const response = await apiClient.put(`/api/notes/${id}`, {
        title: noteData.title,
        content: noteData.content,
        tag: noteData.tag,
      })

      if (response.data.success) {
        const updatedNote = response.data.note
        setNotes((prev) => prev.map((note) => (note._id === id ? updatedNote : note)))
        return updatedNote
      }
      throw new Error("Failed to update note")
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to update note"
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      setLoading(true)
      const response = await apiClient.delete(`/api/notes/${id}`)

      if (response.data.success) {
        setNotes((prev) => prev.filter((note) => note._id !== id))
        toast.success("Note deleted successfully!")
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to delete note"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const filteredNotes = notes
    .filter((note) => {
      const matchesSearch =
        note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        note.tag.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesTag = selectedTag === "" || note.tag === selectedTag
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date).getTime() - new Date(a.date).getTime()
      } else {
        return a.title.localeCompare(b.title)
      }
    })

  const tags = Array.from(new Set(notes.map((note) => note.tag))).filter(Boolean)

  return (
    <NotesContext.Provider
      value={{
        notes,
        loading,
        searchTerm,
        selectedTag,
        sortBy,
        setSearchTerm,
        setSelectedTag,
        setSortBy,
        createNote,
        updateNote,
        deleteNote,
        fetchNotes,
        filteredNotes,
        tags,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export function useNotes() {
  const context = useContext(NotesContext)
  if (context === undefined) {
    throw new Error("useNotes must be used within a NotesProvider")
  }
  return context
}