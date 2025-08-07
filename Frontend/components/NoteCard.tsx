"use client";

import type { Note } from "@/contexts/NotesContext";
import { Edit, Trash2, Tag } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export default function NoteCard({ note, onEdit, onDelete }: NoteCardProps) {
  return (
    <article
      className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col justify-between"
      role="region"
      aria-label={`Note titled ${note.title}`}
    >
      {/* Title and Action Buttons */}
      <header className="flex items-start justify-between mb-4">
        <h3 className="font-semibold text-lg text-foreground line-clamp-1 flex-1 pr-4">
          <Link href={`/notes/${note._id}`} className="hover:underline focus-visible:underline outline-none">
            {note.title || "Untitled"}
          </Link>
        </h3>
        <div className="flex items-center space-x-3 flex-shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
            aria-label="Edit note"
            type="button"
          >
            <Edit className="h-5 w-5" />
          </button>
          <button
            onClick={() => onDelete(note._id)}
            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive transition-colors"
            aria-label="Delete note"
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Note Content */}
      <p className="text-muted-foreground text-sm mb-6 line-clamp-4 whitespace-pre-wrap break-words">
        {note.content || "No content available."}
      </p>

      {/* Footer: Tag + Date */}
      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        {note.tag && (
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Tag className="h-4 w-4" />
            <span className="bg-secondary rounded-full px-3 py-1 font-medium text-foreground select-none">
              {note.tag}
            </span>
          </div>
        )}
        <time
          className="whitespace-nowrap"
          dateTime={new Date(note.date).toISOString()}
          aria-label={`Last updated ${formatDistanceToNow(new Date(note.date), { addSuffix: true })}`}
        >
          {formatDistanceToNow(new Date(note.date), { addSuffix: true })}
        </time>
      </footer>
    </article>
  );
}
