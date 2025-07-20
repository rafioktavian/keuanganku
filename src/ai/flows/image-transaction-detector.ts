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
  isIncome: z.boolean().describe('Set to true if the image is a salary slip or any other proof of income. Otherwise, set to false.'),
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

export type ExtractedTransaction = z.infer<typeof ExtractedTransactionSchema> & { type: 'income' | 'expense' };


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
Your most important task is to determine if the document represents income.
- Look for words like "gaji", "salary", "payroll", "take home pay", "penerimaan bersih", "pendapatan".
- If the document is a salary slip or contains any of these income-related words, you MUST set the 'isIncome' field to true.
- For all other documents, like store receipts or purchase invoices, you MUST set 'isIncome' to false.

**Other Extraction Rules:**

1.  **Category Classification**: Select the most logical category from the provided lists. The 'category' value MUST be one of the provided values.
    -   If 'isIncome' is true, choose from: {{{incomeCategories}}}. The most common choice is 'Gaji'.
    -   If 'isIncome' is false, choose from: {{{expenseCategories}}}.
    -   If no suitable category is found, use 'Lainnya'.
2.  **Amount**: Extract the final, total amount. It MUST be a number (e.g., 12500.50, not "Rp12.500,50").
3.  **Description**: Provide a short, relevant description (e.g., store name, "Gaji Bulanan", "Makan Siang").
4.  **Date**: Find the transaction date and format it as YYYY-MM-DD. If no date is found, use the current date.
5.  **Source of Funds**: If a payment source is clearly visible (e.g., from a QRIS receipt showing Gopay, BCA), select the corresponding value from this list: {{{fundSources}}}. If it's not clear, omit this field.

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
    
    if (!output) {
      throw new Error("AI failed to produce an output.");
    }
    
    // Post-processing logic to enforce the transaction type
    const finalOutput: ExtractedTransaction = {
      ...output,
      type: output.isIncome ? 'income' : 'expense',
    };

    // If it's income, forcefully set the category to 'Gaji' if available
    if (finalOutput.type === 'income') {
        const incomeCategories = input.incomeCategories.split(',');
        if (incomeCategories.includes('Gaji')) {
            finalOutput.category = 'Gaji';
        }
    }
    
    return finalOutput;
  }
);
