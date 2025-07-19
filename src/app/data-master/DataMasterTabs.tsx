'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CategoryManager from './CategoryManager';
import FundSourceManager from './FundSourceManager';

export default function DataMasterTabs() {
  return (
    <Tabs defaultValue="categories" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="categories">Kategori</TabsTrigger>
        <TabsTrigger value="fundSources">Sumber Dana</TabsTrigger>
      </TabsList>
      <TabsContent value="categories">
        <CategoryManager />
      </TabsContent>
      <TabsContent value="fundSources">
        <FundSourceManager />
      </TabsContent>
    </Tabs>
  );
}
