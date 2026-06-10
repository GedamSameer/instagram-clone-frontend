import React from 'react'
import { Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import ProtectedRoute from './auth/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import Home from './pages/Home'


function App() {
  return (
    <AuthProvider>
      <nav style={{ padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/" style={{ marginRight: 12 }}>Home</Link>
        <Link to="/login" style={{ marginRight: 12 }}>Login</Link>
        <Link to="/register">Register</Link>
      </nav>

      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
      </Routes>
    </AuthProvider>
  )
}

export default App
