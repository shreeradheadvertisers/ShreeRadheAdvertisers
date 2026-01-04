import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Trash2, RefreshCw, Clock } from "lucide-react"; 
import { CentralBinItem } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface RecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedItems: CentralBinItem[];
  onRestore: (id: string, type: CentralBinItem['type']) => void;
  onPermanentDelete: (id: string, type: CentralBinItem['type']) => void;
  onRestoreAll?: () => void;
  onDeleteAll?: () => void;
}

export function RecycleBinDialog({
  open,
  onOpenChange,
  deletedItems,
  onRestore,
  onPermanentDelete,
  onRestoreAll,
  onDeleteAll,
}: RecycleBinDialogProps) {
  const [confirmAction, setConfirmAction] = useState<{ 
    id: string; 
    type: CentralBinItem['type']; 
    mode: 'restore' | 'delete' 
  } | null>(null);
  const [bulkConfirm, setBulkConfirm] = useState<'restore-all' | 'delete-all' | null>(null);

  const getDaysRemaining = (deletedAt: string) => {
    const diff = new Date().getTime() - new Date(deletedAt).getTime();
    const daysLeft = 30 - Math.floor(diff / (1000 * 3600 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  const handleBulkConfirm = () => {
    if (bulkConfirm === 'restore-all' && onRestoreAll) {
      onRestoreAll();
    } else if (bulkConfirm === 'delete-all' && onDeleteAll) {
      onDeleteAll();
    }
    setBulkConfirm(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 pb-2">
            <DialogHeader>
              {/* Added pr-12 to push content away from the X button */}
              <div className="flex items-center justify-between pr-12">
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <Trash2 className="h-5 w-5 text-destructive" /> Central Recycle Bin
                </DialogTitle>
                <Badge variant="outline" className="bg-muted">Stored for 30 days</Badge>
              </div>
              <DialogDescription>Showing {deletedItems.length} total deleted records.</DialogDescription>
            </DialogHeader>

            {deletedItems.length > 0 && (
              <div className="flex gap-2 py-2 mt-2 border-y border-border/50">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-green-600 border-green-200 hover:bg-green-50"
                  onClick={() => setBulkConfirm('restore-all')}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Restore All
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-destructive border-destructive/30 hover:bg-destructive/10"
                  onClick={() => setBulkConfirm('delete-all')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Wipe Recycle Bin
                </Button>
              </div>
            )}
          </div>

          <ScrollArea className="flex-grow">
            <div className="px-6 pb-6">
              <Table>
                <TableHeader className="bg-background sticky top-0 z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Type</TableHead>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[120px]">Expires</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deletedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <Trash2 className="h-10 w-10 opacity-20" />
                          <p>Bin is empty.</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deletedItems.map((item) => (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize text-[10px]">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{item.displayName}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.subText}</TableCell>
                        <TableCell>
                          <div className={cn(
                            "flex items-center gap-1 text-xs",
                            getDaysRemaining(item.deletedAt) < 7 ? "text-orange-600 font-bold" : ""
                          )}>
                            <Clock className="h-3.5 w-3.5" /> {getDaysRemaining(item.deletedAt)}d
                          </div>
                        </TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button size="sm" variant="ghost" className="h-8 text-green-600 hover:bg-green-50" onClick={() => setConfirmAction({ id: item.id, type: item.type, mode: 'restore' })}>
                            <RefreshCw className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 text-destructive hover:bg-destructive/5" onClick={() => setConfirmAction({ id: item.id, type: item.type, mode: 'delete' })}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Individual Confirm */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.mode === 'restore' ? "Restore Item?" : "Delete Permanently?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.mode === 'restore' 
                ? "This will move the record back to your active list." 
                : "This action is final and cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && (confirmAction.mode === 'restore' ? onRestore(confirmAction.id, confirmAction.type) : onPermanentDelete(confirmAction.id, confirmAction.type))}
              className={confirmAction?.mode === 'delete' ? "bg-destructive hover:bg-destructive/90" : "bg-primary"}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Confirm */}
      <AlertDialog open={!!bulkConfirm} onOpenChange={() => setBulkConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bulk Action Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              {bulkConfirm === 'restore-all' 
                ? "Restore all items in the bin?" 
                : "Permanently purge all items? This cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkConfirm} className={bulkConfirm === 'delete-all' ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700"}>
              Proceed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}