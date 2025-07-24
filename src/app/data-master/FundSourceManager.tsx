'use client';

import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { db } from '@/lib/db';
import type { FundSource } from '@/lib/types';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const fundSourceSchema = z.object({
  name: z.string().min(1, 'Nama sumber dana harus diisi.'),
});

export default function FundSourceManager() {
  const { toast } = useToast();
  const fundSources = useLiveQuery(() => db.fundSources.toArray(), []);

  const form = useForm<z.infer<typeof fundSourceSchema>>({
    resolver: zodResolver(fundSourceSchema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: z.infer<typeof fundSourceSchema>) => {
    try {
      await db.fundSources.add(values);
      form.reset();
      toast({ title: 'Sukses', description: 'Sumber dana berhasil ditambahkan.' });
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambahkan sumber dana.' });
    }
  };
  
  const deleteFundSource = async (id?: number) => {
    if (id === undefined) return;
    try {
      await db.fundSources.delete(id);
      toast({ title: 'Sukses', description: 'Sumber dana berhasil dihapus.' });
    } catch(error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menghapus sumber dana.' });
    }
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Sumber Dana Baru</CardTitle>
          <CardDescription>Buat sumber dana baru seperti rekening bank atau dompet digital.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Nama Sumber Dana</FormLabel>
                    <FormControl>
                      <Input placeholder="cth: Rekening BCA" {...field} />
                    </FormControl>
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
          <CardTitle>Daftar Sumber Dana</CardTitle>
          <CardDescription>Berikut adalah daftar sumber dana yang sudah ada.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Sumber Dana</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fundSources?.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell className="font-medium">{source.name}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => deleteFundSource(source.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!fundSources || fundSources.length === 0 && (
                  <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                          Belum ada sumber dana.
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
