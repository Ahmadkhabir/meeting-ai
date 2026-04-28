'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Meeting {
  id: string
  title: string
  date: string
  duration: string
  transcript: string
  summary?: string
  actionItems?: string[]
}

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [selected, setSelected] = useState<Meeting | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('meetings') || '[]')
      setMeetings(stored)
    } catch {
      setMeetings([])
    }
    setLoaded(true)
  }, [])

  function deleteMeeting(id: string) {
    const updated = meetings.filter((m) => m.id !== id)
    setMeetings(updated)
    localStorage.setItem('meetings', JSON.stringify(updated))
    if (selected?.id === id) setSelected(null)
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    } catch {
      return iso
    }
  }

  if (!loaded) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <h1 className="text-lg font-semibold">Meetings</h1>
          <Link
            href="/recording"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-sm font-medium transition-colors"
          >
            + Record
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto">
          {meetings.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <p className="text-sm">No meetings yet.</p>
              <Link
                href="/recording"
                className="mt-3 inline-block text-indigo-400 hover:underline text-sm"
              >
                Record your first meeting →
              </Link>
            </div>
          ) : (
            meetings.map((m) => (
              <button
                key={m.id}
                onClick={() => setSelected(m)}
                className={`w-full text-left p-4 border-b border-gray-800 hover:bg-gray-900 transition-colors ${
                  selected?.id === m.id ? 'bg-gray-900 border-l-2 border-l-indigo-500' : ''
                }`}
              >
                <p className="font-medium text-sm truncate">{m.title}</p>
                <p className="text-gray-500 text-xs mt-1">
                  {formatDate(m.date)} · {m.duration}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div className="flex-1 overflow-y-auto">
        {selected ? (
          <div className="p-8 max-w-3xl">
            <div className="flex items-start justify-between mb-6 gap-4">
              <div>
                <h2 className="text-2xl font-bold">{selected.title}</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {formatDate(selected.date)} · {selected.duration}
                </p>
              </div>
              <button
                onClick={() => deleteMeeting(selected.id)}
                className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/70 border border-red-800 text-red-400 rounded-lg text-sm transition-colors shrink-0"
              >
                Delete
              </button>
            </div>

            {/* Summary */}
            {selected.summary && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Summary
                </h3>
                <div className="bg-gray-900 rounded-xl p-4 text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {selected.summary}
                </div>
              </div>
            )}

            {/* Action items */}
            {selected.actionItems && selected.actionItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Action Items
                </h3>
                <ul className="space-y-2">
                  {selected.actionItems.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-200">
                      <span className="text-indigo-400 mt-0.5">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcript */}
            <div>
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">
                Transcript
              </h3>
              <div className="bg-gray-900 rounded-xl p-4 text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                {selected.transcript || <span className="text-gray-600">No transcript available.</span>}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600">
            <p>Select a meeting to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
