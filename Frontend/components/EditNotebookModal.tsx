"use client";

import { useState, useEffect } from "react";
import { useNotebooks } from "@/contexts/NotebookContext";
import { X } from "lucide-react";

interface EditNotebookModalProps {
  isOpen: boolean;
  notebookId: string;
  currentName: string;
  onClose: () => void;
}

export default function EditNotebookModal({
  isOpen,
  notebookId,
  currentName,
  onClose,
}: EditNotebookModalProps) {
  const [name, setName] = useState(currentName);
  const { updateNotebook, loading } = useNotebooks();

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && name !== currentName) {
      try {
        await updateNotebook(notebookId, name.trim());
        onClose();
      } catch (error) {
        // Error handled in context
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Rename Notebook</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-secondary rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="notebook-name" className="block text-sm font-medium text-foreground mb-2">
              Notebook Name
            </label>
            <input
              id="notebook-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter notebook name..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              autoFocus
              required
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || name === currentName}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
