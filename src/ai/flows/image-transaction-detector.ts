'use server';

/**
 * @fileOverview Extracts transaction details from an image using GenAI.
 *
 * - imageTransactionDetector - A function that handles the image-based transaction detection process.
 * - ImageTransactionInput - The input type for the imageTransactionDetector function.
 * - ImageTransactionOutput - The return type for the imageTransactionDetector function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FlowInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt or bank statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  incomeCategories: z.array(z.string()),
  expenseCategories: z.array(z.string()),
  fundSources: z.array(z.string()),
});

export type ImageTransactionInput = z.infer<typeof FlowInputSchema>;

const ImageTransactionOutputSchema = z.object({
  transactionType: z.enum(['income', 'expense']).describe('Tipe transaksi.'),
  amount: z.number().describe('Jumlah transaksi dalam Rupiah (IDR).'),
  date: z.string().describe('Tanggal transaksi (YYYY-MM-DD).'),
  category: z.string().describe('Kategori transaksi.'),
  description: z.string().describe('Deskripsi singkat transaksi.'),
  fundSource: z.string().optional().describe('Sumber dana yang digunakan (jika terlihat).'),
});

export type ImageTransactionOutput = z.infer<typeof ImageTransactionOutputSchema>;

export async function imageTransactionDetector(input: ImageTransactionInput): Promise<ImageTransactionOutput> {
  return imageTransactionDetectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageTransactionDetectorPrompt',
  input: {schema: FlowInputSchema},
  output: {schema: ImageTransactionOutputSchema},
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
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_ONLY_HIGH',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_NONE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_LOW_AND_ABOVE',
      },
    ],
  },
});

const imageTransactionDetectorFlow = ai.defineFlow(
  {
    name: 'imageTransactionDetectorFlow',
    inputSchema: FlowInputSchema,
    outputSchema: ImageTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
