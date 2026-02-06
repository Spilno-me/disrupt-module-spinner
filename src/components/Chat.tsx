'use client';

/**
 * Chat Component
 *
 * Conversational interface for module creation.
 * Clean, minimal, focused on the conversation.
 */

import { useRef, useEffect, useState, useCallback } from 'react';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { ArtifactPreview } from './ArtifactPreview';
import { extractArtifacts } from '@/lib/artifacts';
import { useVault } from '@/lib/vault-context';
import { generateVaultContext } from '@/lib/prompts';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { currentModule } = useVault();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Generate vault context to send with request
      const vaultContext = generateVaultContext(currentModule);

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          vaultContext,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };

      setMessages((prev) => [...prev, assistantMessage]);

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        assistantContent += chunk;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: assistantContent }
              : m
          )
        );
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, messages, currentModule]);

  // Handle Enter to submit (Shift+Enter for newline)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={(s) => setInputValue(s)} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && <ThinkingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-zinc-800 bg-zinc-950 px-4 py-4">
        <form onSubmit={handleSubmit} className="mx-auto max-w-3xl">
          <div className="relative">
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={currentModule
                ? `Building ${currentModule.name}... describe what you need`
                : "Describe what you need... (e.g., 'Create incident severity levels')"
              }
              rows={1}
              className="w-full resize-none rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-3 pr-12 text-zinc-100 placeholder-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              style={{ minHeight: '48px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="absolute bottom-2 right-2 rounded-lg bg-emerald-600 p-2 text-white transition-colors hover:bg-emerald-500 disabled:opacity-50 disabled:hover:bg-emerald-600"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onSuggestionClick: (suggestion: string) => void;
}

function EmptyState({ onSuggestionClick }: EmptyStateProps) {
  const suggestions = [
    'Create incident severity levels',
    'Build an inspection form',
    'Design approval workflow',
  ];

  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h2 className="mb-2 text-xl font-semibold text-zinc-100">
          Module Builder
        </h2>
        <p className="mb-6 max-w-md text-zinc-400">
          Describe the module artifacts you need. I&apos;ll generate
          dictionaries, forms, and business processes for your HSE system.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => onSuggestionClick(suggestion)}
              className="rounded-full border border-zinc-700 px-4 py-2 text-sm text-zinc-300 transition-colors hover:border-emerald-500 hover:text-emerald-400"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const artifacts = extractArtifacts(message.content);

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] ${
          isUser
            ? 'rounded-2xl rounded-br-md bg-emerald-600 px-4 py-3 text-white'
            : 'space-y-4'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{message.content}</p>
        ) : (
          <>
            <div className="prose prose-invert prose-sm max-w-none">
              <MessageContent content={message.content} />
            </div>
            {artifacts.length > 0 && (
              <div className="mt-4 space-y-3">
                {artifacts.map((artifact, index) => (
                  <ArtifactPreview key={index} artifact={artifact} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  // Remove JSON code blocks from display (they're shown as ArtifactPreview)
  const cleanContent = content
    .replace(/```json[\s\S]*?```/g, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim();

  return <p className="whitespace-pre-wrap text-zinc-300">{cleanContent}</p>;
}

function ThinkingIndicator() {
  return (
    <div className="flex items-center gap-2 text-zinc-500">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span className="text-sm">Generating artifacts...</span>
    </div>
  );
}
