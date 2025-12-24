import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, RefreshCw, X, AlertTriangle, Clock } from "lucide-react";
import { MediaLocation } from "@/lib/data";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface RecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedItems: MediaLocation[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
}

export function RecycleBinDialog({
  open,
  onOpenChange,
  deletedItems,
  onRestore,
  onPermanentDelete,
}: RecycleBinDialogProps) {
  const [restoreId, setRestoreId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Helper: Calculate Days Remaining (30 Day Policy)
  const getDaysRemaining = (deletedAt?: string) => {
    if (!deletedAt) return 30; // Default if no date
    const deletedDate = new Date(deletedAt);
    const today = new Date();
    
    // Calculate difference in milliseconds
    const diffTime = today.getTime() - deletedDate.getTime();
    // Convert to days elapsed
    const daysElapsed = Math.floor(diffTime / (1000 * 3600 * 24)); 
    
    const daysLeft = 30 - daysElapsed;
    return daysLeft > 0 ? daysLeft : 0;
  };

  const confirmRestore = () => {
    if (restoreId) {
      onRestore(restoreId);
      setRestoreId(null);
      toast({ title: "Restored", description: "Media moved back to active inventory." });
    }
  };

  const confirmPermanentDelete = () => {
    if (deleteId) {
      onPermanentDelete(deleteId);
      setDeleteId(null);
      toast({ variant: "destructive", title: "Deleted Forever", description: "Item permanently removed." });
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between mr-6">
                <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" />
                Recycle Bin
                </DialogTitle>
                <Badge variant="outline" className="text-muted-foreground font-normal border-dashed">
                    Items kept for 30 days
                </Badge>
            </div>
            <DialogDescription>
              Restore items or delete them permanently. Expired items are removed automatically.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 border rounded-md mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Media Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Deleted Date</TableHead>
                  <TableHead>Auto-Delete In</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center gap-2">
                      <p>Recycle bin is empty.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  deletedItems.map((item) => {
                    const daysLeft = getDaysRemaining(item.deletedAt);
                    // Determine row styling based on urgency
                    const urgencyClass = daysLeft <= 5 ? "text-destructive font-bold" : "text-muted-foreground";

                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">
                          {item.city}, {item.district}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : "Unknown"}
                        </TableCell>
                        <TableCell>
                            <div className={`flex items-center gap-1.5 text-xs ${urgencyClass}`}>
                                <Clock className="h-3 w-3" />
                                {daysLeft} Days
                            </div>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 gap-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                            onClick={() => setRestoreId(item.id)}
                          >
                            <RefreshCw className="h-3 w-3" /> Restore
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(item.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RESTORE CONFIRMATION */}
      <AlertDialog open={!!restoreId} onOpenChange={(open) => !open && setRestoreId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Media?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the media item back to the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} className="bg-green-600 hover:bg-green-700">Confirm Restore</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PERMANENT DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Permanently Delete?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The data will be lost forever.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete} className="bg-destructive hover:bg-destructive/90">Delete Forever</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}