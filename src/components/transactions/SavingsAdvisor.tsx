'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import type { Transaction } from '@/lib/types';
import { getSavingsAdvice } from '@/ai/flows/savings-advisor';
import { useToast } from '@/hooks/use-toast';

interface SavingsAdvisorProps {
  transactions: Transaction[];
}

export default function SavingsAdvisor({ transactions }: SavingsAdvisorProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [advice, setAdvice] = useState<string | null>(null);
  const { toast } = useToast();

  const hasTransactions = transactions && transactions.length > 0;

  const handleGetAdvice = async () => {
    if (!hasTransactions) {
      setAdvice("Belum ada data transaksi untuk dianalisis. Coba tambahkan beberapa transaksi terlebih dahulu ya!");
      return;
    }

    setIsLoading(true);
    setAdvice(null);

    try {
      // We only need a subset of fields for the prompt
      const relevantData = transactions.map(t => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        description: t.description,
      }));

      const result = await getSavingsAdvice({
        transactions: JSON.stringify(relevantData),
      });
      setAdvice(result);
    } catch (error) {
      console.error('AI Error:', error);
      toast({
        variant: 'destructive',
        title: 'Analisis Gagal',
        description: 'Tidak dapat menghasilkan saran saat ini. Silakan coba lagi.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            Tips Menabung dari AI
        </CardTitle>
        <CardDescription>
          Dapatkan saran yang dipersonalisasi berdasarkan kebiasaan belanja Anda.
        </CardDescription>
      </CardHeader>
      <CardContent className="min-h-[100px]">
        {isLoading ? (
          <div className="flex items-center justify-center space-x-2 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Menganalisis data Anda...</span>
          </div>
        ) : advice ? (
          <p className="text-sm text-foreground whitespace-pre-wrap">{advice}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
             {hasTransactions 
                ? "Klik tombol di bawah untuk mendapatkan tips menabung cerdas dari AI."
                : "Belum ada data transaksi untuk dianalisis. Tambahkan beberapa transaksi untuk memulai."}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={handleGetAdvice} disabled={isLoading || !hasTransactions} className="w-full">
            {isLoading ? (
                'Menganalisis...'
            ) : advice ? (
                <>
                <Sparkles className="mr-2 h-4 w-4"/>
                Dapatkan Tips Baru
                </>
            ) : (
                <>
                <Sparkles className="mr-2 h-4 w-4"/>
                Beri Aku Saran
                </>
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}
