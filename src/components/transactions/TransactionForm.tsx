'use client';

import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Upload, Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { imageTransactionDetector } from '@/ai/flows/image-transaction-detector';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, Category, FundSource } from '@/lib/types';
import { db } from '@/lib/db';
import Image from 'next/image';

const formSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Pilih tipe transaksi.',
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Jumlah harus berupa angka' })
    .positive({ message: 'Jumlah harus positif.' }),
  date: z.date({ required_error: 'Tanggal harus diisi.' }),
  category: z.string().min(1, { message: 'Kategori harus diisi.' }),
  fundSource: z.string().min(1, { message: 'Sumber dana harus diisi.' }),
  description: z.string().min(1, { message: 'Deskripsi harus diisi.' }),
});

type TransactionFormProps = {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
};

const formatToRupiah = (value: number | string) => {
  if (typeof value === 'string' && value.startsWith('Rp ')) {
    return value;
  }
  const numberValue = Number(value) || 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(numberValue);
};

const parseFromRupiah = (value: string) => {
  return Number(value.replace(/[^0-9]/g, ''));
};


export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [fundSources, setFundSources] = useState<FundSource[]>([]);
  const [isClient, setIsClient] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      category: '',
      fundSource: '',
      description: '',
    },
  });
  
  useEffect(() => {
    setIsClient(true);
    form.reset({
      type: 'expense',
      amount: 0,
      date: new Date(),
      category: '',
      fundSource: '',
      description: '',
    });
  }, [form]);

  const transactionType = form.watch('type');

  useEffect(() => {
    const fetchMasterData = async () => {
      const allCategories = await db.categories.toArray();
      const allFundSources = await db.fundSources.toArray();
      setFundSources(allFundSources);
      
      const filteredCategories = allCategories.filter(c => c.type === transactionType);
      setCategories(filteredCategories);

      // Reset category if it's not in the new list
      if (!filteredCategories.some(c => c.name === form.getValues('category'))) {
        form.setValue('category', '');
      }
    };
    if (isClient) {
      fetchMasterData();
    }
  }, [transactionType, form, isClient]);

  const handleImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setImagePreview(URL.createObjectURL(file));

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      const photoDataUri = reader.result as string;
      try {
        // Fetch master data to pass to the AI flow
        const allCategories = await db.categories.toArray();
        const allFundSources = await db.fundSources.toArray();
        const incomeCategories = allCategories.filter(c => c.type === 'income').map(c => c.name);
        const expenseCategories = allCategories.filter(c => c.type === 'expense').map(c => c.name);
        const fundSourceNames = allFundSources.map(fs => fs.name);

        const result = await imageTransactionDetector({ 
            photoDataUri,
            incomeCategories,
            expenseCategories,
            fundSources: fundSourceNames
        });
        
        let transactionDate = new Date(result.date);
        if (isNaN(transactionDate.getTime())) {
          toast({
            variant: 'destructive',
            title: 'Tanggal Tidak Valid',
            description: 'AI tidak dapat mendeteksi tanggal yang valid. Menggunakan tanggal hari ini.',
          });
          transactionDate = new Date();
        }

        form.reset({
          type: result.transactionType,
          amount: result.amount,
          date: transactionDate,
          category: result.category,
          description: result.description,
          fundSource: result.fundSource || form.getValues('fundSource')
        });
        toast({
            title: "Sukses!",
            description: "Detail transaksi berhasil diekstrak dari gambar.",
        })
      } catch (error) {
        console.error('AI Error:', error);
        toast({
          variant: 'destructive',
          title: 'Ekstraksi Gagal',
          description: 'Tidak dapat mengekstrak detail dari gambar. Silakan masukkan secara manual.',
        });
      } finally {
        setIsProcessing(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Gagal Membaca File',
            description: 'Tidak dapat membaca file gambar.',
        });
        setIsProcessing(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTransaction(values);
    form.reset({
      type: 'expense',
      amount: 0,
      date: new Date(),
      category: '',
      fundSource: '',
      description: '',
    });
    setImagePreview(null);
  };

  if (!isClient) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Tambah Transaksi</CardTitle>
           <CardDescription>
            Memuat formulir...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card className="relative overflow-hidden">
        {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-foreground">Menganalisis struk Anda...</p>
            </div>
        )}
      <CardHeader>
        <CardTitle className="font-headline">Tambah Transaksi</CardTitle>
        <CardDescription>
          Unggah struk atau masukkan detail secara manual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
            <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageUpload}
                className="hidden"
                id="receipt-upload"
            />
            <label htmlFor="receipt-upload" className="block">
                <Card
                    className={cn(
                        "border-2 border-dashed hover:border-primary transition-colors cursor-pointer",
                        imagePreview ? 'p-2' : 'p-6'
                    )}
                >
                    {imagePreview ? (
                        <div className="relative w-full h-40 rounded-md overflow-hidden">
                            <Image src={imagePreview} alt="Pratinjau Struk" layout="fill" objectFit="contain" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                            <Upload className="h-10 w-10" />
                            <p className="text-center font-semibold">
                                <span className="text-primary">Unggah Struk</span>
                            </p>
                            <p className="text-xs text-center">Biar AI yang mengisi form untukmu</p>
                        </div>
                    )}
                </Card>
            </label>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Tipe Transaksi</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={(value) => {
                        field.onChange(value);
                      }}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Pemasukan</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Pengeluaran</FormLabel>
                      </FormItem>
                    </RadioGroup>
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
                      type="text"
                      placeholder="Rp 0"
                      value={formatToRupiah(field.value || 0)}
                      onChange={(e) => {
                        const numericValue = parseFromRupiah(e.target.value);
                        field.onChange(numericValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Tanggal</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: id })
                          ) : (
                            <span>Pilih tanggal</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        locale={id}
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date > new Date() || date < new Date('2000-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kategori</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Kategori" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fundSource"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sumber Dana</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih Sumber Dana" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fundSources.map((fs) => (
                        <SelectItem key={fs.id} value={fs.name}>{fs.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    <Textarea
                      placeholder="cth: Makan siang bersama kolega"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isProcessing}>
              Tambah Transaksi
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
