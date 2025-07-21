'use client';

import React, { useState } from 'react';
import type { Goal } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { id as localeID } from 'date-fns/locale';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { PiggyBank, Calendar, Trash2, Plus, Minus } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface GoalCardProps {
  goal: Goal;
  onUpdateGoal: (id: number, newCurrentAmount: number) => void;
  onDeleteGoal: (id: number) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
};

export default function GoalCard({ goal, onUpdateGoal, onDeleteGoal }: GoalCardProps) {
  const [amountToAdd, setAmountToAdd] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const progress = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
  const daysLeft = differenceInDays(goal.targetDate, new Date());

  const handleAddSaving = () => {
    const newAmount = goal.currentAmount + Number(amountToAdd);
    if (goal.id !== undefined) {
      onUpdateGoal(goal.id, newAmount);
    }
    setAmountToAdd('');
    setIsAdding(false);
  };
  
  const handleSubtractSaving = () => {
    const newAmount = Math.max(0, goal.currentAmount - Number(amountToAdd));
     if (goal.id !== undefined) {
      onUpdateGoal(goal.id, newAmount);
    }
    setAmountToAdd('');
    setIsAdding(false);
  }

  const getTimeLeft = () => {
    if (progress >= 100) return <Badge variant="secondary" className="bg-green-100 text-green-800">Tercapai!</Badge>;
    if (daysLeft < 0) return <Badge variant="destructive">Terlewat</Badge>;
    return <span className="text-sm text-muted-foreground">{formatDistanceToNow(goal.targetDate, { addSuffix: true, locale: localeID })} lagi</span>;
  };
  
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                 <CardTitle className="font-headline text-xl flex items-center gap-2">
                    <PiggyBank className="text-primary"/>
                    {goal.name}
                 </CardTitle>
                <CardDescription className="flex items-center gap-2 mt-2">
                    <Calendar className="h-4 w-4"/>
                    Target: {format(goal.targetDate, 'dd MMM yyyy', { locale: localeID })}
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
                    Tindakan ini tidak dapat dibatalkan. Ini akan menghapus tujuan keuangan Anda secara permanen.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDeleteGoal(goal.id!)} className="bg-destructive hover:bg-destructive/90">
                    Ya, Hapus
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div>
          <div className="flex justify-between items-end mb-1">
            <span className="text-lg font-bold text-primary">{formatCurrency(goal.currentAmount)}</span>
            <span className="text-sm text-muted-foreground">dari {formatCurrency(goal.targetAmount)}</span>
          </div>
          <Progress value={progress} />
          <div className="flex justify-between items-center mt-1">
            <span className="text-sm font-medium text-foreground">{progress.toFixed(0)}%</span>
            {getTimeLeft()}
          </div>
        </div>
      </CardContent>
       <CardFooter className="flex flex-col items-stretch gap-2">
        {isAdding ? (
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Jumlah"
              value={amountToAdd}
              onChange={(e) => setAmountToAdd(e.target.value)}
              className="flex-grow"
            />
             <Button size="icon" onClick={handleAddSaving}><Plus/></Button>
             <Button size="icon" variant="destructive" onClick={handleSubtractSaving}><Minus/></Button>
          </div>
        ) : (
          <Button onClick={() => setIsAdding(true)} variant="secondary">Tambah/Kurangi Tabungan</Button>
        )}
      </CardFooter>
    </Card>
  );
}
