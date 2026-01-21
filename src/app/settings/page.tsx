
import SyncManager from './SyncManager';
import InitialBalanceCard from './InitialBalanceCard';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">Pengaturan</h1>
        <p className="text-center text-muted-foreground mt-2">Kelola pengaturan aplikasi dan data Anda.</p>
      </header>
      <div className="max-w-2xl mx-auto space-y-6">
        <InitialBalanceCard />
        <SyncManager />
      </div>
    </div>
  );
}
