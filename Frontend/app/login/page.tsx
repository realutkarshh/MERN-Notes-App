"use client"

import type React from "react"
import { useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Mail, Lock } from "lucide-react"
import ThemeToggle from "@/components/ThemeToggle"
import LoginImage from "@/public/login-image.png"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const success = await login(email, password)
    if (success) router.push("/dashboard")
    setLoading(false)
  }

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-background">
      {/* Left: Image side (desktop only) */}
      <div className="hidden md:block md:w-1/2 h-screen relative">
        <img
          src = "/login-image.png"
          alt="Notes - Unsplash"
          className="object-cover w-full h-full"
          loading="lazy"
        />
        <div className="absolute top-4 right-4 z-10">
          <ThemeToggle />
        </div>
      </div>
      {/* Right: Login card */}
      <div className="w-full md:w-1/2 min-h-screen flex flex-col justify-center items-center relative p-6 bg-background">
        {/* ThemeToggle shown only on mobile */}
        <div className="absolute top-4 right-4 block md:hidden">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md bg-card/80 border border-border rounded-2xl shadow-xl px-7 py-9 backdrop-blur-sm">
          <div className="text-center mb-9">
            <h1 className="text-2xl font-bold tracking-tight text-primary mb-1">Welcome Back</h1>
            <p className="text-sm text-muted-foreground tracking-wide">Sign in to your account</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-[15px] font-medium text-foreground mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg bg-transparent border border-border
                            text-foreground placeholder:text-muted-foreground
                            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
                            transition-colors duration-150"
                  required
                />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="block text-[15px] font-medium text-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-12 py-2.5 rounded-lg bg-transparent border border-border
                            text-foreground placeholder:text-muted-foreground
                            focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10
                            transition-colors duration-150"
                  required
                />
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground
                        font-semibold tracking-wide shadow-sm hover:bg-primary/90 transition
                        disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
          <div className="mt-8 text-center text-sm">
            <p className="text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/register" className="text-primary font-medium hover:underline underline-offset-2 transition">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
