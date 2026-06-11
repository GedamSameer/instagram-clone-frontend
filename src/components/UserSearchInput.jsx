import { X } from 'lucide-react'

export default function UserSearchInput({ value, onChange, placeholder = 'Search', autoFocus = false }) {
  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-[#262626] rounded-lg px-4 py-2 text-sm text-white placeholder:text-[#a8a8a8] focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#a8a8a8] hover:text-white transition-colors"
          aria-label="Clear search"
        >
          <X size={16} />
        </button>
      )}
    </div>
  )
}
