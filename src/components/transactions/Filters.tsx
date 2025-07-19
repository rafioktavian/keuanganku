'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransactionType } from '@/lib/types';

interface FiltersProps {
  onTypeChange: (type: 'all' | TransactionType) => void;
  onDateChange: (range: 'all' | 'this-month' | 'last-30-days') => void;
  currentType: 'all' | TransactionType;
  currentDateRange: 'all' | 'this-month' | 'last-30-days';
}

export default function Filters({
  onTypeChange,
  onDateChange,
  currentType,
  currentDateRange,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
      <Tabs value={currentType} onValueChange={(value) => onTypeChange(value as 'all' | TransactionType)}>
        <TabsList>
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="income">Pemasukan</TabsTrigger>
          <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
        </TabsList>
      </Tabs>
      <Select value={currentDateRange} onValueChange={(value) => onDateChange(value as 'all' | 'this-month' | 'last-30-days')}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Pilih rentang tanggal" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Waktu</SelectItem>
          <SelectItem value="this-month">Bulan Ini</SelectItem>
          <SelectItem value="last-30-days">30 Hari Terakhir</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
