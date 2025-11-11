"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useNotes } from "@/contexts/NotesContext";
import { useNotebooks } from "@/contexts/NotebookContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ArrowLeft, Save } from "lucide-react";
import toast from "react-hot-toast";

function NewNoteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notebookIdFromQuery = searchParams.get("notebook");
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("General");
  const [notebookId, setNotebookId] = useState(notebookIdFromQuery || "");
  
  const { createNote, loading } = useNotes();
  const { notebooks, defaultNotebook } = useNotebooks();

  useEffect(() => {
    if (!notebookId && defaultNotebook) {
      setNotebookId(defaultNotebook._id);
    }
  }, [defaultNotebook, notebookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }

    try {
      await createNote({
        title: title.trim(),
        content: content.trim(),
        tag: tag || "General",
        notebookId: notebookId,
      });
      router.push("/dashboard");
    } catch (error) {
      // Error handled in context
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="notebook" className="block text-sm font-medium text-foreground mb-2">
              Notebook
            </label>
            <select
              id="notebook"
              value={notebookId}
              onChange={(e) => setNotebookId(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              required
            >
              <option value="">Select a notebook</option>
              {notebooks.map((nb) => (
                <option key={nb._id} value={nb._id}>
                  {nb.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <input
              type="text"
              placeholder="Note title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none placeholder:text-muted-foreground"
              required
            />
          </div>

          <div>
            <label htmlFor="tag" className="block text-sm font-medium text-foreground mb-2">
              Tag
            </label>
            <input
              id="tag"
              type="text"
              placeholder="General"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          <div>
            <textarea
              placeholder="Start writing..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[400px] px-3 py-2 bg-transparent border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{loading ? "Saving..." : "Save Note"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}

export default function NewNotePage() {
  return (
    <ProtectedRoute>
      <NewNoteContent />
    </ProtectedRoute>
  );
}
