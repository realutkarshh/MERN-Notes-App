"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Note {
  _id: string;
  user: string;
  title: string;
  content: string;
  tag: string;
  date: string;
}

export default function NoteDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNote = async () => {
      try {
        // Try multiple possible token keys
        const token =
          localStorage.getItem("auth-token") ||
          localStorage.getItem("token") ||
          localStorage.getItem("authToken") ||
          localStorage.getItem("jwt");

        console.log("Available localStorage keys:", Object.keys(localStorage));
        console.log("Found token:", token ? "Yes" : "No");

        if (!token) {
          throw new Error("Please log in to view this note");
        }

        const baseUrl =
          process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:5000"; // Adjust port as needed
        console.log("API URL:", `${baseUrl}/notes/${id}`);

        console.log("Token being sent:", token);

        const res = await fetch(`${baseUrl}/notes/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Changed to match your middleware
          },
        });

        console.log("Response status:", res.status);
        console.log("Response headers:", res.headers);

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Failed to fetch note");
        }

        const data = await res.json();

        if (!data.success || !data.note) {
          throw new Error("Note not found");
        }

        setNote(data.note);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNote();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <h2 className="text-red-800 font-semibold mb-2">Error</h2>
          <p className="text-red-600">Failed to load note: {error}</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-800">Note not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 sm:py-10">
      {/* Top bar with back and share */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => window.history.back()}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to Dashboard
        </button>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(window.location.href);
              alert("Link copied to clipboard!");
            } catch (err) {
              alert("Failed to copy link.");
            }
          }}
          className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded hover:bg-blue-700 transition"
        >
          Share
        </button>
      </div>

      {/* Note content */}
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3">{note.title}</h1>
      {/* <p className="text-gray-500 text-sm mb-1">Tag: {note.tag}</p> */}
      <p className="text-sm text-gray-400 mb-4">
        Created by You on: {new Date(note.date).toLocaleString()}
      </p>
      <div className="prose prose-sm sm:prose-base whitespace-pre-wrap text-foreground">
        {note.content}
      </div>
    </div>
  );
}
