"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface User {
  id: string
  email: string
  companyName: string
  userType: "tender" | "bidder"
  contactNumber?: string
  address?: string
  bio?: string
  website?: string
  specializations?: string[]
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, userData: User) => void
  logout: () => void
  updateUser: (userData: Partial<User>) => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check for stored auth data on mount
    const storedToken = localStorage.getItem("auth_token")
    const storedUser = localStorage.getItem("auth_user")

    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        setToken(storedToken)
        setUser(userData)

        // Verify token is still valid by fetching user profile
        fetchUserProfile(storedToken)
      } catch (error) {
        console.error("Error parsing stored user data:", error)
        logout()
      }
    }

    setIsLoading(false)
  }, [])

  const fetchUserProfile = async (authToken: string) => {
    try {
      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setUser({
          id: data.user._id,
          email: data.user.email,
          companyName: data.user.companyName,
          userType: data.user.userType,
          contactNumber: data.user.contactNumber,
          address: data.user.address,
          bio: data.user.bio,
          website: data.user.website,
          specializations: data.user.specializations || [],
        })
      } else {
        // Token is invalid
        logout()
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
      logout()
    }
  }

  const login = (authToken: string, userData: User) => {
    setToken(authToken)
    setUser(userData)
    localStorage.setItem("auth_token", authToken)
    localStorage.setItem("auth_user", JSON.stringify(userData))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem("auth_token")
    localStorage.removeItem("auth_user")
    router.push("/auth/signin")
  }

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      localStorage.setItem("auth_user", JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    token,
    login,
    logout,
    updateUser,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
