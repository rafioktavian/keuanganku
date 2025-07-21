import DebtsDashboard from './DebtsDashboard';

export default function DebtsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">Utang & Piutang</h1>
        <p className="text-center text-muted-foreground mt-2">Kelola dan lacak catatan utang dan piutang Anda.</p>
      </header>
      <div className="max-w-6xl mx-auto">
        <DebtsDashboard />
      </div>
    </div>
  );
}
