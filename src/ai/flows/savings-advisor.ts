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

Your task is to generate a short, actionable, and encouraging message for the user.

Follow these steps:
1.  **Calculate Total Income and Expenses**: Sum up the amounts for all 'income' and 'expense' transactions.
2.  **Analyze Spending Habits**: Identify the top 2-3 spending categories.
3.  **Check Savings Status**:
    *   **If income > expenses**: The user is saving money! Start with a positive and praiseworthy comment like "Kerja bagus! Anda berhasil menabung bulan ini." or "Luar biasa! Pengelolaan keuangan Anda sangat baik."
    *   **If expenses > income**: The user is overspending. Be gentle and encouraging. Start with a supportive tone, like "Tidak apa-apa, mari kita lihat beberapa cara untuk meningkatkan tabungan bulan depan."
    *   **If no income**: Assume they are tracking expenses only. Focus on spending habits.
4.  **Provide Personalized Tips**:
    *   Based on the top spending categories, give 1-2 specific, simple, and actionable tips. For example, if "Makanan & Minuman" is a high category, suggest "Anda bisa coba mengurangi jajan di luar dan membawa bekal dari rumah beberapa kali seminggu."
    *   Keep the tips realistic and easy to implement.
5.  **Concluding Remark**: End with a positive and motivational sentence, like "Terus semangat, ya!" or "Sedikit demi sedikit, lama-lama menjadi bukit."

**IMPORTANT**:
*   Keep the entire response concise, friendly, and in Bahasa Indonesia.
*   The response should be a single string of text.
*   Do not return markdown, just plain text.
`,
});

const savingsAdvisorFlow = ai.defineFlow(
  {
    name: 'savingsAdvisorFlow',
    inputSchema: SavingsAdviceInputSchema,
    outputSchema: SavingsAdviceOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);

    if (!output) {
      throw new Error("AI failed to produce an output.");
    }
    
    return output;
  }
);
