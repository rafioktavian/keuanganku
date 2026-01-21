'use client';

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value);
};

export default function InitialBalanceCard() {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState<string>('');
  const [savedBalance, setSavedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const stored = window.localStorage.getItem('initialBalance');
    if (stored !== null) {
      const parsed = parseFloat(stored);
      if (!Number.isNaN(parsed)) {
        setInputValue(stored);
        setSavedBalance(parsed);
      }
    }
    setIsLoading(false);
  }, []);

  const handleSave = () => {
    if (typeof window === 'undefined') return;

    const numeric = parseFloat(inputValue.replace(',', '.'));
    if (Number.isNaN(numeric) || numeric < 0) {
      toast({
        variant: 'destructive',
        title: 'Input tidak valid',
        description: 'Masukkan angka saldo awal yang valid (>= 0).',
      });
      return;
    }

    window.localStorage.setItem('initialBalance', numeric.toString());
    setSavedBalance(numeric);

    toast({
      title: 'Saldo awal tersimpan',
      description: 'Saldo awal berhasil disimpan dan dapat diubah kapan saja.',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Saldo Awal</CardTitle>
        <CardDescription>
          Tentukan saldo awal total keuangan Anda sebelum mulai mencatat transaksi.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Saldo awal (dalam Rupiah)
          </label>
          <Input
            type="number"
            min={0}
            step="1000"
            inputMode="decimal"
            placeholder="contoh: 5000000"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
        </div>
        {!isLoading && savedBalance !== null && (
          <p className="text-sm text-muted-foreground">
            Saldo awal tersimpan:{' '}
            <span className="font-semibold">
              {formatCurrency(savedBalance)}
            </span>
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button type="button" onClick={handleSave}>
          Simpan Saldo Awal
        </Button>
      </CardFooter>
    </Card>
  );
}

