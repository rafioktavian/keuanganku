'use server';
/**
 * @fileOverview This file defines a Genkit flow for extracting transaction details from an image.
 *
 * - extractTransactionFromImage - A function that takes an image of a receipt or slip and returns structured transaction data.
 * - ExtractTransactionInput - The input type for the extractTransactionFromImage function.
 * - ExtractedTransaction - The return type for the extractTransactionFromImage function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

const ExtractTransactionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt, invoice, or salary slip, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  // We pass stringified versions of categories and sources to the prompt
  incomeCategories: z.string().describe("A comma-separated string of available income categories values."),
  expenseCategories: z.string().describe("A comma-separated string of available expense categories values."),
  fundSources: z.string().describe("A comma-separated string of available fund source values."),
});
export type ExtractTransactionInput = z.infer<typeof ExtractTransactionInputSchema>;


const ExtractedTransactionSchema = z.object({
  type: z.enum(['income', 'expense']).describe('The type of transaction.'),
  amount: z.number().describe('The total amount of the transaction as a number. Use a period (.) for decimal separators and no thousands separators.'),
  category: z
    .string()
    .describe(
      `The category of the transaction. For 'income', choose one of the provided values. For 'expense', choose one of the provided values. Must be one of the provided values.`
    ),
  description: z.string().describe('A brief, relevant description of the transaction (e.g., store name, "Gaji Bulanan").'),
  date: z.string().describe('The date of the transaction in YYYY-MM-DD format.'),
  source: z.string().optional().describe(`The source of funds if identifiable (e.g., from a QRIS receipt showing Gopay, BCA, etc.). Choose one of the provided values. If not clear, leave it out.`)
});

export type ExtractedTransaction = z.infer<typeof ExtractedTransactionSchema>;


export async function extractTransactionFromImage(
  input: ExtractTransactionInput
): Promise<ExtractedTransaction> {
  return extractTransactionFlow(input);
}


const prompt = ai.definePrompt({
  name: 'extractTransactionPrompt',
  input: { schema: ExtractTransactionInputSchema },
  output: { schema: ExtractedTransactionSchema },
  prompt: `You are a financial assistant expert in analyzing receipts, invoices, and salary slips.
Analyze the provided image and extract the following transaction details.

CRITICAL RULES:
1.  **Category Classification**: This is the most important step. You MUST classify the transaction based on its content and select the most logical category from the provided lists. The value for the 'category' field MUST be one of the provided values (e.g., 'salary', 'food', 'transport'). Do not use the label (e.g., "Gaji", "Makanan & Belanja").
    - If the image is a salary slip or shows a salary-related description, the category MUST be 'salary' (if available).
    - If it's a food receipt, the category MUST be 'food' (if available).
    - If the category is ambiguous or cannot be determined, you MUST use the value 'other_expense' for expenses or 'other_income' for income.
    - For 'income', choose from: {{{incomeCategories}}}.
    - For 'expense', choose from: {{{expenseCategories}}}.
2.  **Amount**: Identify the final total amount. Return it as a number. For example, if the amount is Rp12.345,50, it should be 12345.50. If it's Rp12.000, it should be 12000.
3.  **Transaction Type**: Determine if it is 'income' (e.g., salary slip) or 'expense' (e.g., store receipt, invoice).
4.  **Description**: Provide a short, clear description, like the store name or "Gaji Bulanan".
5.  **Date**: Find the transaction date and format it as YYYY-MM-DD. If no date is present, use today's date.
6.  **Source of Funds**: If the payment source is visible (e.g., QRIS payment showing Gopay, BCA, OVO), identify it and use the corresponding value from this list: {{{fundSources}}}. If it's not clear, omit this field.

Image to analyze: {{media url=photoDataUri}}

Provide your response in the requested JSON format.`,
});

const extractTransactionFlow = ai.defineFlow(
  {
    name: 'extractTransactionFlow',
    inputSchema: ExtractTransactionInputSchema,
    outputSchema: ExtractedTransactionSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
