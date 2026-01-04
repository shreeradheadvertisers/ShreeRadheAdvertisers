import { useState } from "react";
import { EditPaymentDialog, NewPaymentDialog, PaymentListDialog } from "@/components/admin/PaymentManagement";
import { bookings as initialBookings, Booking, customers, PaymentStatus, PaymentMode, customerGroups } from "@/lib/data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Search, AlertCircle, Clock, Wallet, Banknote, Plus, Filter, X, 
  IndianRupee, ArrowUpRight, Trash2, Pencil, Upload, FileSpreadsheet, FileText, FileBox 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn, formatIndianRupee } from "@/lib/utils";
import { toast } from "sonner";
import { useRecycleBin } from "@/contexts/RecycleBinContext";

const Payments = () => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const { addToRecycleBin } = useRecycleBin();
  
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'All'>('All');
  const [modeFilter, setModeFilter] = useState<PaymentMode | 'All'>('All');
  const [groupFilter, setGroupFilter] = useState<string>('All');
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [search, setSearch] = useState("");
  
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isNewPaymentOpen, setIsNewPaymentOpen] = useState(false);
  const [detailView, setDetailView] = useState<{ open: boolean; filter: PaymentStatus | 'All' }>({ open: false, filter: 'All' });

  const totalRevenueNum = bookings.reduce((acc, b) => acc + b.amountPaid, 0);
  const pendingDuesNum = bookings.reduce((acc, b) => acc + (b.amount - b.amountPaid), 0);

  const filteredBookings = bookings.filter(b => {
    const customer = customers.find(c => c.id === b.customerId);
    const matchesStatus = statusFilter === 'All' ? true : b.paymentStatus === statusFilter;
    const matchesSearch = b.id.toLowerCase().includes(search.toLowerCase()) || 
                          customer?.company.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
      ...filteredBookings.map(b => {
        const customer = customers.find(c => c.id === b.customerId);
        return [b.id, `"${customer?.company || 'N/A'}"`, b.amount, b.amountPaid, b.paymentStatus].join(",");
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6 text-primary" /> Payments & Invoices
          </h1>
          <p className="text-muted-foreground">Manage billing and track payments</p>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Total Revenue", value: `₹${formatIndianRupee(totalRevenueNum)}`, icon: IndianRupee, color: "text-blue-600", bg: "bg-blue-50" },
          { title: "Outstanding Dues", value: `₹${formatIndianRupee(pendingDuesNum)}`, icon: AlertCircle, color: "text-destructive", bg: "bg-red-50" }
        ].map((card) => (
          <Card key={card.title} className="hover:shadow-md transition-all border-border/50">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <div className={cn("p-2 rounded-lg", card.bg)}><card.icon className={cn("h-4 w-4", card.color)} /></div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="p-6 border-border/50 bg-card">
        <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 print:hidden">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search Company..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

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
              {filteredBookings.map((booking) => {
                const customer = customers.find(c => c.id === booking.customerId);
                return (
                  <TableRow key={booking.id}>
                    <TableCell className="font-mono">{booking.id}</TableCell>
                    <TableCell className="font-medium">{customer?.company}</TableCell>
                    <TableCell>₹{booking.amount.toLocaleString('en-IN')}</TableCell>
                    <TableCell><Badge variant={booking.paymentStatus === 'Paid' ? 'success' : 'warning'}>{booking.paymentStatus}</Badge></TableCell>
                    <TableCell className="text-right print:hidden space-x-1">
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { setSelectedBooking(booking); setIsEditOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <EditPaymentDialog booking={selectedBooking} open={isEditOpen} onOpenChange={setIsEditOpen} onSave={(id, paid, status, mode) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, amountPaid: paid, paymentStatus: status, paymentMode: mode } : b));
      }} />
      <NewPaymentDialog bookings={bookings} open={isNewPaymentOpen} onOpenChange={setIsNewPaymentOpen} onPaymentRecorded={(id, paid, status, mode) => {
        setBookings(prev => prev.map(b => b.id === id ? { ...b, amountPaid: paid, paymentStatus: status, paymentMode: mode } : b));
      }} />
    </div>
  );
};

export default Payments;