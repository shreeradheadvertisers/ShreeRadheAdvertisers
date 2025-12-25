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
import { Trash2, RefreshCw, X, Clock } from "lucide-react";
import { CentralBinItem } from "@/lib/api/types";
import { Badge } from "@/components/ui/badge";

interface RecycleBinDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deletedItems: CentralBinItem[];
  onRestore: (id: string, type: CentralBinItem['type']) => void;
  onPermanentDelete: (id: string, type: CentralBinItem['type']) => void;
}

export function RecycleBinDialog({
  open,
  onOpenChange,
  deletedItems,
  onRestore,
  onPermanentDelete,
}: RecycleBinDialogProps) {
  const [confirmAction, setConfirmAction] = useState<{ id: string; type: CentralBinItem['type']; mode: 'restore' | 'delete' } | null>(null);

  const getDaysRemaining = (deletedAt: string) => {
    const diff = new Date().getTime() - new Date(deletedAt).getTime();
    const daysLeft = 30 - Math.floor(diff / (1000 * 3600 * 24));
    return daysLeft > 0 ? daysLeft : 0;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between mr-6">
              <DialogTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-destructive" /> Central Recycle Bin
              </DialogTitle>
              <Badge variant="outline">Stored for 30 days</Badge>
            </div>
            <DialogDescription>Restore items or delete them permanently across all modules.</DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-1 border rounded-md mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Item Name</TableHead>
                  <TableHead>Details</TableHead>
                  <TableHead>Auto-Delete</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deletedItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">Bin is empty.</TableCell>
                  </TableRow>
                ) : (
                  deletedItems.map((item) => (
                    <TableRow key={`${item.type}-${item.id}`}>
                      <TableCell><Badge variant="secondary" className="capitalize">{item.type}</Badge></TableCell>
                      <TableCell className="font-medium">{item.displayName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{item.subText}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" /> {getDaysRemaining(item.deletedAt)} Days
                        </div>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" className="h-7 text-green-600" onClick={() => setConfirmAction({ id: item.id, type: item.type, mode: 'restore' })}>
                          <RefreshCw className="h-3 w-3 mr-1" /> Restore
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => setConfirmAction({ id: item.id, type: item.type, mode: 'delete' })}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.mode === 'restore' ? "Restore Item?" : "Permanently Delete?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.mode === 'restore' 
                ? "This will move the item back to its active list." 
                : "This action cannot be undone. Data will be lost forever."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => confirmAction && (confirmAction.mode === 'restore' ? onRestore(confirmAction.id, confirmAction.type) : onPermanentDelete(confirmAction.id, confirmAction.type))}
              className={confirmAction?.mode === 'delete' ? "bg-destructive" : "bg-primary"}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}