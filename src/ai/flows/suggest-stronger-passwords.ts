'use server';

/**
 * @fileOverview Generates stronger password suggestions using AI, along with reasoning for their strength.
 *
 * - suggestStrongerPasswords - A function that suggests stronger password alternatives.
 * - SuggestStrongerPasswordsInput - The input type for the suggestStrongerPasswords function.
 * - SuggestStrongerPasswordsOutput - The return type for the suggestStrongerPasswords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestStrongerPasswordsInputSchema = z.object({
  password: z.string().describe('The user-created password to be strengthened.'),
});
export type SuggestStrongerPasswordsInput = z.infer<typeof SuggestStrongerPasswordsInputSchema>;

const SuggestStrongerPasswordsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested stronger password alternatives.'),
  reasoning: z
    .array(z.string())
    .describe('An array of reasoning for the strength of each suggested password.'),
});
export type SuggestStrongerPasswordsOutput = z.infer<typeof SuggestStrongerPasswordsOutputSchema>;

export async function suggestStrongerPasswords(
  input: SuggestStrongerPasswordsInput
): Promise<SuggestStrongerPasswordsOutput> {
  return suggestStrongerPasswordsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestStrongerPasswordsPrompt',
  input: {schema: SuggestStrongerPasswordsInputSchema},
  output: {schema: SuggestStrongerPasswordsOutputSchema},
  prompt: `You are a security expert. Given a user-created password, suggest three stronger password alternatives and provide reasoning for their strength. Ensure each suggestion is significantly different.

User-created password: {{{password}}}

Output format: JSON with 'suggestions' (array of strings) and 'reasoning' (array of strings).`,
});

const suggestStrongerPasswordsFlow = ai.defineFlow(
  {
    name: 'suggestStrongerPasswordsFlow',
    inputSchema: SuggestStrongerPasswordsInputSchema,
    outputSchema: SuggestStrongerPasswordsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
