'use client'

import { useState } from "react"
import { useNotes } from "@/contexts/NotesContext"
import { Search, Filter, SortAsc } from "lucide-react"

export default function SearchAndFilter() {
  const {
    searchTerm,
    setSearchTerm,
    selectedTag,
    setSelectedTag,
    sortBy,
    setSortBy,
    tags,
  } = useNotes()

  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)

  return (
    <>
      <div className="bg-card border border-border rounded-lg p-4 mb-6">

        {/* Mobile view */}
        <div className="flex flex-col gap-4 md:hidden">
          {/* Search Bar */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {/* Filter Icon Button */}
            <button
              onClick={() => setIsFilterModalOpen(true)}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground"
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Desktop view */}
        <div className="hidden md:flex md:items-center md:gap-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Tag Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="pl-10 pr-8 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none min-w-[150px]"
            >
              <option value="">All Tags</option>
              {tags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="relative">
            <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "date" | "title")}
              className="pl-10 pr-8 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none min-w-[150px]"
            >
              <option value="date">Sort by Date</option>
              <option value="title">Sort by Title</option>
            </select>
          </div>
        </div>
      </div>

      {/* Modal for Mobile Filters */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center md:hidden">
          <div className="bg-card border border-border rounded-lg p-6 w-[90%] max-w-sm space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-semibold text-foreground">Filters</h3>
              <button
                onClick={() => setIsFilterModalOpen(false)}
                className="text-muted-foreground"
              >
                ✕
              </button>
            </div>

            {/* Filter by Tag */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="">All Tags</option>
                {tags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as "date" | "title")}
                className="w-full pl-10 pr-8 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring appearance-none"
              >
                <option value="date">Sort by Date</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
