'use client';

import React, { useState } from 'react';
import type { Investment } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Trash2, Edit, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

interface InvestmentCardProps {
  investment: Investment;
  onUpdate: (id: number, newCurrentValue: number) => void;
  onDelete: (id: number) => void;
  Icon: React.ElementType;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

const parseFromRupiah = (value: string) => Number(value.replace(/[^0-9]/g, ''));


export default function InvestmentCard({ investment, onUpdate, onDelete, Icon }: InvestmentCardProps) {
  const [newValue, setNewValue] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  const profitLoss = investment.currentValue - investment.initialAmount;
  const profitLossPercentage = (profitLoss / investment.initialAmount) * 100;

  const handleUpdate = () => {
    if (investment.id !== undefined && newValue) {
      onUpdate(investment.id, parseFromRupiah(newValue));
    }
    setNewValue('');
    setIsEditing(false);
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                 <Icon className="h-8 w-8 text-primary"/>
                 <div>
                    <CardTitle className="font-headline text-lg">{investment.name}</CardTitle>
                    <Badge variant="outline" className="mt-1">{investment.type}</Badge>
                 </div>
            </div>
             <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tindakan ini akan menghapus data investasi Anda secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(investment.id!)} className="bg-destructive hover:bg-destructive/90">
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4"/>
                Dibeli pada {format(investment.purchaseDate, 'dd MMM yyyy', { locale: localeID })}
            </p>
            <div className="space-y-1">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Modal Awal</span>
                    <span>{formatCurrency(investment.initialAmount)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                    <span className="text-muted-foreground">Nilai Saat Ini</span>
                    <span>{formatCurrency(investment.currentValue)}</span>
                </div>
            </div>
        </div>
        <div className={cn(
            "flex justify-between items-center p-3 rounded-md",
            profitLoss >= 0 ? "bg-green-50 dark:bg-green-900/20" : "bg-red-50 dark:bg-red-900/20"
        )}>
            <div className="flex items-center gap-2">
                {profitLoss >= 0 
                ? <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                : <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />}
                <span className="font-semibold text-sm">Profit/Loss</span>
            </div>
            <div className="text-right">
                <p className={cn(
                    "font-bold",
                    profitLoss >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}>
                    {formatCurrency(profitLoss)}
                </p>
                <p className={cn(
                    "text-xs",
                     profitLoss >= 0 ? "text-green-500" : "text-red-500"
                )}>
                    ({profitLoss >= 0 ? '+' : ''}{!isNaN(profitLossPercentage) ? profitLossPercentage.toFixed(2) : 0}%)
                </p>
            </div>
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-stretch gap-2">
        {isEditing ? (
          <div className="space-y-2">
            <Input
              placeholder="Masukkan nilai terbaru"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onBlur={handleUpdate}
            />
             <Button onClick={handleUpdate} className="w-full">Simpan</Button>
          </div>
        ) : (
          <Button onClick={() => setIsEditing(true)} variant="secondary">
            <Edit className="mr-2" /> Perbarui Nilai
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
