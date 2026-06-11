import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await login({ email, password })
      navigate('/')
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-87.5 flex flex-col gap-3">
        {/* Form card */}
        <div className="border border-[#262626] px-10 py-10 flex flex-col items-center gap-5">
          <h1
            className="text-white text-[2.2rem] leading-none select-none"
            style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}
          >
            Instagram
          </h1>

          <form onSubmit={submit} className="w-full flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="Phone number, username, or email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full bg-[#121212] border border-[#363636] rounded-sm px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#a8a8a8] placeholder:text-[#737373] transition-colors"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full bg-[#121212] border border-[#363636] rounded-sm px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#a8a8a8] placeholder:text-[#737373] transition-colors"
            />
            {error && <p className="text-xs text-red-400 text-center py-1">{error}</p>}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-[#0095f6] hover:bg-[#1877f2] disabled:bg-[#0095f6]/40 disabled:cursor-not-allowed text-white text-sm font-semibold py-1.5 rounded-lg mt-1.5 transition-colors"
            >
              {loading ? 'Logging in...' : 'Log in'}
            </button>
          </form>

          {/* OR divider */}
          <div className="w-full flex items-center gap-4">
            <div className="flex-1 h-px bg-[#363636]" />
            <span className="text-xs font-semibold text-[#a8a8a8]">OR</span>
            <div className="flex-1 h-px bg-[#363636]" />
          </div>

          {/* Forgot password */}
          <button className="text-sm text-white hover:text-[#a8a8a8] transition-colors">
            Forgot password?
          </button>
        </div>

        {/* Sign up link */}
        <div className="border border-[#262626] px-10 py-4 text-center text-sm text-[#a8a8a8]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#0095f6] font-semibold hover:text-white transition-colors">
            Sign up
          </Link>
        </div>

        {/* Get the app */}
        <div className="text-center mt-2">
          <p className="text-sm text-[#a8a8a8] mb-4">Get the app.</p>
          <div className="flex justify-center gap-2">
            <div className="border border-[#363636] rounded px-3 py-2 text-xs text-white text-center leading-tight">
              <p className="text-[10px] text-[#a8a8a8]">Download on the</p>
              <p className="font-semibold">App Store</p>
            </div>
            <div className="border border-[#363636] rounded px-3 py-2 text-xs text-white text-center leading-tight">
              <p className="text-[10px] text-[#a8a8a8]">Get it on</p>
              <p className="font-semibold">Google Play</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
