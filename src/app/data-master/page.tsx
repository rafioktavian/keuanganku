import DataMasterTabs from './DataMasterTabs';

export default function DataMasterPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6 md:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center text-foreground font-headline">Data Master</h1>
        <p className="text-center text-muted-foreground mt-2">Kelola kategori dan sumber dana Anda.</p>
      </header>
      <div className="max-w-4xl mx-auto">
        <DataMasterTabs />
      </div>
    </div>
  );
}
