'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/db';
import type { Category, TransactionType } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const categorySchema = z.object({
  name: z.string().min(1, 'Nama kategori harus diisi.'),
  type: z.enum(['income', 'expense'], { required_error: 'Tipe harus dipilih.' }),
});

export default function CategoryManager() {
  const { toast } = useToast();
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  const form = useForm<z.infer<typeof categorySchema>>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', type: 'expense' },
  });

  const onSubmit = async (values: z.infer<typeof categorySchema>) => {
    try {
      await db.categories.add(values);
      form.reset();
      toast({ title: 'Sukses', description: 'Kategori berhasil ditambahkan.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambahkan kategori.' });
    }
  };
  
  const deleteCategory = async (id?: number) => {
    if (id === undefined) return;
    try {
      await db.categories.delete(id);
      toast({ title: 'Sukses', description: 'Kategori berhasil dihapus.' });
    } catch(error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus kategori.' });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Kategori Baru</CardTitle>
          <CardDescription>Buat kategori pemasukan atau pengeluaran baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid sm:grid-cols-3 gap-4 items-end">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Kategori</FormLabel>
                    <FormControl>
                      <Input placeholder="cth: Gaji" {...field} />
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
                    <FormLabel>Tipe Transaksi</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih Tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Tambah</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>Berikut adalah daftar kategori yang sudah ada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Kategori</TableHead>
                  <TableHead>Tipe</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories?.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>{category.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!categories || categories.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                          Belum ada kategori.
                      </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
