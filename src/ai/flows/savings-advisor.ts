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
  prompt: `You are a friendly and encouraging financial advisor. Your goal is to provide personalized savings tips based on the user's transaction history.

Analyze the following transactions:
{{{transactions}}}

**IMPORTANT INSTRUCTIONS:**
1.  **Analyze Spending Habits**: Based on the transactions, identify the top 2-3 spending categories.
2.  **Provide Personalized Tips**: Give 1-2 specific, simple, and actionable tips based on the analysis. For example, if "Makanan & Minuman" is high, suggest "Anda bisa coba mengurangi jajan di luar dan membawa bekal."
3.  **Tone**: Always be encouraging and positive.
4.  **Language**: The entire response MUST be in Bahasa Indonesia.
5.  **Format**: The response MUST be a single string of plain text, not markdown.
6.  **EMPTY DATA**: If the 'transactions' input is an empty array '[]', you MUST return the exact string: "Belum ada data transaksi untuk dianalisis. Coba tambahkan beberapa transaksi terlebih dahulu ya!"

**Example Responses:**
*   **Good Savings:** "Kerja bagus! Anda berhasil menabung bulan ini. Pengeluaran terbesar Anda ada di kategori Transportasi. Mungkin Anda bisa mencoba menggunakan transportasi umum lebih sering untuk menghemat."
*   **Overspending:** "Tidak apa-apa, mari kita lihat beberapa cara untuk berhemat. Pengeluaran untuk Belanja cukup tinggi. Coba buat daftar belanja sebelum pergi agar lebih fokus."

Now, generate a response based on the provided transaction data.`,
});

const savingsAdvisorFlow = ai.defineFlow(
  {
    name: 'savingsAdvisorFlow',
    inputSchema: SavingsAdviceInputSchema,
    outputSchema: SavingsAdviceOutputSchema,
  },
  async (input) => {
    // Fallback for empty transactions on the server-side as well
    if (input.transactions === '[]') {
        return "Belum ada data transaksi untuk dianalisis. Coba tambahkan beberapa transaksi terlebih dahulu ya!";
    }
      
    const { output } = await prompt(input);

    if (!output) {
      // Fallback in case the model still returns null despite the prompt instructions
      return "Tidak dapat menghasilkan saran saat ini. Silakan coba lagi nanti.";
    }
    
    return output;
  }
);
