/**
 * Chat API Route
 *
 * AI-native conversational endpoint for module creation.
 * Uses Vercel AI Gateway with BYOK.
 */

import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

// Vercel AI Gateway (OpenAI-compatible endpoint)
const gateway = createOpenAI({
  baseURL: 'https://ai-gateway.vercel.sh/v1',
  apiKey: process.env.VERCEL_AI_API_KEY,
});

export async function POST(req: Request) {
  const { messages, vaultContext } = await req.json();

  // Append vault context to system prompt so AI knows what artifacts exist
  const systemPrompt = SYSTEM_PROMPT + (vaultContext || '');

  const result = streamText({
    model: gateway('anthropic/claude-sonnet-4-20250514'),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}
