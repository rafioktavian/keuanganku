import Dexie, { type Table } from 'dexie';
import type { TransactionDB, Category, FundSource } from './types';

export class AppDB extends Dexie {
  transactions!: Table<TransactionDB>;
  categories!: Table<Category>;
  fundSources!: Table<FundSource>;

  constructor() {
    super('KeuanganKuDB');
    this.version(1).stores({
      transactions: '++id, date, type, category',
      categories: '++id, name, type',
      fundSources: '++id, name',
    });
    this.on('populate', () => this.populate());
  }
  
  async populate() {
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
