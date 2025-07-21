import InvestmentsDashboard from './InvestmentsDashboard';

export default function InvestmentsPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">Pelacak Investasi</h1>
        <p className="text-center text-muted-foreground mt-2">Catat dan pantau perkembangan aset investasi Anda.</p>
      </header>
      <div className="max-w-6xl mx-auto">
        <InvestmentsDashboard />
      </div>
    </div>
  );
}
