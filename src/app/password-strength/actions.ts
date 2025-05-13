"use server";

import { suggestStrongerPasswords as suggestStrongerPasswordsFlow } from '@/ai/flows/suggest-stronger-passwords';
import type { SuggestStrongerPasswordsInput, SuggestStrongerPasswordsOutput as FlowOutput } from '@/ai/flows/suggest-stronger-passwords';

// Re-exporting the type for client-side components
export type { SuggestStrongerPasswordsInput, FlowOutput as SuggestStrongerPasswordsOutput };

export async function suggestStrongerPasswords(input: SuggestStrongerPasswordsInput): Promise<FlowOutput> {
  // Input validation could be added here if needed, beyond Zod schema in flow
  // For example, check for profanity or excessively long inputs if that's a concern.
  
  try {
    const result = await suggestStrongerPasswordsFlow(input);
    return result;
  } catch (error) {
    console.error("Error in suggestStrongerPasswords server action:", error);
    // You might want to return a more specific error structure or throw a custom error
    // For now, re-throwing the original error or a generic one.
    throw new Error("Failed to generate password suggestions due to a server error.");
  }
}
