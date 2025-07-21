'use client';

import * as React from "react"
import { format } from "date-fns"
import { id as localeID } from 'date-fns/locale';
import { Calendar as CalendarIcon, PlusCircle } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { TransactionType } from '@/lib/types';


interface FiltersProps {
  onTypeChange: (type: 'all' | TransactionType) => void;
  onDateChange: (range: DateRange | undefined) => void;
  onAddTransactionClick: () => void;
  currentType: 'all' | TransactionType;
  currentDateRange: DateRange | undefined;
}

export function DatePickerWithRange({
  className,
  date,
  setDate
}: React.HTMLAttributes<HTMLDivElement> & { date: DateRange | undefined, setDate: (date: DateRange | undefined) => void}) {

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full sm:w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: localeID })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: localeID })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: localeID })
              )
            ) : (
              <span>Pilih rentang tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
            locale={localeID}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}


export default function Filters({
  onTypeChange,
  onDateChange,
  onAddTransactionClick,
  currentType,
  currentDateRange,
}: FiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Tabs value={currentType} onValueChange={(value) => onTypeChange(value as 'all' | TransactionType)}>
                <TabsList>
                <TabsTrigger value="all">Semua</TabsTrigger>
                <TabsTrigger value="income">Pemasukan</TabsTrigger>
                <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
                </TabsList>
            </Tabs>
            <DatePickerWithRange date={currentDateRange} setDate={onDateChange} />
        </div>
        <Button onClick={onAddTransactionClick} className="w-full sm:w-auto">
            <PlusCircle />
            Tambah Transaksi
        </Button>
    </div>
  );
}
