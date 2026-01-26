/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { EditPaymentDialog, NewPaymentDialog, PaymentListDialog } from "@/components/admin/PaymentManagement";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, AlertCircle, Wallet, Plus, IndianRupee, Pencil, Upload, 
  FileSpreadsheet, FileText, FileBox, Loader2, Trash2, ArrowUpRight, Clock, Banknote, Filter, X 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn, formatIndianRupee } from "@/lib/utils";
import { toast } from "sonner";

// --- 1. IMPORT LIVE API HOOKS ---
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/hooks/api/useBookings";
import { useCustomers } from "@/hooks/api/useCustomers";
import { Booking, PaymentStatus, PaymentMode } from "@/lib/api/types";
import { customerGroups } from "@/lib/data";

// --- 2. IMPORT HELPERS & DIALOGS ---
import { 
  EditBookingDialog, 
  DeleteBookingDialog 
} from "@/components/admin/BookingManagement";
import { generateBookingId } from "@/lib/utils";

const Payments = () => {
  // Filters State
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [modeFilter, setModeFilter] = useState<PaymentMode | 'All'>('All');
  const [groupFilter, setGroupFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  // Dialog States
  const [selectedBookingForEdit, setSelectedBookingForEdit] = useState<any>(null); // Full Edit
  const [isBookingEditOpen, setIsBookingEditOpen] = useState(false);
  
  const [selectedPaymentForEdit, setSelectedPaymentForEdit] = useState<Booking | null>(null); // Quick Payment Edit
  const [isPaymentEditOpen, setIsPaymentEditOpen] = useState(false);
  
  const [deleteBookingId, setDeleteBookingId] = useState<string | null>(null);
  
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [detailView, setDetailView] = useState<{ open: boolean; filter: PaymentStatus | 'All' }>({ 
    open: false, 
    filter: 'All' 
  });

  // --- 3. FETCH LIVE DATA ---
  const { data: bookingsRes, isLoading: bookingsLoading, refetch: refetchBookings } = useBookings({ limit: 1000 });
  const { data: customersRes } = useCustomers({ limit: 1000 });
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();

  const bookings = bookingsRes?.data || [];
  const customers = customersRes?.data || [];

  // --- 4. DYNAMIC STATS (Exclude Cancelled) ---
  const totalRevenueNum = bookings.reduce((acc, b) => {
    if (b.status === 'Cancelled') return acc;
    return acc + (b.amountPaid || 0);
  }, 0);

  const pendingDuesNum = bookings.reduce((acc, b) => {
    if (b.status === 'Cancelled') return acc;
    return acc + ((b.amount || 0) - (b.amountPaid || 0));
  }, 0);

  const partialCount = bookings.filter(b => b.paymentStatus === 'Partially Paid' && b.status !== 'Cancelled').length;
  const overdueCount = bookings.filter(b => b.paymentStatus === 'Pending' && b.status !== 'Cancelled').length;

  const summaryCards = [
    { 
      title: "Total Revenue Collected", 
      value: `₹${formatIndianRupee(totalRevenueNum)}`, 
      icon: IndianRupee, 
      color: "text-blue-600", 
      bg: "bg-blue-50",
      filter: 'Paid' as const,
      description: "Total payments received"
    },
    { 
      title: "Outstanding Dues", 
      value: `₹${formatIndianRupee(pendingDuesNum)}`, 
      icon: AlertCircle, 
      color: "text-destructive", 
      bg: "bg-red-50",
      filter: 'Pending' as const,
      description: "Payments yet to be collected"
    },
    { 
      title: "Partial Payments", 
      value: partialCount, 
      icon: Clock, 
      color: "text-warning", 
      bg: "bg-orange-50",
      filter: 'Partially Paid' as const,
      description: "Active installment plans"
    },
    { 
      title: "Pending Bookings", 
      value: overdueCount, 
      icon: Banknote, 
      color: "text-purple-600", 
      bg: "bg-purple-50",
      filter: 'Pending' as const,
      description: "Zero payment recorded"
    },
  ];

  // --- 5. PREPARE DATA ---
  // Sort oldest first for correct ID generation
  const sortedBookings = [...bookings].sort((a, b) => 
    new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime()
  );

  const filteredBookings = sortedBookings.filter((b, index) => {
    const customer = typeof b.customerId === 'object' ? b.customerId : customers.find(c => (c._id || c.id) === b.customerId);
    
    // Filters
    const matchesStatus = statusFilter === 'All' ? true : b.paymentStatus === statusFilter;
    const matchesMode = modeFilter === 'All' ? true : b.paymentMode === modeFilter;
    const matchesGroup = groupFilter === 'All' ? true : customer?.group === groupFilter;
    
    // ID Generation for Search
    const customId = generateBookingId(b, index);
    const matchesSearch =
      customId.toLowerCase().includes(search.toLowerCase()) ||
      (b.media?.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (customer?.company || "").toLowerCase().includes(search.toLowerCase());

    // Date Range
    const matchesDate = (() => {
      if (!dateRange.start && !dateRange.end) return true;
      const bookingDate = new Date(b.startDate);
      const start = dateRange.start ? new Date(dateRange.start) : null;
      const end = dateRange.end ? new Date(dateRange.end) : null;
      if (start && bookingDate < start) return false;
      if (end && bookingDate > end) return false;
      return true;
    })();
      
    return matchesStatus && matchesMode && matchesSearch && matchesGroup && matchesDate;
  });

  const clearFilters = () => {
    setGroupFilter('All');
    setModeFilter('All');
    setDateRange({ start: "", end: "" });
  };

  const hasActiveFilters = groupFilter !== 'All' || modeFilter !== 'All' || dateRange.start || dateRange.end;

  // --- 6. HANDLERS ---
  const handleBookingClick = (booking: any) => {
    setSelectedBookingForEdit(booking);
    setIsBookingEditOpen(true);
  };

  const handleBookingSave = async (updatedData: any) => {
    if (!selectedBookingForEdit) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: selectedBookingForEdit._id || selectedBookingForEdit.id,
        data: updatedData
      });
      toast.success("Booking updated successfully.");
      refetchBookings();
      setIsBookingEditOpen(false);
    } catch (error) {
      toast.error("Failed to update booking.");
    }
  };

  const handlePaymentUpdate = async (id: string, newAmountPaid: number, status: PaymentStatus, mode: PaymentMode) => {
    try {
      const bookingToUpdate = bookings.find(b => b.id === id || b._id === id);
      if (!bookingToUpdate) return;

      await updateBookingMutation.mutateAsync({
        id: bookingToUpdate._id || bookingToUpdate.id,
        data: { amountPaid: newAmountPaid, paymentStatus: status, paymentMode: mode }
      });
      toast.success("Payment updated successfully");
      refetchBookings();
      setIsPaymentEditOpen(false);
      setIsNewPaymentOpen(false);
    } catch (error) {
      toast.error("Failed to update payment");
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteBookingId(id);
  };

  const handleDeleteConfirm = async (id: string) => {
    try {
      await deleteBookingMutation.mutateAsync(id);
      toast.success("Booking deleted successfully.");
      setDeleteBookingId(null);
      refetchBookings();
    } catch (error) {
      toast.error("Failed to delete booking.");
    }
  };

  const handleExport = (format: 'csv' | 'excel' | 'pdf') => {
    if (filteredBookings.length === 0) {
      toast.error("No records found to export.");
      return;
    }
    if (format === 'pdf') {
      window.print();
      return;
    }

    const headers = ["Booking ID", "Company", "Contract Value", "Amount Paid", "Status"];
    const csvContent = [
      headers.join(","),
      ...filteredBookings.map((b) => {
        const originalIndex = sortedBookings.findIndex(sb => (sb._id || sb.id) === (b._id || b.id));
        const customer = typeof b.customerId === 'object' ? b.customerId : customers.find(c => (c._id || c.id) === b.customerId);
        return [generateBookingId(b, originalIndex), `"${customer?.company || 'N/A'}"`, b.amount, b.amountPaid, b.paymentStatus].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SRA_Payments_${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'xls' : 'csv'}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Report exported as ${format.toUpperCase()}.`);
  };

  if (bookingsLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading payment records...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" />
            Payments & Invoices
          </h1>
          <p className="text-muted-foreground">Manage billing, track payments, and edit transaction details.</p>
        </div>
        <div className="flex gap-2 print:hidden">
           <Button onClick={() => setIsNewPaymentOpen(true)}>
             <Plus className="mr-2 h-4 w-4" /> Record Payment
           </Button>
           
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" /> Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileBox className="h-4 w-4 mr-2" /> Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2" /> Download Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <FileText className="h-4 w-4 mr-2" /> Print PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card 
            key={card.title} 
            className="hover:shadow-md transition-all cursor-pointer group border-border/50"
            onClick={() => setDetailView({ open: true, filter: card.filter })}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", card.bg)}>
                <card.icon className={cn("h-4 w-4", card.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center mt-1 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                {card.description} <ArrowUpRight className="ml-1 h-3 w-3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-border/50 bg-card">
        {/* Toolbar */}
        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 print:hidden">
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto items-start sm:items-center">
             <div className="relative w-full sm:w-64">
               <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
               <Input
                 placeholder="Search ID, Company..."
                 className="pl-9"
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
               />
             </div>
             
             <Select value={modeFilter} onValueChange={(val) => setModeFilter(val as PaymentMode | 'All')}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Modes</SelectItem>
                  <SelectItem value="Online">Online / UPI</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                </SelectContent>
             </Select>

             <Sheet>
               <SheetTrigger asChild>
                 <Button variant={hasActiveFilters ? "secondary" : "outline"} size="icon" title="More Filters">
                   <Filter className="h-4 w-4" />
                 </Button>
               </SheetTrigger>
               <SheetContent side="right">
                 <SheetHeader>
                   <SheetTitle>Advanced Filters</SheetTitle>
                   <SheetDescription>Narrow down transactions by date or client group.</SheetDescription>
                 </SheetHeader>
                 <div className="space-y-6 py-6">
                   <div className="space-y-2">
                     <Label>Client Group</Label>
                     <Select value={groupFilter} onValueChange={setGroupFilter}>
                       <SelectTrigger>
                         <SelectValue placeholder="Select Group" />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="All">All Groups</SelectItem>
                         {customerGroups.map(g => (
                           <SelectItem key={g} value={g}>{g}</SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                   <div className="space-y-2">
                     <Label>Start Date (From)</Label>
                     <Input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} />
                   </div>
                   <div className="space-y-2">
                     <Label>Start Date (To)</Label>
                     <Input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} />
                   </div>
                   {hasActiveFilters && (
                     <Button variant="ghost" onClick={clearFilters} className="w-full text-muted-foreground hover:text-destructive">
                       <X className="mr-2 h-4 w-4" /> Clear Filters
                     </Button>
                   )}
                 </div>
               </SheetContent>
             </Sheet>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 xl:pb-0">
             {(['All', 'Pending', 'Partially Paid', 'Paid'] as const).map(f => (
               <Button
                  key={f}
                  variant={statusFilter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(f)}
                  className="whitespace-nowrap"
               >
                 {f}
               </Button>
             ))}
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border overflow-hidden">
          <Table>
            <TableHeader><TableRow className="bg-muted/50">
              <TableHead>Booking ID</TableHead>
              <TableHead>Company</TableHead>
              <TableHead>Contract Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right print:hidden">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    No payments found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => {
                  const customer = typeof booking.customerId === 'object' ? booking.customerId : customers.find(c => (c._id || c.id) === booking.customerId);
                  
                  // Get index from original sorted list to keep ID consistent
                  const originalIndex = sortedBookings.findIndex(sb => (sb._id || sb.id) === (booking._id || booking.id));
                  const customId = generateBookingId(booking, originalIndex);

                  return (
                    <TableRow key={booking._id || booking.id} className="group transition-colors">
                      <TableCell 
                        className="font-mono font-medium text-primary cursor-pointer hover:underline"
                        onClick={() => handleBookingClick(booking)}
                      >
                        <div>{customId}</div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(booking.startDate).toLocaleDateString('en-IN')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer?.company || "Unknown"}</div>
                        <Badge variant="outline" className="text-[10px]">{customer?.group || "N/A"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">₹{booking.amount.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-muted-foreground">
                          Due: <span className={(booking.amount - booking.amountPaid) > 0 ? "text-destructive" : "text-success"}>
                            ₹{formatIndianRupee(booking.amount - booking.amountPaid)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={booking.paymentStatus === 'Paid' ? 'success' : booking.paymentStatus === 'Partially Paid' ? 'warning' : 'destructive'}>
                           {booking.paymentStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right print:hidden">
                        <div className="flex justify-end gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                            onClick={() => { setSelectedPaymentForEdit(booking); setIsPaymentEditOpen(true); }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            // TRIGGER DELETE
                            onClick={() => handleDeleteClick(booking._id || booking.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* QUICK PAYMENT EDIT */}
      <EditPaymentDialog 
        booking={selectedPaymentForEdit}
        open={isPaymentEditOpen}
        onOpenChange={setIsPaymentEditOpen}
        onSave={handlePaymentUpdate}
      />

      {/* NEW PAYMENT */}
      <NewPaymentDialog 
        bookings={bookings}
        open={isNewPaymentOpen}
        onOpenChange={setIsNewPaymentOpen}
        onPaymentRecorded={handlePaymentUpdate}
      />

      {/* PAYMENT LIST (DETAILS) */}
      <PaymentListDialog 
        open={detailView.open}
        onOpenChange={(open) => setDetailView(prev => ({ ...prev, open }))}
        initialFilter={detailView.filter}
        bookings={bookings}
        onUpdateBooking={(updated) => handlePaymentUpdate(updated.id, updated.amountPaid, updated.paymentStatus, updated.paymentMode!)}
        onDeleteBooking={handleDeleteClick}
      />

      {/* FULL EDIT DIALOG */}
      {selectedBookingForEdit && (
        <EditBookingDialog 
          open={isBookingEditOpen} 
          onOpenChange={setIsBookingEditOpen} 
          booking={selectedBookingForEdit} 
          onSave={handleBookingSave}
        />
      )}

      {/* DELETE CONFIRMATION DIALOG */}
      {deleteBookingId && (
        <DeleteBookingDialog 
          booking={bookings.find(b => (b._id || b.id) === deleteBookingId)} 
          open={!!deleteBookingId} 
          onOpenChange={() => setDeleteBookingId(null)} 
          onConfirm={handleDeleteConfirm} 
        />
      )}
    </div>
  );
};

export default Payments;