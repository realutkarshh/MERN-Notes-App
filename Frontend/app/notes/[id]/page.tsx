"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { QrCode, Edit, Save, ArrowLeft, X } from "lucide-react";
import QRCodeModal from "@/components/QRCodeModal";
import { useNotes } from "@/contexts/NotesContext";
import { useNotebooks } from "@/contexts/NotebookContext";
import toast from "react-hot-toast";
import axios from "axios";

interface Note {
  _id: string;
  user: string;
  title: string;
  content: string;
  tag: string;
  date: string;
  notebook: {
    _id: string;
    name: string;
  };
}

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

function UnsavedChangesModal({ isOpen, onSave, onDiscard, onCancel }: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Unsaved Changes</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          You have unsaved changes. Would you like to save them before leaving?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
          >
            Cancel
          </button>
          <button
            onClick={onDiscard}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
          >
            Don't Save
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const isNewNote = id === "new";
  const notebookIdFromQuery = searchParams.get("notebook");

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(!isNewNote);
  const [error, setError] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(isNewNote);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Editor state
  const [editorTitle, setEditorTitle] = useState("");
  const [editorContent, setEditorContent] = useState("");
  const [editorTag, setEditorTag] = useState("");
  const [editorNotebookId, setEditorNotebookId] = useState("");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const { createNote, updateNote, fetchNotes, notes } = useNotes();
  const { notebooks, defaultNotebook } = useNotebooks();

  // Initialize for new note
  useEffect(() => {
    if (isNewNote) {
      setNote(null);
      setEditorTitle("");
      setEditorContent("");
      setEditorTag("");
      
      // Set notebook from query param or use default
      if (notebookIdFromQuery) {
        setEditorNotebookId(notebookIdFromQuery);
      } else if (defaultNotebook) {
        setEditorNotebookId(defaultNotebook._id);
      }
      
      setIsEditing(true);
      setLoading(false);
      // Focus on title input
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [isNewNote, notebookIdFromQuery, defaultNotebook]);

  // Fetch existing note - First try from context, then from API
  useEffect(() => {
    if (!isNewNote && id) {
      // First, try to find the note in the existing notes from context
      const existingNote = notes.find(n => n._id === id);
      if (existingNote) {
        setNote(existingNote);
        setEditorTitle(existingNote.title);
        setEditorContent(existingNote.content);
        setEditorTag(existingNote.tag);
        setEditorNotebookId(existingNote.notebook._id);
        setLoading(false);
        return;
      }

      // If not found in context, fetch from API
      const fetchNote = async () => {
        try {
          setLoading(true);
          
          const response = await axios.get(`/api/notes/${id}`);

          if (response.data.success && response.data.note) {
            const fetchedNote = response.data.note;
            setNote(fetchedNote);
            setEditorTitle(fetchedNote.title);
            setEditorContent(fetchedNote.content);
            setEditorTag(fetchedNote.tag);
            setEditorNotebookId(fetchedNote.notebook._id);
          } else {
            throw new Error("Note not found");
          }
        } catch (err: any) {
          console.error("Error fetching note:", err);
          const errorMessage = err.response?.data?.error || err.message || "Failed to fetch note";
          
          if (err.response?.status === 401) {
            setError("Please log in to view this note");
          } else if (err.response?.status === 404) {
            setError("Note not found");
          } else {
            setError(errorMessage);
          }
        } finally {
          setLoading(false);
        }
      };

      fetchNote();
    }
  }, [id, isNewNote, notes]);

  // Track changes
  useEffect(() => {
    if (isEditing && !isNewNote && note) {
      const hasChanges = 
        editorTitle !== note.title ||
        editorContent !== note.content ||
        editorTag !== note.tag ||
        editorNotebookId !== note.notebook._id;
      setHasUnsavedChanges(hasChanges);
    } else if (isNewNote && isEditing) {
      const hasContent = editorTitle.trim() || editorContent.trim();
      setHasUnsavedChanges(!!hasContent);
    }
  }, [editorTitle, editorContent, editorTag, editorNotebookId, note, isEditing, isNewNote]);

  // Auto-resize textareas
  const autoResize = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorTitle(e.target.value);
    autoResize(e.target);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditorContent(e.target.value);
    autoResize(e.target);
  };

  const handleSave = async () => {
    if (!editorTitle.trim() || !editorContent.trim()) {
      toast.error("Title and content are required");
      return;
    }

    if (!editorNotebookId) {
      toast.error("Please select a notebook");
      return;
    }

    try {
      setSaving(true);
      const noteData = {
        title: editorTitle.trim(),
        content: editorContent.trim(),
        tag: editorTag.trim() || "General",
        notebookId: editorNotebookId,
      };

      if (isNewNote) {
        await createNote(noteData);
        toast.success("Note created successfully!");
        // Redirect to dashboard after creation
        router.push("/dashboard");
      } else {
        await updateNote(id, noteData);
        toast.success("Note updated successfully!");
        // Update local note state
        if (note) {
          const updatedNotebook = notebooks.find(nb => nb._id === editorNotebookId);
          setNote({ 
            ...note, 
            title: noteData.title,
            content: noteData.content,
            tag: noteData.tag,
            notebook: {
              _id: editorNotebookId,
              name: updatedNotebook?.name || note.notebook.name
            }
          });
        }
        setIsEditing(false);
      }
      
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setTimeout(() => titleRef.current?.focus(), 100);
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      setPendingNavigation("/dashboard");
      setShowUnsavedModal(true);
    } else {
      router.push("/dashboard");
    }
  };

  const handleUnsavedModalSave = async () => {
    await handleSave();
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleUnsavedModalDiscard = () => {
    setHasUnsavedChanges(false);
    setShowUnsavedModal(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleUnsavedModalCancel = () => {
    setShowUnsavedModal(false);
    setPendingNavigation(null);
  };

  // Handle browser back/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <h2 className="text-red-800 dark:text-red-400 font-semibold mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300">Failed to load note: {error}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Notebook selector (only in edit mode) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Notebook:</label>
              <select
                value={editorNotebookId}
                onChange={(e) => setEditorNotebookId(e.target.value)}
                className="px-3 py-1.5 text-sm bg-card text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Notebook</option>
                {notebooks.map((notebook) => (
                  <option key={notebook._id} value={notebook._id}>
                    {notebook.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Tag input (only in edit mode) */}
          {isEditing && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-500">Tag:</label>
              <input
                type="text"
                value={editorTag}
                onChange={(e) => setEditorTag(e.target.value)}
                placeholder="General"
                className="px-2 py-1 text-sm bg-card text-foreground border border-border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Share Options (only for existing notes) */}
          {!isNewNote && (
            <button
              onClick={() => setQrModalOpen(true)}
              className="flex items-center gap-2 text-sm bg-card text-foreground px-3 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <QrCode className="h-4 w-4" />
              Share via QR
            </button>
          )}

          {/* Edit/Save button */}
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={saving || !editorTitle.trim() || !editorContent.trim() || !editorNotebookId || (!hasUnsavedChanges && !isNewNote)}
              className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          ) : (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition"
            >
              <Edit className="h-4 w-4" />
              Edit Note
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="space-y-4">
        {/* Title */}
        <div>
          {isEditing ? (
            <textarea
              ref={titleRef}
              value={editorTitle}
              onChange={handleTitleChange}
              placeholder="Enter note title..."
              className="w-full text-2xl sm:text-3xl lg:text-4xl font-bold bg-transparent border-none outline-none resize-none overflow-hidden"
              rows={1}
              style={{ minHeight: '3rem' }}
            />
          ) : (
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">
              {note?.title || "Untitled"}
            </h1>
          )}
        </div>

        {/* Metadata (only in read mode) */}
        {!isEditing && note && (
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 pb-4 border-b">
            <p>Created: {new Date(note.date).toLocaleString()}</p>
            {note.tag && <p>Tag: {note.tag}</p>}
            {note.notebook && <p>Notebook: {note.notebook.name}</p>}
          </div>
        )}

        {/* Content */}
        <div className="min-h-[400px]">
          {isEditing ? (
            <textarea
              ref={contentRef}
              value={editorContent}
              onChange={handleContentChange}
              placeholder="Start writing your note..."
              className="w-full h-full min-h-[400px] bg-transparent border-none outline-none resize-none text-base leading-relaxed"
            />
          ) : (
            <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap text-foreground leading-relaxed">
              {note?.content || editorContent}
            </div>
          )}
        </div>
      </div>

      {/* QR Code Modal */}
      {!isNewNote && (
        <QRCodeModal
          isOpen={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          noteId={id}
        />
      )}

      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleUnsavedModalSave}
        onDiscard={handleUnsavedModalDiscard}
        onCancel={handleUnsavedModalCancel}
      />
    </div>
  );
}
