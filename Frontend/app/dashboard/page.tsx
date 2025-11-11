"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Navbar from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import NoteCard from "@/components/NoteCard";
import QRScannerModal from "@/components/QRScannerModal";
import { useNotes, type Note } from "@/contexts/NotesContext";
import { useNotebooks } from "@/contexts/NotebookContext";
import { Plus, FileText, QrCode } from "lucide-react";

function DashboardContent() {
  const [selectedNotebook, setSelectedNotebook] = useState<string | null>(null);
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { filteredNotes, deleteNote, loading, fetchNotes, setSelectedNotebook: setNotebookFilter } = useNotes();
  const { notebooks, defaultNotebook } = useNotebooks();
  const { user } = useAuth();
  const router = useRouter();

  // Set default notebook on mount
  useEffect(() => {
    if (defaultNotebook && !selectedNotebook) {
      setSelectedNotebook(defaultNotebook._id);
      setNotebookFilter(defaultNotebook._id);
    }
  }, [defaultNotebook, selectedNotebook, setNotebookFilter]);

  const handleSelectNotebook = (notebookId: string) => {
    setSelectedNotebook(notebookId);
    setNotebookFilter(notebookId);
    fetchNotes(notebookId);
  };

  const handleCreateNote = () => {
    router.push(`/notes/new?notebook=${selectedNotebook}`);
  };

  const handleEditNote = (note: Note) => {
    router.push(`/notes/${note._id}`);
  };

  const handleDeleteNote = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      await deleteNote(id);
    }
  };

  const handleNoteReceived = () => {
    if (selectedNotebook) {
      fetchNotes(selectedNotebook);
    }
  };

  const currentNotebook = notebooks.find((nb) => nb._id === selectedNotebook);
  const isDefaultNotebook = currentNotebook?.isDefault || false;

  // Welcome message for default notebook
  const getWelcomeMessage = () => {
    const firstName = user?.name?.split(" ")[0] || "User";
    const messages = [
      `Hey ${firstName}, ready to note something down?`,
      `${firstName}, let's get productive today!`,
      `What's on your mind today, ${firstName}?`,
      `${firstName}, all your ideas live here.`,
      `Hello ${firstName}! Your notes are just a scroll away.`,
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="flex">
        <Sidebar selectedNotebook={selectedNotebook} onSelectNotebook={handleSelectNotebook} />

        <main className="flex-1 p-6 overflow-y-auto h-[calc(100vh-57px)]">
          {/* Notebook Header */}
          {currentNotebook && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">{currentNotebook.name}</h1>
              <p className="text-muted-foreground text-sm">
                Created by you on {new Date(currentNotebook.createdAt).toLocaleDateString()}
              </p>
              
              {/* Action Buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create Note</span>
                </button>
                
                <button
                  onClick={() => setQrScannerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  <QrCode className="h-4 w-4" />
                  <span>Scan QR</span>
                </button>
              </div>
            </div>
          )}

          {/* Welcome Message for Default Notebook */}
          {isDefaultNotebook && filteredNotes.length === 0 && !loading && (
            <div className="text-center py-16 max-w-2xl mx-auto">
              <h2 className="text-2xl font-semibold text-foreground mb-3">{getWelcomeMessage()}</h2>
              <p className="text-muted-foreground mb-8">
                All your thoughts, ideas, and plans in one place.
              </p>
            </div>
          )}

          {/* Notes Grid or Empty State */}
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-primary"></div>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-16 max-w-md mx-auto">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-3">No notes yet</h3>
              <p className="text-muted-foreground mb-6">
                Start creating notes in this notebook
              </p>
              <button
                onClick={handleCreateNote}
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                <Plus className="h-5 w-5" />
                <span>Create Your First Note</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredNotes.map((note) => (
                <NoteCard key={note._id} note={note} onEdit={handleEditNote} onDelete={handleDeleteNote} />
              ))}
            </div>
          )}
        </main>
      </div>

      <QRScannerModal
        isOpen={qrScannerOpen}
        onClose={() => setQrScannerOpen(false)}
        onNoteReceived={handleNoteReceived}
      />
    </div>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
