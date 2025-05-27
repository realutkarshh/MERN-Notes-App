"use client"

import { useAuth } from "@/contexts/AuthContext"
import { useState, useEffect } from "react"
import ProtectedRoute from "@/components/ProtectedRoute"
import Header from "@/components/Header"
import SearchAndFilter from "@/components/SearchAndFilter"
import NoteCard from "@/components/NoteCard"
import NoteModal from "@/components/NoteModal"
import { NotesProvider, useNotes, type Note } from "@/contexts/NotesContext"
import { Plus, FileText } from "lucide-react"

function DashboardContent() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<Note | null>(null)
  const { filteredNotes, createNote, updateNote, deleteNote, loading, fetchNotes } = useNotes()

  const { user } = useAuth()

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleCreateNote = async (noteData: { title: string; content: string; tag: string }) => {
    await createNote(noteData)
    setIsModalOpen(false)
  }

  const handleUpdateNote = async (noteData: { title: string; content: string; tag: string }) => {
    if (editingNote) {
      await updateNote(editingNote._id, noteData)
      setEditingNote(null)
      setIsModalOpen(false)
    }
  }

  const handleEditNote = (note: Note) => {
    setEditingNote(note)
    setIsModalOpen(true)
  }

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id)
    }
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingNote(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">{user?.name}'s Notes</h2>
            <p className="text-muted-foreground mt-1">
              {filteredNotes.length} {filteredNotes.length === 1 ? "note" : "notes"}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>New Note</span>
          </button>
        </div>

        <SearchAndFilter />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground mb-6">
              {filteredNotes.length === 0 && !loading
                ? "Create your first note to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Create Note</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard key={note._id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} />
            ))}
          </div>
        )}

        <NoteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
          note={editingNote}
          loading={loading}
        />
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <NotesProvider>
        <DashboardContent />
      </NotesProvider>
    </ProtectedRoute>
  )
}
