
'use server';
/**
 * @fileOverview Defines a Genkit flow for providing personalized savings advice.
 *
 * - getSavingsAdvice - A function that analyzes transaction data and returns personalized savings tips.
 * - SavingsAdviceInput - The input type for the getSavingsAdvice function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const SavingsAdviceInputSchema = z.object({
  // Pass transactions as a string to avoid complex object parsing in the prompt.
  transactions: z
    .string()
    .describe(
      'A JSON string representation of the user\'s recent transactions. Each transaction has amount, type (income/expense), category, and description.'
    ),
});
export type SavingsAdviceInput = z.infer<typeof SavingsAdviceInputSchema>;

// The output is a simple string containing the advice.
const SavingsAdviceOutputSchema = z.string();
export type SavingsAdviceOutput = z.infer<typeof SavingsAdviceOutputSchema>;

export async function getSavingsAdvice(input: SavingsAdviceInput): Promise<SavingsAdviceOutput> {
  return savingsAdvisorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'savingsAdvisorPrompt',
  input: { schema: SavingsAdviceInputSchema },
  output: { schema: SavingsAdviceOutputSchema },
  prompt: `You are a friendly and encouraging financial advisor. Your goal is to provide personalized savings tips based on the user's transaction history. The entire response MUST be in Bahasa Indonesia.

Analyze the following transactions:
{{{transactions}}}

**CRITICAL INSTRUCTIONS:**
1.  **Analyze Spending Habits**: Identify the top 2-3 spending categories.
2.  **Provide Personalized Tips**: Give 1-2 specific, simple, and actionable tips based on the analysis. For example, if "Makanan & Minuman" is high, suggest "Anda bisa coba mengurangi jajan di luar dan membawa bekal."
3.  **Tone**: Always be encouraging and positive.
4.  **Format**: The response MUST be a single string of plain text, not markdown.
5.  **HANDLE EMPTY DATA**: This is the most important rule. If the 'transactions' input is an empty JSON array '[]', you MUST return the exact string: "Belum ada data transaksi untuk dianalisis. Coba tambahkan beberapa transaksi terlebih dahulu ya!". Do not return null or an empty response.

Now, generate a response based on the provided transaction data.`,
});

const savingsAdvisorFlow = ai.defineFlow(
  {
    name: 'savingsAdvisorFlow',
    inputSchema: SavingsAdviceInputSchema,
    outputSchema: SavingsAdviceOutputSchema,
  },
  async (input) => {
    // Server-side guard for empty transactions, as a failsafe
    if (input.transactions.trim() === '[]') {
        return "Belum ada data transaksi untuk dianalisis. Coba tambahkan beberapa transaksi terlebih dahulu ya!";
    }
      
    const { output } = await prompt(input);

    // Final fallback in case the model still returns null despite the strong prompt instructions
    if (!output) {
      return "Tidak dapat menghasilkan saran saat ini. Silakan coba lagi nanti.";
    }
    
    return output;
  }
);
