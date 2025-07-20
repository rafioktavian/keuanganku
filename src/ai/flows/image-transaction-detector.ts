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
  prompt: `Anda adalah asisten keuangan ahli berbahasa Indonesia. Tugas Anda adalah mengekstrak detail transaksi dari gambar struk atau slip gaji. Mata uang yang digunakan adalah Rupiah (IDR).

  Analisis gambar yang diberikan untuk mengekstrak informasi berikut:

  - transactionType: Tentukan apakah ini 'income' (pemasukan) atau 'expense' (pengeluaran).
  - amount: Ekstrak jumlah total transaksi (biasanya Take Home Pay jika ini adalah slip gaji). Ini harus berupa angka saja, tanpa simbol 'Rp', titik, atau koma. Contohnya, 'Rp5.250.000' harus diekstrak sebagai 5250000.
  - date: Ekstrak tanggal transaksi atau periode gaji dalam format YYYY-MM-DD.
  - category: Berikan kategori yang paling sesuai.
  - description: Berikan deskripsi singkat dan jelas tentang transaksi.

  Aturan Paling Penting (WAJIB DIIKUTI):
  1.  **IDENTIFIKASI GAJI**: Jika gambar adalah slip gaji, atau mengandung kata "gaji", "salary", "payroll", "take home pay", atau "penerimaan bersih", maka Anda **HARUS** melakukan hal berikut:
      *   Atur \`transactionType\` ke 'income'.
      *   Atur \`category\` ke 'Gaji'.
      *   Ini adalah prioritas tertinggi. Abaikan aturan lain jika kondisi ini terpenuhi.

  2.  **PENGELUARAN**: Untuk semua gambar lain yang bukan slip gaji (seperti struk belanja, tagihan), atur \`transactionType\` ke 'expense'. Kategorinya bisa 'Makanan & Minuman', 'Transportasi', 'Tagihan', dll.

  3.  **FOKUS PADA JUMLAH TOTAL**: Selalu cari jumlah akhir atau total. Untuk struk belanja, cari kata kunci seperti 'TOTAL' atau 'TOTAL BAYAR'. Untuk slip gaji, cari 'Take Home Pay' atau 'Penerimaan Bersih'.

  Berikut adalah gambar untuk dianalisis:
  {{media url=photoDataUri}}

  Pastikan outputnya akurat dan sesuai dengan aturan di atas.
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
