"use client"

import type { Note } from "@/contexts/NotesContext"
import { Edit, Trash2, Tag } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface NoteCardProps {
  note: Note
  onEdit: (note: Note) => void
  onDelete: (id: string) => void
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-lg text-foreground line-clamp-1">{note.title}</h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEdit(note)}
            className="p-1 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Edit note"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="p-1 text-muted-foreground hover:text-destructive transition-colors"
            aria-label="Delete note"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">{note.content}</p>

      <div className="flex items-center justify-between">
        {note.tag && (
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <Tag className="h-3 w-3" />
            <span className="bg-secondary px-2 py-1 rounded-full">{note.tag}</span>
          </div>
        )}
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(note.date), { addSuffix: true })}
        </span>
      </div>
    </div>
  )
}
