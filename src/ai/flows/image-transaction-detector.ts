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
  prompt: `You are an expert financial assistant. Your task is to analyze an image of a financial document (receipt, invoice, salary slip) and extract transaction details into a structured JSON format.

**ABSOLUTE FIRST PRIORITY: INCOME DETECTION**
Before anything else, you MUST determine if the image is a salary slip or contains words like "gaji", "salary", "payroll", "take home pay", "penerimaan bersih".
- If it is, you MUST set the 'type' field to 'income'.
- You MUST also set the 'category' field to the most appropriate income category from the provided list (e.g., 'Gaji').
- This rule overrides all other classification rules. If it is a salary slip, it is 'income', no exceptions.

**General Rules for Extraction:**

1.  **Transaction Type**: If the document is not for income (as determined above), classify it as 'expense'. This applies to store receipts, purchase invoices, etc.
2.  **Category Classification**: Select the most logical category from the provided lists. The 'category' value MUST be one of the provided values.
    -   For 'income', choose from: {{{incomeCategories}}}.
    -   For 'expense', choose from: {{{expenseCategories}}}.
    -   If no suitable category is found, use 'Lainnya' for the respective type.
3.  **Amount**: Extract the final, total amount. It MUST be a number (e.g., 12500.50, not "Rp12.500,50").
4.  **Description**: Provide a short, relevant description (e.g., store name, "Gaji Bulanan", "Makan Siang").
5.  **Date**: Find the transaction date and format it as YYYY-MM-DD. If no date is found, use the current date.
6.  **Source of Funds**: If a payment source is clearly visible (e.g., from a QRIS receipt showing Gopay, BCA), select the corresponding value from this list: {{{fundSources}}}. If it's not clear, omit this field.

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
