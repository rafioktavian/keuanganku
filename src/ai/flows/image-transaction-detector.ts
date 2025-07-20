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
import { db } from '@/lib/db';

const FlowInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt or bank statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

const PromptInputSchema = FlowInputSchema.extend({
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
  input: {schema: PromptInputSchema},
  output: {schema: ImageTransactionOutputSchema},
  prompt: `You are a financial assistant expert in analyzing receipts, invoices, and salary slips written in Indonesian.
Analyze the provided image and extract the following transaction details.

CRITICAL RULES:
1.  **Transaction Type**: First, determine if it is 'income' (e.g., salary slip, "slip gaji", "penerimaan") or 'expense' (e.g., store receipt, invoice, "struk").
2.  **Category Classification**: This is the most important step. Based on the transaction type, you MUST classify the transaction and select the most logical category from the provided lists. The value for the 'category' field MUST be one of the provided names.
    - If the image is a salary slip or shows a salary-related description (gaji, salary, payroll, take home pay), the category MUST be 'Gaji' and transaction type MUST be 'income'.
    - If it's a food receipt, the category could be 'Makanan & Minuman'.
    - If the category is ambiguous or cannot be determined, you MUST use 'Lainnya'.
    - For 'income', choose from: {{{incomeCategories}}}.
    - For 'expense', choose from: {{{expenseCategories}}}.
3.  **Amount**: Identify the final total amount. Return it as a number. For example, if the amount is Rp12.345,50, it should be 12345.50. If it's Rp12.000, it should be 12000. Ignore separators like '.' or ','.
4.  **Description**: Provide a short, clear description, like the store name or "Gaji Bulanan".
5.  **Date**: Find the transaction date and format it as YYYY-MM-DD. If no date is present, use today's date.
6.  **Source of Funds**: If the payment source is visible (e.g., QRIS payment showing Gopay, BCA, OVO), identify it and use the corresponding value from this list: {{{fundSources}}}. If it's not clear, you MUST omit this field.

Image to analyze: {{media url=photoDataUri}}

Provide your response in the requested JSON format.
`,
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
    const allCategories = await db.categories.toArray();
    const allFundSources = await db.fundSources.toArray();

    const incomeCategories = allCategories.filter(c => c.type === 'income').map(c => c.name);
    const expenseCategories = allCategories.filter(c => c.type === 'expense').map(c => c.name);
    const fundSources = allFundSources.map(fs => fs.name);

    const promptInput = {
      ...input,
      incomeCategories,
      expenseCategories,
      fundSources,
    };

    const {output} = await prompt(promptInput);
    return output!;
  }
);
