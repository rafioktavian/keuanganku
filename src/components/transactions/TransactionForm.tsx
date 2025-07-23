
'use client';

import { useState, useRef, type ChangeEvent, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Calendar as CalendarIcon, Upload, Loader2, Camera, CameraOff, Link2, PlusCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { extractTransactionFromImage } from '@/ai/flows/image-transaction-detector';
import { useToast } from '@/hooks/use-toast';
import type { Transaction, Category, FundSource, Goal, Investment, Debt } from '@/lib/types';
import { db } from '@/lib/db';
import Image from 'next/image';
import { Dialog as UIDialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';


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
  linkedTo: z.string().optional(),
});

const quickGoalSchema = z.object({
  name: z.string().min(1, 'Nama tujuan harus diisi.'),
  targetAmount: z.coerce.number().positive({ message: 'Target harus lebih dari 0.' }),
});

type TransactionFormProps = {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction: (id: number | string, transaction: Omit<Transaction, 'id'>) => void;
  onClose: () => void;
  isOpen: boolean;
  transactionToEdit: Transaction | null;
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


function TransactionFormContent({
  onAddTransaction,
  onUpdateTransaction,
  onClose,
  transactionToEdit,
  isSheet = false,
}: Omit<TransactionFormProps, 'isOpen'> & { isSheet?: boolean }) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const { toast } = useToast();
    const [categories, setCategories] = useState<Category[]>([]);
    const [fundSources, setFundSources] = useState<FundSource[]>([]);
    
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

    // State for linked items
    const [goals, setGoals] = useState<Goal[]>([]);
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [debts, setDebts] = useState<Debt[]>([]);
    const [receivables, setReceivables] = useState<Debt[]>([]);
    
    const [isQuickGoalOpen, setIsQuickGoalOpen] = useState(false);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });

    const quickGoalForm = useForm<z.infer<typeof quickGoalSchema>>({
        resolver: zodResolver(quickGoalSchema),
        defaultValues: { name: '', targetAmount: 0 },
    });

    const transactionType = form.watch('type');
    const selectedLink = form.watch('linkedTo');

    const fetchMasterData = async () => {
        const allCategories = await db.categories.toArray();
        const allFundSources = await db.fundSources.toArray();
        const allGoals = await db.goals.toArray();
        const allInvestments = await db.investments.toArray();
        const allDebts = await db.debts.toArray();

        setFundSources(allFundSources);
        setGoals(allGoals);
        setInvestments(allInvestments);
        setDebts(allDebts.filter(d => d.type === 'debt' && d.status === 'unpaid'));
        setReceivables(allDebts.filter(d => d.type === 'receivable' && d.status === 'unpaid'));
        
        const currentType = form.getValues('type') || 'expense';
        const filteredCategories = allCategories.filter(c => c.type === currentType);
        setCategories(filteredCategories);
        
        const currentCategory = form.getValues('category');
        if (currentCategory && !filteredCategories.some(c => c.name === currentCategory)) {
            form.setValue('category', '');
        }
    };

    useEffect(() => {
        fetchMasterData();
    }, [transactionType, form]);

    useEffect(() => {
        if (transactionToEdit) {
        form.reset({
            ...transactionToEdit,
            date: new Date(transactionToEdit.date),
        });
        } else {
        form.reset({
            type: 'expense',
            amount: 0,
            date: new Date(),
            category: '',
            fundSource: '',
            description: '',
            linkedTo: '',
        });
        }
        setImagePreview(null);
    }, [transactionToEdit, form]);
    
    useEffect(() => {
        if (isCameraOpen) {
        const getCameraPermission = async () => {
            try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            setHasCameraPermission(true);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            } catch (error) {
            console.error('Error accessing camera:', error);
            setHasCameraPermission(false);
            toast({
                variant: 'destructive',
                title: 'Akses Kamera Ditolak',
                description: 'Mohon izinkan akses kamera di pengaturan browser Anda.',
            });
            }
        };
        getCameraPermission();
        } else {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
        }
    }, [isCameraOpen, toast]);


    useEffect(() => {
        if (selectedLink) {
            if (selectedLink.startsWith('goal_')) {
                form.setValue('category', 'Tabungan Tujuan');
            } else if (selectedLink.startsWith('investment_') && transactionType === 'expense') {
                form.setValue('category', 'Investasi');
            } else if (selectedLink.startsWith('investment_') && transactionType === 'income') {
                form.setValue('category', 'Divestasi');
            } else if (selectedLink.startsWith('debt_')) {
                form.setValue('category', 'Pembayaran Utang');
            } else if (selectedLink.startsWith('receivable_')) {
                form.setValue('category', 'Penerimaan Piutang');
            }
        }
    }, [selectedLink, transactionType, form]);

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };

    const processImage = async (photoDataUri: string) => {
        setIsProcessing(true);
        setImagePreview(photoDataUri);
        try {
            const allCategories = await db.categories.toArray();
            const allFundSources = await db.fundSources.toArray();
            const incomeCategories = allCategories.filter(c => c.type === 'income').map(c => c.name);
            const expenseCategories = allCategories.filter(c => c.type === 'expense').map(c => c.name);
            const fundSourceNames = allFundSources.map(fs => fs.name);

            const result = await extractTransactionFromImage({
                photoDataUri,
                incomeCategories: incomeCategories.join(','),
                expenseCategories: expenseCategories.join(','),
                fundSources: fundSourceNames.join(','),
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
            form.setValue('type', result.isIncome ? 'income' : 'expense');
            form.setValue('amount', result.amount);
            form.setValue('date', transactionDate);
            form.setValue('description', result.description);
            form.setValue('category', result.category);
            if (result.source) {
                form.setValue('fundSource', result.source);
            }
            
            toast({
                title: "Sukses!",
                description: "Detail transaksi berhasil diekstrak dari gambar.",
            });

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
    
    const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
          if (file.size > 5 * 1024 * 1024) { // 5MB limit
              toast({
                  variant: 'destructive',
                  title: 'File terlalu besar',
                  description: 'Ukuran gambar tidak boleh melebihi 5MB.',
              });
              return;
          }
          const reader = new FileReader();
          reader.onload = () => {
              const photoDataUri = reader.result as string;
              if (photoDataUri) {
                  processImage(photoDataUri);
              } else {
                   toast({
                      variant: 'destructive',
                      title: 'Gagal Membaca File',
                      description: 'Tidak dapat membaca file gambar yang dipilih.',
                  });
              }
          };
          reader.readAsDataURL(file);
      }
    };
    
    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        if (context) {
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const photoDataUri = canvas.toDataURL('image/jpeg');
            setIsCameraOpen(false);
            processImage(photoDataUri);
        }
    };

    const onSubmit = async (values: z.infer<typeof formSchema>) => {
        if (transactionToEdit && transactionToEdit.id !== undefined) {
            onUpdateTransaction(transactionToEdit.id, values);
        } else {
            await onAddTransaction(values);
        }
        onClose();
    };

    const handleQuickAddGoal = async (values: z.infer<typeof quickGoalSchema>) => {
        try {
            const newGoal = {
                ...values,
                currentAmount: 0,
                targetDate: new Date('2099-12-31').toISOString(),
            };
            const newId = await db.goals.add(newGoal);
            await fetchMasterData(); 
            form.setValue('linkedTo', `goal_${newId}`);
            toast({ title: 'Sukses', description: 'Tujuan baru berhasil ditambahkan.' });
            setIsQuickGoalOpen(false);
            quickGoalForm.reset();
        } catch (error) {
            toast({ variant: 'destructive', title: 'Gagal', description: 'Gagal menambahkan tujuan.' });
        }
    };
    
    const TitleComponent = isSheet ? SheetTitle : 'h2';

    return (
        <div className="relative">
        {isProcessing && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-foreground">Menganalisis struk Anda...</p>
            </div>
        )}
        
        <div className={cn(isProcessing && "opacity-20 pointer-events-none")}>
            <TitleComponent className={cn(!isSheet && "text-lg font-semibold text-foreground mb-4")}>
                {transactionToEdit ? 'Edit Transaksi' : 'Tambah Transaksi Baru'}
            </TitleComponent>

            <div className="mb-6 space-y-4">
                 <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                    id="receipt-upload"
                />
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={triggerFileSelect} disabled={isProcessing} htmlFor="receipt-upload" className="block">
                        <div className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer p-4 h-full rounded-lg">
                            <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground h-full">
                                <Upload className="h-8 w-8" />
                                <p className="text-center font-semibold text-sm">
                                    <span className="text-primary">Unggah Struk</span>
                                </p>
                                <p className="text-xs text-center">Pilih dari galeri</p>
                            </div>
                        </div>
                    </button>

                    <UIDialog open={isCameraOpen} onOpenChange={setIsCameraOpen}>
                        <DialogTrigger asChild>
                             <div className="border-2 border-dashed hover:border-primary transition-colors cursor-pointer p-4 h-full rounded-lg">
                                <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground h-full">
                                    <Camera className="h-8 w-8" />
                                    <p className="text-center font-semibold text-sm">
                                        <span className="text-primary">Gunakan Kamera</span>
                                    </p>
                                    <p className="text-xs text-center">Ambil foto langsung</p>
                                </div>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                            <DialogTitle>Ambil Foto Struk</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                            <div className="relative w-full aspect-video rounded-md bg-muted overflow-hidden">
                                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
                                <canvas ref={canvasRef} className="hidden" />
                            </div>
                            {hasCameraPermission === false && (
                                <Alert variant="destructive">
                                <CameraOff className="h-4 w-4" />
                                <AlertTitle>Akses Kamera Ditolak</AlertTitle>
                                <AlertDescription>
                                    Anda perlu memberikan izin kamera di pengaturan browser untuk menggunakan fitur ini.
                                </AlertDescription>
                                </Alert>
                            )}
                            </div>
                            <DialogFooter>
                            <Button onClick={handleCapture} disabled={hasCameraPermission !== true}>
                                <Camera className="mr-2 h-4 w-4"/>
                                Ambil Gambar
                            </Button>
                            </DialogFooter>
                        </DialogContent>
                    </UIDialog>
                </div>
                
                {imagePreview && (
                    <div className="mt-4">
                        <p className="text-sm font-medium mb-2 text-center">Pratinjau Gambar:</p>
                        <div className="relative w-full h-48 rounded-md overflow-hidden border">
                            <Image src={imagePreview} alt="Pratinjau Struk" fill style={{ objectFit: 'contain' }} />
                        </div>
                    </div>
                )}
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
                            form.setValue('linkedTo', ''); // Reset link on type change
                          }}
                          value={field.value}
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
                  name="linkedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        Alokasikan ke (Opsional)
                      </FormLabel>
                      <Select 
                        onValueChange={(value) => {
                            if (value === 'add_new_goal') {
                                setIsQuickGoalOpen(true);
                            } else {
                                field.onChange(value);
                            }
                        }} 
                        value={field.value}
                        disabled={!!transactionToEdit} // Disable if editing
                        >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih alokasi dana..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {transactionType === 'expense' ? (
                                <>
                                    <SelectItem value="add_new_goal" className="font-semibold text-primary">
                                        <div className="flex items-center gap-2">
                                            <PlusCircle className="h-4 w-4"/> Buat Tujuan Baru...
                                        </div>
                                    </SelectItem>

                                    {goals.length > 0 && <FormLabel className="px-2 py-1.5 text-xs font-semibold">Tujuan Keuangan</FormLabel>}
                                    {goals.map(g => <SelectItem key={`goal_${g.id}`} value={`goal_${g.id}`}>Menabung: {g.name}</SelectItem>)}
                                    
                                    {investments.length > 0 && <FormLabel className="px-2 py-1.5 text-xs font-semibold">Investasi</FormLabel>}
                                    {investments.map(i => <SelectItem key={`investment_${i.id}`} value={`investment_${i.id}`}>Investasi: {i.name}</SelectItem>)}
                                    
                                    {debts.length > 0 && <FormLabel className="px-2 py-1.5 text-xs font-semibold">Utang</FormLabel>}
                                    {debts.map(d => <SelectItem key={`debt_${d.id}`} value={`debt_${d.id}`}>Bayar utang: {d.personName}</SelectItem>)}
                                </>
                            ) : ( // income
                                <>
                                    {investments.length > 0 && <FormLabel className="px-2 py-1.5 text-xs font-semibold">Investasi</FormLabel>}
                                    {investments.map(i => <SelectItem key={`investment_${i.id}`} value={`investment_${i.id}`}>Divestasi: {i.name}</SelectItem>)}

                                    {receivables.length > 0 && <FormLabel className="px-2 py-1.5 text-xs font-semibold">Piutang</FormLabel>}
                                    {receivables.map(r => <SelectItem key={`receivable_${r.id}`} value={`receivable_${r.id}`}>Terima dari: {r.personName}</SelectItem>)}
                                </>
                            )}
                            {(transactionType === 'expense' && goals.length === 0 && investments.length === 0 && debts.length === 0) || (transactionType === 'income' && receivables.length === 0 && investments.length === 0) ? (
                                <p className="p-2 text-sm text-muted-foreground">Tidak ada item yang bisa ditautkan.</p>
                            ) : null}
                        </SelectContent>
                      </Select>
                      {!!transactionToEdit && <p className="text-xs text-muted-foreground">Tautan tidak bisa diubah saat mengedit.</p>}
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
                      <Select onValueChange={field.onChange} value={field.value} disabled={!!form.watch('linkedTo')}>
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
                 <div className="pt-4">
                     <Button type="submit" className="w-full" disabled={isProcessing}>
                        {transactionToEdit ? 'Simpan Perubahan' : 'Tambah Transaksi'}
                    </Button>
                </div>
              </form>
            </Form>
        </div>
        <UIDialog open={isQuickGoalOpen} onOpenChange={setIsQuickGoalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Buat Tujuan Baru</DialogTitle>
                </DialogHeader>
                <Form {...quickGoalForm}>
                    <form onSubmit={quickGoalForm.handleSubmit(handleQuickAddGoal)} className="space-y-4">
                        <FormField
                            control={quickGoalForm.control}
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
                            control={quickGoalForm.control}
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
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsQuickGoalOpen(false)}>Batal</Button>
                            <Button type="submit">Simpan Tujuan</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </UIDialog>
        </div>
    );
}


export default function TransactionForm(props: TransactionFormProps) {
  const { isOpen, onClose } = props;
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return null; // Don't render on the server
  }

  // For larger screens, use a static form.
  if (window.innerWidth >= 1024) {
    if (!props.isOpen) return null; // Don't render anything if not open
    return (
        <div className="p-6 border rounded-lg bg-card shadow-sm mb-8 relative">
            <TransactionFormContent {...props} isSheet={false} />
        </div>
    );
  }

  // For smaller screens, use a sheet.
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
         <div className="p-4">
            <TransactionFormContent {...props} isSheet={true} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
