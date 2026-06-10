import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({ username, email, password })
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
        <h1 className="text-2xl font-semibold mb-4">Register</h1>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="text-sm">
            <div className="font-medium mb-1">Username</div>
            <input className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label className="text-sm">
            <div className="font-medium mb-1">Email</div>
            <input className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="text-sm">
            <div className="font-medium mb-1">Password</div>
            <input className="w-full mt-1 p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-300" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="mt-2 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-60" type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        </form>
        <p className="text-sm text-center mt-4">
          Already have an account? <Link className="text-blue-600 hover:underline" to="/login">Log in</Link>
        </p>
      </div>
    </div>
  )
}
