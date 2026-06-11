import { createContext, useContext, useState } from 'react'

const AvatarCacheContext = createContext(null)

export function AvatarCacheProvider({ children }) {
  const [cache, setCache] = useState({})

  const getUrl = (userId, fallback) => {
    if (userId != null && cache[userId] !== undefined) return cache[userId]
    return fallback || ''
  }

  const setUrl = (userId, url) => {
    if (userId == null) return
    setCache(prev => ({ ...prev, [userId]: url }))
  }

  return (
    <AvatarCacheContext.Provider value={{ getUrl, setUrl }}>
      {children}
    </AvatarCacheContext.Provider>
  )
}

export function useAvatarCache() {
  const ctx = useContext(AvatarCacheContext)
  if (!ctx) return { getUrl: (_, fallback) => fallback || '', setUrl: () => {} }
  return ctx
}
