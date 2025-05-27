"use client"

import { useAuth } from "@/contexts/AuthContext"
import ThemeToggle from "./ThemeToggle"
import { LogOut, User, Menu, X } from "lucide-react"
import { useState } from "react"
import clsx from "clsx";


export default function Header() {
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border px-6 py-4 relative z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-normal text-primary">NoteStack</h1>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-4">
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

        {/* Hamburger Menu for Mobile */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(true)}>
            <Menu className="h-6 w-6 text-primary" />
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={clsx(
          "fixed top-0 left-0 h-full w-64 bg-background text-primary shadow-lg z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="p-4 flex justify-between items-center border-b border-border">
          <h2 className="text-xl font-semibold">Menu</h2>
          <button onClick={() => setIsOpen(false)}>
            <X className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col items-center p-6 space-y-4">
          {/* Profile Icon */}
          <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
            <User className="h-10 w-10 text-foreground" />
          </div>

          {/* User Info */}
          <div className="text-center">
            <p className="text-lg text-foreground font-semibold">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full mt-4 px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            <div className="flex justify-center items-center space-x-2">
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}
