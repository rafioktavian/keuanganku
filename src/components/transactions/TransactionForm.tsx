'use client';

import { useState, useRef, type ChangeEvent } from 'react';
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
import { Calendar as CalendarIcon, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { imageTransactionDetector, type ImageTransactionOutput } from '@/ai/flows/image-transaction-detector';
import { useToast } from '@/hooks/use-toast';
import type { Transaction } from '@/lib/types';
import Image from 'next/image';

const formSchema = z.object({
  type: z.enum(['income', 'expense'], {
    required_error: 'Please select a transaction type.',
  }),
  amount: z.coerce
    .number({ invalid_type_error: 'Amount must be a number' })
    .positive({ message: 'Amount must be positive.' }),
  date: z.date({ required_error: 'A date is required.' }),
  category: z.string().min(1, { message: 'Category is required.' }),
  description: z.string().min(1, { message: 'Description is required.' }),
});

type TransactionFormProps = {
  onAddTransaction: (transaction: Omit<Transaction, 'id'>) => void;
};

export default function TransactionForm({ onAddTransaction }: TransactionFormProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: 'expense',
      amount: 0,
      date: new Date(),
      category: '',
      description: '',
    },
  });

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
        const result = await imageTransactionDetector({ photoDataUri });
        form.reset({
          type: result.transactionType,
          amount: result.amount,
          date: new Date(result.date),
          category: result.category,
          description: result.description,
        });
        toast({
            title: "Success!",
            description: "Transaction details extracted from image.",
        })
      } catch (error) {
        console.error('AI Error:', error);
        toast({
          variant: 'destructive',
          title: 'Extraction Failed',
          description: 'Could not extract details from the image. Please enter them manually.',
        });
      } finally {
        setIsProcessing(false);
        // Clear the file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'File Error',
            description: 'Could not read the image file.',
        });
        setIsProcessing(false);
    }
  };

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    onAddTransaction(values);
    form.reset();
    setImagePreview(null);
  };

  return (
    <Card className="relative overflow-hidden">
        {isProcessing && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card/80 backdrop-blur-sm">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-lg text-primary-foreground">Analyzing your receipt...</p>
            </div>
        )}
      <CardHeader>
        <CardTitle className="font-headline">Add Transaction</CardTitle>
        <CardDescription>
          Upload a receipt or enter details manually.
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
                            <Image src={imagePreview} alt="Receipt preview" layout="fill" objectFit="contain" />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center space-y-2 text-muted-foreground">
                            <Upload className="h-10 w-10" />
                            <p className="text-center font-semibold">
                                <span className="text-primary">Upload a receipt</span>
                            </p>
                            <p className="text-xs text-center">Let AI fill out the form for you</p>
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
                  <FormLabel>Transaction Type</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="income" />
                        </FormControl>
                        <FormLabel className="font-normal">Income</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="expense" />
                        </FormControl>
                        <FormLabel className="font-normal">Expense</FormLabel>
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
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="e.g., 50000" {...field} />
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
                  <FormLabel>Date</FormLabel>
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
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date > new Date() || date < new Date('2000-01-01')
                        }
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
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Food, Transport, Salary" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., Lunch with colleagues"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isProcessing}>
              Add Transaction
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
