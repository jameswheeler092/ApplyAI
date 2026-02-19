'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  suggestions?: string[] // preset options shown as clickable chips below the input
}

export function TagInput({ value, onChange, placeholder, suggestions }: TagInputProps) {
  const [input, setInput] = useState('')

  function addTag(tag: string) {
    const trimmed = tag.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput('')
  }

  function removeTag(tag: string) {
    onChange(value.filter(t => t !== tag))
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(input)
    }
    if (e.key === 'Backspace' && !input && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 p-2 border rounded-md min-h-[44px]">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">
            {tag}
            <button onClick={() => removeTag(tag)} className="text-blue-500 hover:text-blue-700">&times;</button>
          </span>
        ))}
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => input && addTag(input)}
          placeholder={value.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[120px] outline-none text-sm"
        />
      </div>
      {suggestions && (
        <div className="flex flex-wrap gap-2 mt-2">
          {suggestions.filter(s => !value.includes(s)).map(s => (
            <button
              key={s}
              onClick={() => addTag(s)}
              className="text-xs border rounded px-2 py-1 text-gray-600 hover:bg-gray-50"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
