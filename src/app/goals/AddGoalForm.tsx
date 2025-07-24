
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
  Dialog as UIDialog,
  DialogTrigger
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
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import type { Goal } from '@/lib/types';
import { useState } from 'react';

const formSchema = z.object({
  name: z.string().min(1, 'Nama tujuan harus diisi.'),
  targetAmount: z.coerce
    .number()
    .positive({ message: 'Jumlah target harus lebih dari 0.' }),
  currentAmount: z.coerce.number().min(0, 'Jumlah saat ini tidak boleh negatif.'),
  targetDate: z.date({ required_error: 'Tanggal target harus diisi.' }),
});

interface AddGoalFormProps {
  onAddGoal: (goal: Omit<Goal, 'id'>) => void;
}

const formatToRupiah = (value: number | string) => {
  if (typeof value === 'string' && value.startsWith('Rp ')) return value;
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(numberValue);
};

const parseFromRupiah = (value: string) => Number(value.replace(/[^0-9]/g, ''));

export default function AddGoalForm({ onAddGoal }: AddGoalFormProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      targetAmount: 0,
      currentAmount: 0,
      targetDate: new Date(),
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddGoal(values);
    form.reset();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Tujuan Keuangan Baru</DialogTitle>
        <DialogDescription>
          Buat target baru untuk ditabung.
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Tujuan</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Dana Darurat" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="targetAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Target</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rp 10.000.000"
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
            name="currentAmount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah Saat Ini (Opsional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rp 0"
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
            name="targetDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Target</FormLabel>
                <UIDialog open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                  <DialogTrigger asChild>
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
                  </DialogTrigger>
                  <DialogContent className="w-auto p-0">
                    <Calendar
                      locale={localeID}
                      mode="single"
                      selected={field.value}
                      onSelect={(date) => {
                        field.onChange(date);
                        setIsDatePickerOpen(false);
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </DialogContent>
                </UIDialog>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="submit">Simpan Tujuan</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
