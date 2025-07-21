import Dexie, { type Table } from 'dexie';
import type { TransactionDB, Category, FundSource, GoalDB, InvestmentDB, DebtDB } from './types';

export class AppDB extends Dexie {
  transactions!: Table<TransactionDB>;
  categories!: Table<Category>;
  fundSources!: Table<FundSource>;
  goals!: Table<GoalDB>;
  investments!: Table<InvestmentDB>;
  debts!: Table<DebtDB>;


  constructor() {
    super('KeuanganKuDB');
    this.version(4).stores({
      transactions: '++id, date, type, category',
      categories: '++id, name, type',
      fundSources: '++id, name',
      goals: '++id, name, targetDate',
      investments: '++id, name, type, purchaseDate',
      debts: '++id, type, status, dueDate',
    });

    this.version(3).stores({
      transactions: '++id, date, type, category',
      categories: '++id, name, type',
      fundSources: '++id, name',
      goals: '++id, name, targetDate',
      investments: '++id, name, type, purchaseDate'
    });
    
    this.version(2).stores({
      transactions: '++id, date, type, category',
      categories: '++id, name, type',
      fundSources: '++id, name',
      goals: '++id, name, targetDate'
    }).upgrade(tx => {
       // This is needed for existing users if their schema changes.
    });

    this.version(1).stores({
      transactions: '++id, date, type, category',
      categories: '++id, name, type',
      fundSources: '++id, name',
    });

    this.on('populate', () => this.populate());
  }
  
  async populate() {
    const categoryCount = await db.categories.count();
    const fundSourceCount = await db.fundSources.count();
    if (categoryCount > 0 && fundSourceCount > 0) {
      return; // Data already populated
    }
  
    await db.categories.bulkAdd([
        // Pemasukan
        { name: 'Gaji', type: 'income' },
        { name: 'Bonus', type: 'income' },
        { name: 'Hadiah', type: 'income' },
        { name: 'Lainnya', type: 'income' },

        // Pengeluaran
        { name: 'Makanan & Minuman', type: 'expense' },
        { name: 'Transportasi', type: 'expense' },
        { name: 'Tagihan', type: 'expense' },
        { name: 'Belanja', type: 'expense' },
        { name: 'Hiburan', type: 'expense' },
        { name: 'Kesehatan', type: 'expense' },
        { name: 'Pendidikan', type: 'expense' },
        { name: 'Lainnya', type: 'expense' },
    ]);
    await db.fundSources.bulkAdd([
        { name: 'Tunai' },
        { name: 'Rekening Bank' },
        { name: 'Dompet Digital' },
        { name: 'Kartu Kredit' },
    ]);
  }
}

export const db = new AppDB();
