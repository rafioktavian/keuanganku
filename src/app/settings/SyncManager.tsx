
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, UploadCloud } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { syncToFirebase } from '@/lib/syncService';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
  } from '@/components/ui/alert-dialog';

export default function SyncManager() {
    const [isSyncing, setIsSyncing] = useState(false);
    const { toast } = useToast();

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            await syncToFirebase();
            toast({
                title: 'Sinkronisasi Berhasil',
                description: 'Semua data lokal Anda telah berhasil disinkronkan ke Firebase.',
            });
        } catch (error) {
            console.error('Firebase Sync Error:', error);
            const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan tidak diketahui.';
            toast({
                variant: 'destructive',
                title: 'Sinkronisasi Gagal',
                description: `Gagal menyinkronkan data. ${errorMessage}`,
            });
        } finally {
            setIsSyncing(false);
        }
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sinkronisasi Cloud</CardTitle>
        <CardDescription>
          Simpan cadangan data Anda ke Firebase Realtime Database. Ini akan menimpa data apa pun yang ada di cloud dengan data lokal Anda saat ini.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
            Pastikan Anda telah mengkonfigurasi kredensial Firebase Anda dengan benar di file yang diperlukan sebelum melanjutkan.
        </p>
      </CardContent>
      <CardFooter>
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button disabled={isSyncing}>
                    {isSyncing ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                    <UploadCloud className="mr-2 h-4 w-4" />
                    )}
                    Sinkronkan ke Firebase
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Konfirmasi Sinkronisasi</AlertDialogTitle>
                    <AlertDialogDescription>
                        Tindakan ini akan menimpa semua data yang ada di Firebase dengan data lokal Anda saat ini. Apakah Anda yakin ingin melanjutkan?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSync}>
                        Ya, Sinkronkan
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}
