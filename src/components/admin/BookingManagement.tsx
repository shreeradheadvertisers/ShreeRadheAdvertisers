/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, MapPin, Pencil, Trash2, Eye, Search, ChevronLeft, ChevronRight, ListFilter } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Booking, Customer } from "@/lib/api/types";
import { formatIndianRupee } from "@/lib/utils";

// Helper: Technical 'Active' shows as 'Booked' in the UI
export const getStatusLabel = (status: string) => {
  if (status === 'Active') return 'Booked';
  return status; 
};

export function ViewBookingDialog({ booking, open, onOpenChange }: any) {
  if (!booking) return null;
  const balance = (booking.amount || 0) - (booking.amountPaid || 0);
  const media = booking.mediaId || booking.media;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> Booking Details</DialogTitle>
          <DialogDescription>ID: {booking.id || booking._id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4 bg-muted/50 p-3 rounded-lg border">
            <div>
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Status</span>
              <Badge variant={booking.status === 'Active' ? 'success' : 'outline'}>
                {getStatusLabel(booking.status)}
              </Badge>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-muted-foreground block">Payment</span>
              <Badge variant={booking.paymentStatus === 'Paid' ? 'success' : 'warning'}>{booking.paymentStatus}</Badge>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex gap-3">
              <MapPin className="h-4 w-4 mt-1 text-primary" />
              <div>
                <p className="text-sm font-bold">{media?.name || "N/A"}</p>
                <p className="text-xs text-muted-foreground">{media?.city}</p>
              </div>
            </div>
            <Separator />
            <div className="bg-muted/30 p-3 rounded-md space-y-2">
              <div className="flex justify-between text-sm font-bold italic">
                <span>Balance Due:</span>
                <span className={balance > 0 ? "text-destructive" : "text-success"}>₹{formatIndianRupee(balance)}</span>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={() => onOpenChange(false)} className="w-full">Close</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function EditBookingDialog({ booking, open, onOpenChange, onSave }: any) {
  const [formData, setFormData] = useState<any>(booking);
  if (!formData) return null;

  const handleSubmit = (e: any) => { 
    e.preventDefault(); 
    onSave(formData); 
    onOpenChange(false); 
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Edit Booking</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase">Manual Status Override</label>
            <Select 
              value={formData.status} 
              onValueChange={(val) => setFormData({...formData, status: val})}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active (Booked)</SelectItem>
                <SelectItem value="Upcoming">Upcoming</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium">Start Date</label>
              <Input type="date" value={formData.startDate?.split('T')[0]} onChange={(e) => setFormData({...formData, startDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">End Date</label>
              <Input type="date" value={formData.endDate?.split('T')[0]} onChange={(e) => setFormData({...formData, endDate: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium">Total Amount</label>
            <Input type="number" value={formData.amount} onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})} />
          </div>
          <DialogFooter><Button type="submit" className="w-full">Update Booking</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function DeleteBookingDialog({ booking, open, onOpenChange, onConfirm }: any) {
  if (!booking) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>Delete Booking?</DialogTitle></DialogHeader>
        <p className="text-sm text-muted-foreground">Are you sure? This cannot be undone.</p>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => onConfirm(booking._id || booking.id)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- UPDATED: ALL BOOKINGS DIALOG WITH STATUS FILTER ---
export function AllBookingsDialog({ open, onOpenChange, bookings, customers, onEdit, onDelete, onView, pagination }: any) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredBookings = (bookings || []).filter((b: any) => {
    const s = search.toLowerCase();
    const media = b.mediaId || b.media;
    const customer = customers.find((c: any) => c.id === b.customerId || c._id === b.customerId) || (typeof b.customerId === 'object' ? b.customerId : null);
    
    const matchesSearch = (media?.name || "").toLowerCase().includes(s) || (customer?.company || "").toLowerCase().includes(s);
    const matchesStatus = statusFilter === "all" || b.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Global Booking Registry</DialogTitle>
          <DialogDescription>Full history with status filters.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-4 my-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search by company or media..." 
              className="pl-9" 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <ListFilter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Booked (Active)</SelectItem>
              <SelectItem value="Upcoming">Upcoming</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="flex-1 border rounded-md">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Schedule</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((b: any) => {
                const customer = customers.find((c: any) => c.id === b.customerId || c._id === b.customerId) || (typeof b.customerId === 'object' ? b.customerId : null);
                const media = b.mediaId || b.media;
                return (
                  <TableRow key={b._id || b.id}>
                    <TableCell className="font-bold">{customer?.company || "Unknown"}</TableCell>
                    <TableCell><div className="text-xs">{media?.name}</div></TableCell>
                    <TableCell className="text-[10px]">{b.startDate?.split('T')[0]} to {b.endDate?.split('T')[0]}</TableCell>
                    <TableCell>
                      <Badge variant={b.status === 'Active' ? 'success' : 'outline'} className="text-[10px]">
                        {getStatusLabel(b.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onView(b)}><Eye className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(b)}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => onDelete(b)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredBookings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No bookings found for the selected criteria.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
        <div className="flex items-center justify-between py-4 border-t px-2 bg-background mt-auto">
          <p className="text-xs text-muted-foreground">Page <strong>{pagination.currentPage}</strong> of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={pagination.currentPage === 1} onClick={() => pagination.onPageChange(pagination.currentPage - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
            <Button variant="outline" size="sm" disabled={pagination.currentPage === pagination.totalPages} onClick={() => pagination.onPageChange(pagination.currentPage + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}