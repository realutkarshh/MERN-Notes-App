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
  createNote: (note: Omit<Note, "_id" | "user" | "date">) => Promise<void>
  updateNote: (id: string, note: Partial<Note>) => Promise<void>
  deleteNote: (id: string) => Promise<void>
  fetchNotes: () => Promise<void>
  filteredNotes: Note[]
  tags: string[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "title">("date")

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const response = await axios.get("/api/notes")

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
    const token = localStorage.getItem("token")
    if (token) {
      fetchNotes()
    }
  }, [])

  const createNote = async (noteData: Omit<Note, "_id" | "user" | "date">) => {
    try {
      setLoading(true)
      const response = await axios.post("/api/notes", {
        title: noteData.title,
        content: noteData.content,
        tag: noteData.tag || "General",
      })

      if (response.data.success) {
        setNotes((prev) => [response.data.note, ...prev])
        toast.success("Note created successfully!")
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to create note"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const updateNote = async (id: string, noteData: Partial<Note>) => {
    try {
      setLoading(true)
      const response = await axios.put(`/api/notes/${id}`, {
        title: noteData.title,
        content: noteData.content,
        tag: noteData.tag,
      })

      if (response.data.success) {
        setNotes((prev) => prev.map((note) => (note._id === id ? response.data.note : note)))
        toast.success("Note updated successfully!")
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Failed to update note"
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      setLoading(true)
      const response = await axios.delete(`/api/notes/${id}`)

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
