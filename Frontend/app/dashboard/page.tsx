"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import Header from "@/components/Header";
import SearchAndFilter from "@/components/SearchAndFilter";
import NoteCard from "@/components/NoteCard";
import QRScannerModal from "@/components/QRScannerModal";
import { NotesProvider, useNotes, type Note } from "@/contexts/NotesContext";
import { Plus, FileText, QrCode } from "lucide-react";

function DashboardContent() {
  const [message, setMessage] = useState("");
  const [qrScannerOpen, setQrScannerOpen] = useState(false);
  const { filteredNotes, deleteNote, loading, fetchNotes } = useNotes();

  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const firstName = user?.name?.split(" ")[0] || "User";
    const welcomeMessages = [
      `Hey ${firstName}, ready to note something down?`,
      `${firstName}, let's get productive today!`,
      `What's on your mind today, ${firstName}?`,
      `${firstName}, all your ideas live here.`,
      `Hello ${firstName}! Your notes are just a scroll away.`,
    ];
    const randomIndex = Math.floor(Math.random() * welcomeMessages.length);
    setMessage(welcomeMessages[randomIndex]);
  }, [user]);

  useEffect(() => {
    fetchNotes();
  }, []);

  const handleCreateNote = () => {
    router.push("/notes/new");
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
    fetchNotes();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-10">
        {/* Welcome + Actions Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-foreground leading-tight">
              {message}
            </h2>
            <p className="mt-3 text-muted-foreground text-base sm:text-lg max-w-md">
              All your thoughts, ideas, and plans in one place.
            </p>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base font-medium">
              {filteredNotes.length}{" "}
              {filteredNotes.length === 1 ? "note currently" : "notes currently"}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <button
              onClick={() => setQrScannerOpen(true)}
              type="button"
              aria-label="Scan QR Code"
              className="flex items-center justify-center space-x-2 px-5 py-3 bg-card text-foreground rounded-lg shadow-sm hover:bg-gray-900 transition-colors font-semibold text-sm"
            >
              <QrCode className="h-5 w-5" />
              <span>Scan QR Code</span>
            </button>

            <button
              onClick={handleCreateNote}
              type="button"
              aria-label="Create New Note"
              className="flex items-center justify-center space-x-2 px-5 py-3 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-colors font-semibold text-sm"
            >
              <Plus className="h-5 w-5" />
              <span>New Note</span>
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="mb-10">
          <div className=" rounded-lg p-5 shadow-sm">
            <SearchAndFilter />
          </div>
        </div>

        {/* Notes Grid, Loading, or Empty State */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-primary"></div>
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="text-center py-24 max-w-md mx-auto">
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-foreground mb-3">
              No notes found
            </h3>
            <p className="text-muted-foreground mb-8 text-base">
              {filteredNotes.length === 0 && !loading
                ? "Create your first note or scan a QR code to get started"
                : "Try adjusting your search or filter criteria"}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button
                onClick={() => setQrScannerOpen(true)}
                type="button"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors font-semibold"
              >
                <QrCode className="h-5 w-5" />
                <span>Scan QR Code</span>
              </button>
              <button
                onClick={handleCreateNote}
                type="button"
                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90 transition-colors font-semibold"
              >
                <Plus className="h-5 w-5" />
                <span>Create Note</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
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
