import React from 'react'
import { useAuth } from '../auth/AuthContext'

export default function Home() {
  const { user, logout } = useAuth()

  return (
    <div className="p-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Instagram Clone</h1>
        <div className="flex items-center">
          <span className="mr-3">{user?.username || user?.email}</span>
          <button className="bg-red-500 text-white px-3 py-1 rounded" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="mt-6">
        <p>This is a protected home page. Your backend should set an httpOnly cookie on login.</p>
      </main>
    </div>
  )
}
