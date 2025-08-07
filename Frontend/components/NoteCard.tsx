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
    // Inside your NoteCard component JSX

<article
  tabIndex={0}
  role="region"
  aria-label={`Note titled ${note.title}`}
  className="group bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between focus-within:ring-2 focus-within:ring-primary/50 outline-none"
>
  {/* Title and Action Buttons */}
  <header className="flex items-start justify-between mb-3"> {/* Reduced from mb-5 to mb-3 */}
    <h3 className="font-semibold text-lg text-foreground flex-1 pr-5 leading-tight break-words">
      <Link
        href={`/notes/${note._id}`}
        className="hover:underline focus-visible:underline outline-none"
      >
        {note.title || "Untitled"}
      </Link>
    </h3>
    <div
      className="flex items-center space-x-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      aria-hidden="true"
    >
      <button
        onClick={() => onEdit(note)}
        className="p-2 rounded-md text-muted-foreground hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
        aria-label="Edit note"
        type="button"
      >
        <Edit className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete(note._id)}
        className="p-2 rounded-md text-muted-foreground hover:text-destructive focus:outline-none focus:ring-2 focus:ring-destructive transition-colors"
        aria-label="Delete note"
        type="button"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  </header>

  {/* Note Content */}
  <p className="text-muted-foreground text-sm mb-4 line-clamp-5 leading-relaxed whitespace-pre-wrap break-words"> {/* Reduced mb-7 to mb-4 */}
    {note.content || "No content available."}
  </p>

  {/* Footer: Tag + Date */}
  <footer className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
    {note.tag && (
      <div className="flex items-center space-x-2 flex-shrink-0">
        <Tag className="h-4 w-4" />
        <span className="bg-secondary/70 rounded-full px-3 py-1 font-medium text-foreground select-none text-[13px]">
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
