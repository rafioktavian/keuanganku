
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Debt, FundSource } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';


const formatToRupiah = (value: number | string) => {
  if (typeof value === 'string' && value.startsWith('Rp ')) return value;
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(numberValue);
};

const parseFromRupiah = (value: string) => Number(value.replace(/[^0-9]/g, ''));


interface AddPaymentFormProps {
  debt: Debt;
  onAddPayment: (debtId: number, amount: number, fundSource: string) => void;
  onClose: () => void;
}

export default function AddPaymentForm({ debt, onAddPayment, onClose }: AddPaymentFormProps) {
    const { toast } = useToast();
    const isDebt = debt.type === 'debt';

    const formSchema = z.object({
        amount: z.coerce
          .number()
          .positive({ message: 'Jumlah harus lebih dari 0.' })
          .max(debt.currentAmount, `Jumlah tidak bisa melebihi sisa ${isDebt ? 'utang' : 'piutang'} (${formatToRupiah(debt.currentAmount)})`),
        fundSource: z.string().min(1, { message: 'Sumber dana harus diisi.' }),
      });

    const fundSources = useLiveQuery(() => db.fundSources.toArray(), []);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            amount: debt.currentAmount,
            fundSource: '',
        },
    });

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        if(debt.id === undefined) return;
        onAddPayment(debt.id, values.amount, values.fundSource);
        toast({
            title: 'Sukses!',
            description: `Pembayaran ${isDebt ? 'utang' : 'piutang'} telah dicatat.`
        })
        onClose();
    };

    return (
        <DialogContent>
        <DialogHeader>
            <DialogTitle>Catat {isDebt ? 'Pembayaran Utang' : 'Penerimaan Piutang'}</DialogTitle>
            <DialogDescription>
             Untuk: {debt.personName}
            </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Jumlah {isDebt ? 'Pembayaran' : 'Penerimaan'}</FormLabel>
                    <FormControl>
                    <Input
                        placeholder={formatToRupiah(debt.currentAmount)}
                        value={formatToRupiah(field.value || 0)}
                        onChange={e => field.onChange(parseFromRupiah(e.target.value))}
                    />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
             <FormField
                control={form.control}
                name="fundSource"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel>{isDebt ? 'Bayar Dari' : 'Terima Ke'}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih Sumber Dana" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {fundSources?.map((fs) => (
                            <SelectItem key={fs.id} value={fs.name}>{fs.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                )}
                />
             <Alert variant="default" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-500/30">
                <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <AlertTitle className="text-blue-800 dark:text-blue-300">Info</AlertTitle>
                <AlertDescription className="text-blue-700 dark:text-blue-400">
                    Transaksi {isDebt ? 'pengeluaran' : 'pemasukan'} akan dibuat secara otomatis.
                </AlertDescription>
            </Alert>
            <DialogFooter>
                <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
                <Button type="submit">Simpan</Button>
            </DialogFooter>
            </form>
        </Form>
        </DialogContent>
    );
}
