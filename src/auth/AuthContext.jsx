import React, { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/auth/me')
        setUser(res.data.user)
      } catch (err) {
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const login = async (credentials) => {
    const res = await api.post('/auth/login', credentials)
    if (res?.data?.user) setUser(res.data.user)
    return res
  }

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload)
    if (res?.data?.user) setUser(res.data.user)
    return res
  }

  const logout = async () => {
    await api.post('/auth/logout')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
