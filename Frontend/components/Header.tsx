"use client"

import { useAuth } from "@/contexts/AuthContext"
import ThemeToggle from "./ThemeToggle"
import { LogOut, User } from "lucide-react"

export default function Header() {
  const { user, logout } = useAuth()

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-normal text-primary">NoteStack</h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{user?.name}</span>
          </div>
          <ThemeToggle />
          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}
