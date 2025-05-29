"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import SearchAndFilter from "@/components/SearchAndFilter";
import NoteCard from "@/components/NoteCard";
import NoteModal from "@/components/NoteModal";
import QRScannerModal from "@/components/QRScannerModal";
import { NotesProvider, useNotes, type Note } from "@/contexts/NotesContext";
import { Plus, FileText, QrCode } from "lucide-react";

function DashboardContent() {
  const [message, setMessage] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const {
    filteredNotes,
    createNote,
    updateNote,
    deleteNote,
    loading,
    fetchNotes,
  } = useNotes();

  const { user } = useAuth();

  useEffect(() => {
    const firstName = user?.name?.split(" ")[0] || "User";
    const welcomeMessages = [
      `Hey ${firstName}, ready to note something down?`,
      `${firstName}, let's get productive today!`,
      `What's on your mind today, ${firstName}?`,
      `${firstName}, all your ideas live here.`,
      `Hello ${firstName}! Your notes are just a scroll away.`
    ];
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setMessage(welcomeMessages[randomIndex]);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = async (noteData: {
    title: string;
    content: string;
    tag: string;
  }) => {
    await createNote(noteData);
    setIsModalOpen(false);
  };

  const handleUpdateNote = async (noteData: {
    title: string;
    content: string;
    tag: string;
  }) => {
    if (editingNote) {
      await updateNote(editingNote._id, noteData);
      setEditingNote(null);
      setIsModalOpen(false);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsModalOpen(true);
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingNote(null);
  };

  const handleNoteReceived = () => {
    // Refresh notes after receiving a shared note
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-normal text-foreground">
              {message}
            </h2>
            <p className="font-normal text-sm mt-2 text-gray-500">
              All your thoughts, ideas, and plans in one place.
            </p>
            <p className="text-muted-foreground mt-1 text-sm sm:text-base">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note currently" : "notes currently"}
            </p>
          </div>
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <button
              onClick={() => setQrScannerOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
            >
              <QrCode className="h-4 w-4" />
              <span>Scan QR Code</span>
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        <SearchAndFilter />

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              No notes found
            </h3>
            <p className="text-muted-foreground mb-6">
              {filteredNotes.length === 0 && !loading
                ? "Create your first note or scan a QR code to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setQrScannerOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <QrCode className="h-4 w-4" />
                <span>Scan QR Code</span>
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create Note</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredNotes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
              />
            ))}
          </div>
        )}

        {/* Modals */}
        <NoteModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={editingNote ? handleUpdateNote : handleCreateNote}
          note={editingNote}
          loading={loading}
        />

        <QRScannerModal
          isOpen={qrScannerOpen}
          onClose={() => setQrScannerOpen(false)}
          onNoteReceived={handleNoteReceived}
        />
      </main>
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <NotesProvider>
        <DashboardContent />
      </NotesProvider>
    </ProtectedRoute>
  );
}