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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import type { Investment } from '@/lib/types';

const formSchema = z.object({
  name: z.string().min(1, 'Nama investasi harus diisi.'),
  type: z.string().min(1, 'Jenis investasi harus dipilih.'),
  initialAmount: z.coerce
    .number()
    .positive({ message: 'Jumlah investasi harus lebih dari 0.' }),
  currentValue: z.coerce.number().min(0, 'Nilai saat ini tidak boleh negatif.'),
  purchaseDate: z.date({ required_error: 'Tanggal pembelian harus diisi.' }),
});

interface AddInvestmentFormProps {
  onAddInvestment: (investment: Omit<Investment, 'id'>) => void;
}

const formatToRupiah = (value: number | string) => {
  if (typeof value === 'string' && value.startsWith('Rp ')) return value;
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(numberValue);
};

const parseFromRupiah = (value: string) => Number(value.replace(/[^0-9]/g, ''));

export default function AddInvestmentForm({ onAddInvestment }: AddInvestmentFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      initialAmount: 0,
      currentValue: 0,
      purchaseDate: new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddInvestment(values);
    form.reset();
  };

  const investmentTypes = ['Saham', 'Reksadana', 'Emas', 'Properti', 'Kripto', 'Lainnya'];

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Aset Investasi Baru</DialogTitle>
        <DialogDescription>
          Catat aset investasimu untuk mulai melacaknya.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Aset</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Saham BBCA" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jenis Investasi</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Jenis Aset" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {investmentTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="initialAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modal Awal</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rp 1.000.000"
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
            name="currentValue"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nilai Saat Ini</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rp 1.100.000"
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
            name="purchaseDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Pembelian</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP', { locale: localeID })
                        ) : (
                          <span>Pilih tanggal</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      locale={localeID}
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date > new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit">Simpan Aset</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
