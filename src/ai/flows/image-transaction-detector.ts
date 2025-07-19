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

const ImageTransactionInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a receipt or bank statement, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});

export type ImageTransactionInput = z.infer<typeof ImageTransactionInputSchema>;

const ImageTransactionOutputSchema = z.object({
  transactionType: z.enum(['income', 'expense']).describe('The type of transaction.'),
  amount: z.number().describe('The amount of the transaction.'),
  date: z.string().describe('The date of the transaction (YYYY-MM-DD).'),
  category: z.string().describe('The category of the transaction.'),
  description: z.string().describe('A short description of the transaction.'),
});

export type ImageTransactionOutput = z.infer<typeof ImageTransactionOutputSchema>;

export async function imageTransactionDetector(input: ImageTransactionInput): Promise<ImageTransactionOutput> {
  return imageTransactionDetectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageTransactionDetectorPrompt',
  input: {schema: ImageTransactionInputSchema},
  output: {schema: ImageTransactionOutputSchema},
  prompt: `You are an expert financial assistant.  Your job is to extract transaction details from images of receipts and bank statements.

  Analyze the image provided to extract the following information:

  - transactionType: Determine whether the image represents an income or expense.
  - amount: Extract the transaction amount.
  - date: Extract the transaction date in YYYY-MM-DD format.
  - category: Determine the appropriate transaction category (e.g., Food, Transport, Bills, Salary).
  - description: Provide a concise description of the transaction.

  Here is the image for analysis:
  {{media url=photoDataUri}}

  Ensure that the output is accurate and well-formatted.
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
    inputSchema: ImageTransactionInputSchema,
    outputSchema: ImageTransactionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
