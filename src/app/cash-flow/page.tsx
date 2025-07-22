import CashFlowReport from './CashFlowReport';

export default function CashFlowPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">Laporan Arus Kas</h1>
        <p className="text-center text-muted-foreground mt-2">Analisis pemasukan dan pengeluaran Anda dari waktu ke waktu.</p>
      </header>
      <div className="max-w-6xl mx-auto">
        <CashFlowReport />
      </div>
    </div>
  );
}
