/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query"; 
import { 
  Users, Search, Building2, Mail, Phone, MapPin, Calendar, IndianRupee,
  ChevronDown, ChevronUp, Plus, Pencil, Trash2, Eye,
  ChevronLeft, ChevronRight, ListFilter, LayoutDashboard, ShieldCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { customerGroups as initialGroups } from "@/lib/data";
import type { Customer, Booking } from "@/lib/api/types"; 

import { AddCustomerDialog, EditCustomerDialog, DeleteCustomerDialog } from "@/components/admin/CustomerManagement";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { CustomerGroupInsights } from "@/components/admin/CustomerGroupInsights";
import { ExpiringBookings } from "@/components/admin/ExpiringBookings"; 
import { 
  EditBookingDialog, 
  ViewBookingDialog, 
  DeleteBookingDialog, 
  AllBookingsDialog,
  getStatusLabel 
} from "@/components/admin/BookingManagement";

import { toast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/api/useCustomers"; 
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/hooks/api/useBookings";
import { useUpdateMedia } from "@/hooks/api/useMedia";

// --- PAGINATION HELPER (Preserved non-bold) ---
export function PaginationControls({ currentPage, totalPages, onPageChange, totalItems, pageSize }: any) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/50">
      <p className="text-xs text-muted-foreground font-normal">
        {totalItems && pageSize ? `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} records` : `Page ${currentPage} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} className="font-normal"><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
        <div className="flex items-center justify-center min-w-[80px] text-sm font-medium">{currentPage} / {totalPages}</div>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} className="font-normal">Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}

function CustomerCard({ customer, bookings, onViewBooking }: { customer: Customer; bookings: Booking[]; onViewBooking: (b: Booking) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = bookings.filter((b: any) => statusFilter === "all" || b.status === statusFilter);
  const displayBookings = filtered.slice(0, 5);
  
  const totalSpent = bookings.reduce((sum: number, b: any) => sum + (b.amount || 0), 0);
  const locationDisplay = (customer as any).city || customer.address || 'N/A';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 mb-4">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer">
            <div className="flex items-start justify-between font-normal">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0"><Building2 className="h-6 w-6" /></div>
                <div><CardTitle className="text-lg font-medium">{customer.company}</CardTitle><Badge variant="outline" className="mt-1 font-normal">{customer.group || 'General'}</Badge></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block"><p className="text-xs text-muted-foreground uppercase tracking-wider">Bookings</p><p className="text-xl font-medium text-primary">{bookings.length}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p><p className="text-xl font-medium text-success">₹{(totalSpent / 100000).toFixed(1)}L</p></div>
                <Button variant="ghost" size="icon">{isOpen ? <ChevronUp /> : <ChevronDown />}</Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg text-sm mt-2 font-normal">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {customer.name}</div>
              <div className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-muted-foreground" /> {customer.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {customer.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {locationDisplay}</div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm flex items-center gap-2 font-normal"><Calendar className="h-4 w-4 text-primary" /> Recent History</h4>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[140px] h-8 text-xs bg-muted/50 border-none shadow-none font-normal">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Active">Booked</SelectItem>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    {displayBookings.map((b: any) => (
                      <TableRow key={b._id || b.id}>
                        <TableCell className="text-xs font-medium">{(b.mediaId?.name || b.media?.name || "N/A")}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-normal">{b.startDate?.split('T')[0]}</TableCell>
                        <TableCell>
                          <Badge variant={b.status === 'Active' ? 'success' : 'outline'} className="text-[10px] font-normal">
                            {getStatusLabel(b.status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs">₹{b.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewBooking(b)}><Eye className="h-3.5 w-3.5"/></Button></TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground font-normal">No bookings matching filter.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}

export default function CustomerBookings() {
  const queryClient = useQueryClient(); 
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [masterPage, setMasterPage] = useState(1);
  const listSectionRef = useRef<HTMLDivElement>(null);

  const { data: custRes, isLoading: loadingCust } = useCustomers({ search: searchQuery, page: clientPage, limit: 10 });
  const { data: masterBookingsRes } = useBookings({ page: masterPage, limit: 10 });
  const { data: statsRes } = useBookings({ limit: 1000 }); 

  const updateBookingMutation = useUpdateBooking();
  const updateMediaMutation = useUpdateMedia();
  const deleteBookingMutation = useDeleteBooking();

  const snapshotBookings = useMemo(() => statsRes?.data || [], [statsRes]);
  const customersData = custRes?.data || [];
  const totalRevenue = snapshotBookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  const processedCustomers = useMemo(() => {
    return customersData.map((c: any) => {
      const id = c._id || c.id;
      const custBookings = snapshotBookings.filter(b => (b.customerId?._id || b.customerId) === id);
      return { ...c, id, totalBookings: custBookings.length, totalSpent: custBookings.reduce((sum, b) => sum + (b.amount || 0), 0) } as Customer;
    });
  }, [customersData, snapshotBookings]);

  const handleTotalClientsClick = () => {
    setActiveTab("manage");
    setTimeout(() => { 
      listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); 
    }, 200);
  };

  // --- REFINED: THE "FORCED REFRESH" UPDATE LOGIC ---
  const handleUpdateBooking = async (u: Booking) => {
    try {
      // 1. Perform the update on the server
      await updateBookingMutation.mutateAsync({ id: u._id || u.id, data: u });
      
      // 2. Synchronize Media status (Essential for Cancelled/Completed logic)
      const mediaId = typeof u.mediaId === 'object' ? u.mediaId?._id : u.mediaId;
      if (mediaId) {
        const newMediaStatus = u.status === 'Active' ? 'Booked' : 'Available';
        await updateMediaMutation.mutateAsync({ id: mediaId, data: { status: newMediaStatus } });
      }

      // 3. CRITICAL: Wipe and Refresh all relevant cached data for the Dashboard
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['media'] });
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      toast({ title: "Updated", description: "Dashboard and Media status refreshed." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update dashboard.", variant: "destructive" });
    }
  };

  const handleDeleteBooking = async (id: string) => {
    try {
      await deleteBookingMutation.mutateAsync(id);
      await queryClient.invalidateQueries(); 
      toast({ title: "Deleted", description: "Statistics recalculated." });
      setDeleteBooking(null); 
    } catch (err: any) {
      toast({ title: "Error", description: "Deletion failed.", variant: "destructive" });
    }
  };

  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [allBookingsOpen, setAllBookingsOpen] = useState(false);
  const [viewBooking, setViewBooking] = useState<Booking | null>(null);
  const [editBooking, setEditBooking] = useState<Booking | null>(null);
  const [deleteBooking, setDeleteBooking] = useState<Booking | null>(null);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [deleteCustomer, setDeleteCustomer] = useState<Customer | null>(null);

  useEffect(() => { setClientPage(1); }, [searchQuery]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700 font-normal">
      {/* 1. Header (Reduced size to text-2xl, Non-bold) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            <LayoutDashboard className="h-7 w-7 text-primary" /> Customer Intelligence Cabinet
          </h1>
          <p className="text-muted-foreground text-sm font-normal">Comprehensive monitoring of contract lifecycles.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" className="shadow-sm font-normal" onClick={() => setAllBookingsOpen(true)}><ListFilter className="h-4 w-4 mr-2" />All Bookings</Button>
          <Button variant="outline" className="shadow-sm font-normal" onClick={() => setAddCustomerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          <CreateBookingDialog />
        </div>
      </div>

      {/* 2. KPI Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6 border-l-4 border-l-primary shadow-sm bg-card/50 hover:shadow-md transition-all cursor-pointer" onClick={handleTotalClientsClick}>
          <div className="flex justify-between items-start"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Total clients</p><Users className="h-5 w-5 text-primary" /></div>
          <div className="mt-3"><h3 className="text-2xl font-medium">{custRes?.pagination?.total ?? processedCustomers.length ?? 0}</h3></div>
        </Card>
        <Card className="p-6 border-l-4 border-l-accent shadow-sm bg-card/50 hover:shadow-md transition-all cursor-pointer" onClick={() => setAllBookingsOpen(true)}>
          <div className="flex justify-between items-start"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Recent bookings</p><Calendar className="h-5 w-5 text-accent" /></div>
          <div className="mt-3"><h3 className="text-2xl font-medium">{snapshotBookings.length}</h3></div>
        </Card>
        <Card className="p-6 border-l-4 border-l-success shadow-sm bg-card/50">
          <div className="flex justify-between items-start"><p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Gross Revenue</p><IndianRupee className="h-5 w-5 text-success" /></div>
          <div className="mt-3"><h3 className="text-2xl font-medium">₹{(totalRevenue / 100000).toFixed(2)} L</h3></div>
        </Card>
      </div>

      <div className="my-8">
        <CustomerGroupInsights customers={processedCustomers} allBookings={snapshotBookings} />
      </div>

      <div className="my-10">
        <ExpiringBookings 
          onViewBooking={setViewBooking} 
          onViewReport={() => setAllBookingsOpen(true)}
        />
      </div>

      <div ref={listSectionRef} className="scroll-mt-24">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="bookings" className="font-medium">Client Cards</TabsTrigger>
            <TabsTrigger value="manage" className="font-medium">Customer Registry</TabsTrigger>
          </TabsList>
          
          <div className="mt-6">
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search company database..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 font-normal" />
            </div>

            <TabsContent value="bookings" className="space-y-4 m-0 font-normal">
              {loadingCust ? (
                <div className="py-20 text-center text-muted-foreground animate-pulse font-normal">Syncing records...</div>
              ) : (
                <>
                  {processedCustomers.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} bookings={snapshotBookings.filter(b => (b.customerId?._id || b.customerId) === customer.id)} onViewBooking={setViewBooking} />
                  ))}
                  <PaginationControls currentPage={clientPage} totalPages={custRes?.pagination?.totalPages || 1} onPageChange={setClientPage} totalItems={custRes?.pagination?.total} pageSize={10} />
                </>
              )}
            </TabsContent>

            <TabsContent value="manage" className="m-0 font-normal">
              <Card className="bg-card/50 border-none shadow-sm font-normal">
                <CardContent className="p-0 font-normal">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="font-medium">Customer Name</TableHead>
                        <TableHead className="font-medium">Sector Group</TableHead>
                        <TableHead className="font-medium text-center">Number of Bookings</TableHead>
                        <TableHead className="text-right font-medium">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processedCustomers.map(c => (
                        <TableRow key={c.id} className="hover:bg-muted/20 transition-colors font-normal">
                          <TableCell className="font-medium">{c.company}</TableCell>
                          <TableCell><Badge variant="outline" className="bg-background font-normal">{c.group || 'General'}</Badge></TableCell>
                          <TableCell className="text-center font-normal">
                            <Badge variant="secondary" className="font-mono font-normal">{c.totalBookings}</Badge>
                          </TableCell>
                          <TableCell className="text-right flex justify-end gap-1 font-normal">
                            <Button variant="ghost" size="icon" onClick={() => setEditCustomer(c)}><Pencil className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="text-destructive font-normal" onClick={() => setDeleteCustomer(c)}><Trash2 className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t border-border/50">
                    <PaginationControls currentPage={clientPage} totalPages={custRes?.pagination?.totalPages || 1} onPageChange={setClientPage} totalItems={custRes?.pagination?.total} pageSize={10} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      <div className="pt-8 border-t flex justify-between items-center text-[10px] text-muted-foreground uppercase font-medium tracking-widest">
        <p><ShieldCheck className="h-3 w-3 inline mr-1" /> Secure CRM Data Stream</p>
      </div>

      {/* MODALS */}
      <AllBookingsDialog 
        open={allBookingsOpen} 
        onOpenChange={setAllBookingsOpen} 
        bookings={masterBookingsRes?.data || []}
        customers={processedCustomers}
        onEdit={setEditBooking}
        onDelete={setDeleteBooking}
        onView={setViewBooking}
        pagination={{ currentPage: masterPage, totalPages: masterBookingsRes?.pagination?.totalPages || 1, onPageChange: setMasterPage }}
      />

      {viewBooking && <ViewBookingDialog booking={viewBooking} open={!!viewBooking} onOpenChange={() => setViewBooking(null)} />}
      {editBooking && <EditBookingDialog booking={editBooking} open={!!editBooking} onOpenChange={() => setEditBooking(null)} onSave={handleUpdateBooking} />}
      {deleteBooking && <DeleteBookingDialog booking={deleteBooking} open={!!deleteBooking} onOpenChange={() => setDeleteBooking(null)} onConfirm={handleDeleteBooking} />}
      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} availableGroups={initialGroups} onAddGroup={() => {}} onCustomerAdded={() => {}} />
      {editCustomer && <EditCustomerDialog customer={editCustomer} open={!!editCustomer} onOpenChange={() => setEditCustomer(null)} availableGroups={initialGroups} onCustomerUpdated={() => {}} onAddGroup={() => {}} />}
      {deleteCustomer && <DeleteCustomerDialog customer={deleteCustomer} open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)} onCustomerDeleted={() => {}} />}
    </div>
  );
}