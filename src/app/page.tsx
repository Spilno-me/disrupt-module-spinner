/**
 * Spinner - Module Builder
 *
 * AI-native conversational interface for creating HSE module artifacts.
 * Dictionaries, Forms, and Business Processes — generated through dialogue.
 */

import { Chat } from '@/components/Chat';

export default function Home() {
  return (
    <main className="flex h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold">Spinner</h1>
            <p className="text-xs text-zinc-500">Module Builder</p>
          </div>
        </div>

        <nav className="flex items-center gap-4">
          <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            AI Native
          </span>
        </nav>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Chat />
      </div>
    </main>
  );
}
