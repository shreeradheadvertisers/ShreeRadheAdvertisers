/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { RecycleBinDialog } from "./RecycleBinDialog"; // Import your dialog component
import { toast } from "sonner";
import { CentralBinItem } from "@/lib/api/types"; // Ensure this type exists (see step 2)

export function CentralRecycleBin() {
  const [open, setOpen] = useState(false);
  const [deletedItems, setDeletedItems] = useState<CentralBinItem[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Deleted Items
  const fetchRecycleBinItems = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<CentralBinItem[]>('/api/recycle-bin');
      setDeletedItems(res as any || []);
    } catch (error) {
      console.error("Failed to fetch recycle bin:", error);
      toast.error("Failed to load deleted items");
    } finally {
      setLoading(false);
    }
  };

  // Open Dialog and Fetch Data
  const handleOpen = () => {
    setOpen(true);
    fetchRecycleBinItems();
  };

  // 2. Restore Item
  const handleRestore = async (id: string, type: string) => {
    try {
      await apiClient.post('/api/recycle-bin/restore', { id, type });
      toast.success("Item restored successfully");
      fetchRecycleBinItems(); // Refresh list
    } catch (error) {
      toast.error("Failed to restore item");
    }
  };

  // 3. Permanent Delete (THE FIX)
  const handlePermanentDelete = async (id: string, type: string) => {
    try {
      // KEY FIX: Use the specific route and pass type as query param
      await apiClient.delete(`/api/recycle-bin/permanent-delete?id=${id}&type=${type}`);
      toast.success("Item permanently deleted");
      fetchRecycleBinItems(); // Refresh list
    } catch (error) {
      toast.error("Failed to delete item permanently");
    }
  };

  // 4. Restore All (Optional)
  const handleRestoreAll = async () => {
    // Implement if backend supports bulk restore, otherwise loop
    // For now, let's just toast
    toast.info("Bulk restore not fully implemented yet");
  };

  // 5. Wipe Recycle Bin (The Fix for Wipe Button)
  const handleDeleteAll = async () => {
    try {
      await apiClient.delete('/api/recycle-bin/wipe');
      toast.success("Recycle bin wiped successfully");
      fetchRecycleBinItems();
    } catch (error) {
      toast.error("Failed to wipe recycle bin");
    }
  };

  return (
    <>
      {/* Trigger Button (Place this in your Dashboard Header or Sidebar) */}
      <Button 
        variant="destructive" 
        size="sm" 
        className="gap-2" 
        onClick={handleOpen}
      >
        <Trash2 className="h-4 w-4" />
        Recycle Bin
      </Button>

      {/* The Dialog Component */}
      <RecycleBinDialog
        open={open}
        onOpenChange={setOpen}
        deletedItems={deletedItems}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        onRestoreAll={handleRestoreAll}
        onDeleteAll={handleDeleteAll}
      />
    </>
  );
}