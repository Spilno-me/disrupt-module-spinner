/**
 * Chat API Route
 *
 * AI-native conversational endpoint for module creation.
 * Uses Vercel AI Gateway with Anthropic BYOK.
 */

import { createAnthropic } from '@ai-sdk/anthropic';
import { streamText } from 'ai';
import { SYSTEM_PROMPT } from '@/lib/prompts';

export const maxDuration = 30;

// Vercel AI Gateway with BYOK
const anthropic = createAnthropic({
  baseURL: 'https://api.vercel.ai/v1',
  apiKey: process.env.VERCEL_AI_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: SYSTEM_PROMPT,
    messages,
  });

  return result.toTextStreamResponse();
}
