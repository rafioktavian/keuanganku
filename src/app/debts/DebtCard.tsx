'use client';

import React from 'react';
import type { Debt } from '@/lib/types';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Trash2, User, Calendar, CheckCircle2, Circle } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DebtCardProps {
  debt: Debt;
  onUpdateStatus: (id: number, status: 'paid' | 'unpaid') => void;
  onDelete: (id: number) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

export default function DebtCard({ debt, onUpdateStatus, onDelete }: DebtCardProps) {
  const isDebt = debt.type === 'debt';
  const daysLeft = differenceInDays(debt.dueDate, new Date());
  
  const handleToggleStatus = () => {
    if (debt.id !== undefined) {
        const newStatus = debt.status === 'unpaid' ? 'paid' : 'unpaid';
        onUpdateStatus(debt.id, newStatus);
    }
  }

  const getTimeLeft = () => {
    if (debt.status === 'paid') return <Badge variant="secondary" className="bg-green-100 text-green-800">Lunas</Badge>;
    if (daysLeft < 0) return <Badge variant="destructive">Jatuh Tempo</Badge>;
    return <span className="text-sm text-muted-foreground">{formatDistanceToNow(debt.dueDate, { addSuffix: true, locale: localeID })}</span>;
  };
  
  return (
    <Card className={cn(
        "flex flex-col",
        debt.status === 'paid' && 'bg-muted/50'
    )}>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="font-headline text-lg flex items-center gap-2">
                    <User className="text-primary"/>
                    {debt.personName}
                 </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2 text-sm">
                    <Calendar className="h-4 w-4"/>
                    Jatuh tempo: {format(debt.dueDate, 'dd MMM yyyy', { locale: localeID })}
                </CardDescription>
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
                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus catatan ini secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(debt.id!)} className="bg-destructive hover:bg-destructive/90">
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="p-3 rounded-md" style={{ backgroundColor: isDebt ? 'hsl(var(--destructive)/0.05)' : 'hsl(var(--primary)/0.05)' }}>
            <div className="flex justify-between items-end mb-1">
                <span className={cn(
                    "text-2xl font-bold",
                    isDebt ? "text-destructive" : "text-primary"
                )}>
                    {formatCurrency(debt.amount)}
                </span>
                <Badge variant={isDebt ? 'destructive' : 'default'} className="capitalize">
                    {isDebt ? 'Utang' : 'Piutang'}
                </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{debt.description}</p>
        </div>
        <div className="flex justify-end items-center mt-1">
            {getTimeLeft()}
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-stretch gap-2">
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button onClick={handleToggleStatus} variant="secondary">
                            {debt.status === 'unpaid' ? (
                                <>
                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                Tandai Lunas
                                </>
                            ) : (
                                <>
                                <Circle className="mr-2 h-4 w-4 text-yellow-600" />
                                Tandai Belum Lunas
                                </>
                            )}
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>Ubah status utang/piutang</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
