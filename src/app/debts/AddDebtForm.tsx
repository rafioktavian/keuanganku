
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
  DialogTrigger,
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
import type { Debt } from '@/lib/types';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { useEffect, useState } from 'react';


const formSchema = z.object({
  type: z.enum(['debt', 'receivable'], { required_error: 'Tipe harus dipilih.' }),
  personName: z.string().min(1, 'Nama orang harus diisi.'),
  amount: z.coerce.number().positive({ message: 'Jumlah harus lebih dari 0.' }),
  dueDate: z.date({ required_error: 'Tanggal jatuh tempo harus diisi.' }),
  description: z.string().min(1, 'Deskripsi singkat harus diisi.'),
});

interface AddDebtFormProps {
  onSubmitDebt: (debt: Omit<Debt, 'id' | 'status' | 'currentAmount'>, id?: number) => void;
  onClose: () => void;
  initialData?: Debt | null;
}

const formatToRupiah = (value: number | string) => {
  if (typeof value === 'string' && value.startsWith('Rp ')) return value;
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0
  }).format(numberValue);
};

const parseFromRupiah = (value: string) => Number(value.replace(/[^0-9]/g, ''));

export default function AddDebtForm({ onSubmitDebt, onClose, initialData = null }: AddDebtFormProps) {
  const isEditMode = !!initialData;
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isEditMode && initialData) {
      form.reset({
        ...initialData,
        dueDate: new Date(initialData.dueDate),
      });
    } else {
      form.reset({
        type: 'debt',
        personName: '',
        amount: 0,
        dueDate: new Date(),
        description: '',
      });
    }
  }, [initialData, form, isEditMode]);


  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmitDebt(values, initialData?.id);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{isEditMode ? 'Edit Catatan Utang/Piutang' : 'Catatan Utang/Piutang Baru'}</DialogTitle>
        <DialogDescription>
          {isEditMode ? 'Perbarui detail catatan Anda.' : 'Tambah catatan baru untuk utang atau piutang.'}
        </DialogDescription>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Tipe Catatan</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    value={field.value}
                    className="flex space-x-4"
                    disabled={isEditMode}
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="debt" />
                      </FormControl>
                      <FormLabel className="font-normal">Utang Saya</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="receivable" />
                      </FormControl>
                      <FormLabel className="font-normal">Piutang Saya</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
                 {isEditMode && <p className="text-xs text-muted-foreground">Tipe tidak dapat diubah saat mengedit.</p>}
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="personName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nama Orang</FormLabel>
                <FormControl>
                  <Input placeholder="cth: Budi" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Jumlah</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Rp 100.000"
                    value={formatToRupiah(field.value || 0)}
                    onChange={e => field.onChange(parseFromRupiah(e.target.value))}
                    disabled={isEditMode}
                  />
                </FormControl>
                {isEditMode && <p className="text-xs text-muted-foreground">Jumlah tidak dapat diubah. Sisa pembayaran dapat dikelola melalui tombol "Bayar".</p>}
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Tanggal Jatuh Tempo</FormLabel>
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
                    <DialogContent className="w-auto">
                        <Calendar
                            locale={localeID}
                            mode="single"
                            selected={field.value}
                            onSelect={(date) => {
                                field.onChange(date);
                                setIsDatePickerOpen(false);
                            }}
                            initialFocus
                        />
                    </DialogContent>
                </UIDialog>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deskripsi</FormLabel>
                <FormControl>
                  <Textarea placeholder="cth: Pinjaman untuk makan siang" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Batal</Button>
            <Button type="submit">{isEditMode ? 'Simpan Perubahan' : 'Simpan Catatan'}</Button>
          </DialogFooter>
        </form>
      </Form>
    </DialogContent>
  );
}
