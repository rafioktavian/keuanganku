
'use server';

import { db } from './db';
import { database } from './firebase';
import { ref, set } from 'firebase/database';

export async function syncToFirebase() {
  try {
    console.log('Starting sync to Firebase...');

    // Fetch all data from IndexedDB
    const transactions = await db.transactions.toArray();
    const categories = await db.categories.toArray();
    const fundSources = await db.fundSources.toArray();
    const goals = await db.goals.toArray();
    const investments = await db.investments.toArray();
    const debts = await db.debts.toArray();

    const dataToSync = {
      transactions,
      categories,
      fundSources,
      goals,
      investments,
      debts,
      lastSync: new Date().toISOString(),
    };

    // Reference to the root of your database
    const dbRef = ref(database);

    // Set the data, this will overwrite everything at the root
    await set(dbRef, dataToSync);

    console.log('Sync to Firebase successful.');
  } catch (error) {
    console.error('Error during Firebase sync:', error);
    // Re-throw the error to be caught by the calling function
    if (error instanceof Error) {
        throw new Error(`Firebase sync failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during Firebase sync.');
  }
}
