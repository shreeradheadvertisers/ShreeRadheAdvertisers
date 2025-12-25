import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { RecycleBinDialog } from "@/components/admin/RecycleBinDialog";
import { CentralBinItem } from "@/lib/api/types";
import { toast } from "@/hooks/use-toast";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"; // 1. Added SidebarInset

export type AdminContextType = {
  registerSoftDelete: (item: CentralBinItem) => void;
  triggerRestore: string | null;
  setTriggerRestore: (val: string | null) => void;
};

export function AdminLayout() {
  const [recycleBinOpen, setRecycleBinOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState<CentralBinItem[]>([]);
  const [triggerRestore, setTriggerRestore] = useState<string | null>(null);

  const registerSoftDelete = (item: CentralBinItem) => {
    setDeletedItems((prev) => [...prev, item]);
  };

  const handleRestore = (id: string, type: CentralBinItem['type']) => {
    setDeletedItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
    setTriggerRestore(`${type}-${id}-${Date.now()}`); 
    toast({ title: "Restored", description: `The ${type} has been returned to active management.` });
  };

  const handlePermanentDelete = (id: string, type: CentralBinItem['type']) => {
    setDeletedItems((prev) => prev.filter((item) => !(item.id === id && item.type === type)));
    toast({ variant: "destructive", title: "Deleted Forever", description: "Item permanently removed from database." });
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AdminSidebar />
        {/* 2. Wrap main content area in SidebarInset */}
        <SidebarInset className="flex flex-col flex-1 transition-all duration-300">
          <AdminHeader onOpenBin={() => setRecycleBinOpen(true)} binCount={deletedItems.length} />
          <main className="p-6">
            <Outlet context={{ registerSoftDelete, triggerRestore, setTriggerRestore }} />
          </main>
        </SidebarInset>

        <RecycleBinDialog 
          open={recycleBinOpen} 
          onOpenChange={setRecycleBinOpen}
          deletedItems={deletedItems}
          onRestore={handleRestore}
          onPermanentDelete={handlePermanentDelete}
        />
      </div>
    </SidebarProvider>
  );
}