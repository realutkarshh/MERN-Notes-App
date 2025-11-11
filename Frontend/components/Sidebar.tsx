"use client";

import { useNotebooks } from "@/contexts/NotebookContext";
import { useState } from "react";
import { Plus, BookOpen, ChevronRight, Trash2, Edit2 } from "lucide-react";
import CreateNotebookModal from "./CreateNotebookModal";
import EditNotebookModal from "./EditNotebookModal";

interface SidebarProps {
  selectedNotebook: string | null;
  onSelectNotebook: (notebookId: string) => void;
}

export default function Sidebar({ selectedNotebook, onSelectNotebook }: SidebarProps) {
  const { notebooks, deleteNotebook, loading } = useNotebooks();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingNotebook, setEditingNotebook] = useState<{ id: string; name: string } | null>(null);

  const handleDeleteNotebook = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? All notes will be moved to NoteStack.`)) {
      await deleteNotebook(id);
    }
  };

  return (
    <>
      <aside className="w-64 bg-card border-r border-border h-[calc(100vh-57px)] sticky top-[57px] overflow-y-auto">
        <div className="p-4">
          {/* Create Notebook Button */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>Create Notebook</span>
          </button>

          {/* Notebooks List */}
          <div className="mt-6 space-y-1">
            <h3 className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Notebooks
            </h3>

            {loading ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">Loading...</div>
            ) : notebooks.length === 0 ? (
              <div className="px-3 py-2 text-sm text-muted-foreground">No notebooks yet</div>
            ) : (
              notebooks.map((notebook) => (
                <div
                  key={notebook._id}
                  className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                    selectedNotebook === notebook._id
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-secondary text-foreground"
                  }`}
                >
                  <div
                    onClick={() => onSelectNotebook(notebook._id)}
                    className="flex items-center gap-2 flex-1 min-w-0"
                  >
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">{notebook.name}</span>
                    <span className="text-xs text-muted-foreground">({notebook.noteCount || 0})</span>
                  </div>

                  {/* Action Buttons (only for non-default notebooks) */}
                  {!notebook.isDefault && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingNotebook({ id: notebook._id, name: notebook.name });
                        }}
                        className="p-1 hover:bg-secondary rounded"
                        aria-label="Edit notebook"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotebook(notebook._id, notebook.name);
                        }}
                        className="p-1 hover:bg-destructive/10 hover:text-destructive rounded"
                        aria-label="Delete notebook"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* Modals */}
      <CreateNotebookModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      {editingNotebook && (
        <EditNotebookModal
          isOpen={!!editingNotebook}
          notebookId={editingNotebook.id}
          currentName={editingNotebook.name}
          onClose={() => setEditingNotebook(null)}
        />
      )}
    </>
  );
}
