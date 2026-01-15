/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { 
  Users, Search, Building2, Mail, Phone, MapPin, Calendar, IndianRupee,
  ChevronDown, ChevronUp, Plus, Pencil, Trash2, Eye,
  ChevronLeft, ChevronRight, ListFilter
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { customerGroups as initialGroups } from "@/lib/data";
import type { Customer, Booking } from "@/lib/api/types"; 

import { AddCustomerDialog, EditCustomerDialog, DeleteCustomerDialog } from "@/components/admin/CustomerManagement";
import { CreateBookingDialog } from "@/components/admin/CreateBookingDialog";
import { CustomerGroupInsights } from "@/components/admin/CustomerGroupInsights";
import { EditBookingDialog, ViewBookingDialog, DeleteBookingDialog, AllBookingsDialog } from "@/components/admin/BookingManagement";
import { toast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/api/useCustomers"; 
import { useBookings, useUpdateBooking, useDeleteBooking } from "@/hooks/api/useBookings";

// Helper for Pagination
export function PaginationControls({ currentPage, totalPages, onPageChange, totalItems, pageSize }: any) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/50">
      <p className="text-xs text-muted-foreground">
        {totalItems && pageSize ? `Showing ${((currentPage - 1) * pageSize) + 1} to ${Math.min(currentPage * pageSize, totalItems)} of ${totalItems} records` : `Page ${currentPage} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}><ChevronLeft className="h-4 w-4 mr-1" /> Previous</Button>
        <div className="flex items-center justify-center min-w-[80px] text-sm font-medium">{currentPage} / {totalPages}</div>
        <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next <ChevronRight className="h-4 w-4 ml-1" /></Button>
      </div>
    </div>
  );
}

function CustomerCard({ customer, bookings, onViewBooking }: { customer: Customer; bookings: Booking[]; onViewBooking: (b: Booking) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const recentBookings = bookings.slice(0, 5);
  const totalSpent = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);

  // FIX: Safe access to location property. Uses 'address' as fallback if 'city' doesn't exist on type.
  const locationDisplay = (customer as any).city || customer.address || 'N/A';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300 hover:shadow-md">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors rounded-t-lg">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0"><Building2 className="h-6 w-6" /></div>
                <div><CardTitle className="text-lg">{customer.company}</CardTitle><Badge variant="outline" className="mt-1 font-normal">{customer.group || 'General'}</Badge></div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right hidden sm:block"><p className="text-xs text-muted-foreground uppercase tracking-wider">Bookings</p><p className="text-xl font-bold text-primary">{bookings.length}</p></div>
                <div className="text-right"><p className="text-xs text-muted-foreground uppercase tracking-wider">Revenue</p><p className="text-xl font-bold text-success">₹{(totalSpent / 100000).toFixed(1)}L</p></div>
                <Button variant="ghost" size="icon">{isOpen ? <ChevronUp /> : <ChevronDown />}</Button>
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg text-sm mt-2">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {customer.name}</div>
              <div className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-muted-foreground" /> {customer.email}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {customer.phone}</div>
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" /> {locationDisplay}</div>
            </div>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Recent Activity</h4>
              <div className="border border-border/50 rounded-lg overflow-hidden">
                <Table>
                  <TableBody>
                    {recentBookings.map((b) => (
                      <TableRow key={b._id || b.id} className="hover:bg-muted/30">
                        <TableCell className="text-xs font-medium">{(b.mediaId?.name || b.media?.name || "N/A")}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{b.startDate?.split('T')[0]}</TableCell>
                        <TableCell><Badge variant={b.status === 'Active' ? 'success' : 'outline'} className="text-[10px]">{b.status}</Badge></TableCell>
                        <TableCell className="text-right font-medium text-xs">₹{b.amount?.toLocaleString()}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onViewBooking(b)}><Eye className="h-3.5 w-3.5"/></Button></TableCell>
                      </TableRow>
                    ))}
                    {bookings.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4 text-xs text-muted-foreground">No recent bookings.</TableCell></TableRow>}
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
  const [activeTab, setActiveTab] = useState("bookings");
  const [searchQuery, setSearchQuery] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [masterPage, setMasterPage] = useState(1);
  const itemsPerPage = 10;
  
  const listSectionRef = useRef<HTMLDivElement>(null);

  const { data: custRes, isLoading: loadingCust } = useCustomers({ search: searchQuery, page: clientPage, limit: itemsPerPage });
  const { data: masterBookingsRes } = useBookings({ page: masterPage, limit: 10 });
  const { data: statsRes } = useBookings({ limit: 200 });

  const updateBookingMutation = useUpdateBooking();
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
    setTimeout(() => { listSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, 100);
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
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground mt-1">Detailed overview of client history and global operations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAllBookingsOpen(true)}><ListFilter className="h-4 w-4 mr-2" />Full History</Button>
          <Button variant="outline" onClick={() => setAddCustomerOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Client</Button>
          <CreateBookingDialog />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" onClick={handleTotalClientsClick}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-primary/10 p-3 text-primary group-hover:bg-primary group-hover:text-white transition-colors"><Users className="h-6 w-6"/></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Clients</p>
              <p className="text-2xl font-bold">{custRes?.pagination?.total ?? processedCustomers.length ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer group" onClick={() => setAllBookingsOpen(true)}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-accent/10 p-3 text-accent group-hover:bg-accent group-hover:text-white transition-colors"><Calendar className="h-6 w-6"/></div>
            <div><p className="text-sm text-muted-foreground">Recent Bookings</p><p className="text-2xl font-bold">{snapshotBookings.length}</p></div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-success/10 p-3 text-success group-hover:bg-success group-hover:text-white transition-colors"><IndianRupee className="h-6 w-6"/></div>
            <div><p className="text-sm text-muted-foreground">Recent Revenue</p><p className="text-2xl font-bold">₹{(totalRevenue / 100000).toFixed(2)} L</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="my-8">
        <CustomerGroupInsights customers={processedCustomers} allBookings={snapshotBookings} />
      </div>

      <div ref={listSectionRef}>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="bookings">Client Cards</TabsTrigger>
            <TabsTrigger value="manage">Manage Registry</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <div className="relative max-w-md mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search company..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>

            <TabsContent value="bookings" className="space-y-4 m-0">
              {loadingCust ? <div className="py-20 text-center">Syncing records...</div> : (
                <>
                  {processedCustomers.map((customer) => (
                    <CustomerCard key={customer.id} customer={customer} bookings={snapshotBookings.filter(b => (b.customerId?._id || b.customerId) === customer.id)} onViewBooking={setViewBooking} />
                  ))}
                  <PaginationControls currentPage={clientPage} totalPages={custRes?.pagination?.totalPages || 1} onPageChange={setClientPage} totalItems={custRes?.pagination?.total} pageSize={itemsPerPage} />
                </>
              )}
            </TabsContent>

            <TabsContent value="manage" className="m-0">
              <Card className="bg-card/50">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader><TableRow className="bg-muted/50"><TableHead>Customer</TableHead><TableHead>Group</TableHead><TableHead>Recent Bookings</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {processedCustomers.map(c => (
                        <TableRow key={c.id}>
                          <TableCell className="font-medium">{c.company}</TableCell>
                          <TableCell><Badge variant="outline">{c.group || 'N/A'}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">{c.totalBookings}</Badge></TableCell>
                          <TableCell className="text-right flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setEditCustomer(c)}><Pencil className="h-4 w-4"/></Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setDeleteCustomer(c)}><Trash2 className="h-4 w-4"/></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <div className="p-4 border-t">
                    <PaginationControls currentPage={clientPage} totalPages={custRes?.pagination?.totalPages || 1} onPageChange={setClientPage} totalItems={custRes?.pagination?.total} pageSize={itemsPerPage} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

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
      {editBooking && <EditBookingDialog booking={editBooking} open={!!editBooking} onOpenChange={() => setEditBooking(null)} onSave={(u: Booking) => updateBookingMutation.mutate({ id: u._id || u.id, data: u })} />}
      {deleteBooking && <DeleteBookingDialog booking={deleteBooking} open={!!deleteBooking} onOpenChange={() => setDeleteBooking(null)} onConfirm={(id: string) => deleteBookingMutation.mutate(id)} />}
      <AddCustomerDialog open={addCustomerOpen} onOpenChange={setAddCustomerOpen} availableGroups={initialGroups} onAddGroup={() => {}} onCustomerAdded={() => {}} />
      {editCustomer && <EditCustomerDialog customer={editCustomer} open={!!editCustomer} onOpenChange={() => setEditCustomer(null)} availableGroups={initialGroups} onCustomerUpdated={() => {}} onAddGroup={() => {}} />}
      {deleteCustomer && <DeleteCustomerDialog customer={deleteCustomer} open={!!deleteCustomer} onOpenChange={() => setDeleteCustomer(null)} onCustomerDeleted={() => {}} />}
    </div>
  );
}