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
  transactionType: z.enum(['income', 'expense']).describe('Tipe transaksi.'),
  amount: z.number().describe('Jumlah transaksi dalam Rupiah (IDR).'),
  date: z.string().describe('Tanggal transaksi (YYYY-MM-DD).'),
  category: z.string().describe('Kategori transaksi.'),
  description: z.string().describe('Deskripsi singkat transaksi.'),
});

export type ImageTransactionOutput = z.infer<typeof ImageTransactionOutputSchema>;

export async function imageTransactionDetector(input: ImageTransactionInput): Promise<ImageTransactionOutput> {
  return imageTransactionDetectorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'imageTransactionDetectorPrompt',
  input: {schema: ImageTransactionInputSchema},
  output: {schema: ImageTransactionOutputSchema},
  prompt: `Anda adalah asisten keuangan ahli berbahasa Indonesia. Tugas Anda adalah mengekstrak detail transaksi dari gambar struk atau laporan bank. Mata uang yang digunakan adalah Rupiah (IDR).

  Analisis gambar yang diberikan untuk mengekstrak informasi berikut:

  - transactionType: Tentukan apakah gambar tersebut merupakan 'income' (pemasukan) atau 'expense' (pengeluaran).
  - amount: Ekstrak jumlah transaksi dalam Rupiah (IDR). Jangan sertakan simbol mata uang atau pemisah ribuan.
  - date: Ekstrak tanggal transaksi dalam format YYYY-MM-DD.
  - category: Tentukan kategori transaksi yang sesuai (contoh: Makanan, Transportasi, Tagihan, Gaji).
  - description: Berikan deskripsi singkat tentang transaksi.

  Berikut adalah gambar untuk dianalisis:
  {{media url=photoDataUri}}

  Pastikan outputnya akurat dan terformat dengan baik dalam bahasa Indonesia.
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
