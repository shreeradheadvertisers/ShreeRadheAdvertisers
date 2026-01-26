/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { AlertTriangle, Phone, ArrowRight, TrendingDown, ChevronRight, Mail, Copy, User, Calendar, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useBookings } from "@/hooks/api/useBookings";
import { generateBookingId } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

interface ExpiringBookingsProps {
  onViewBooking?: (booking: any) => void;
  // onViewReport is no longer strictly needed but kept for backward compatibility if parent uses it
  onViewReport?: () => void;
}

export function ExpiringBookings({ onViewBooking, onViewReport }: ExpiringBookingsProps) {
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Fetch active bookings
  const { data: bookingsRes } = useBookings({ status: 'Active' });
  const allBookings = bookingsRes?.data || [];

  // Sort all bookings by date first to ensure stable IDs
  const sortedAllBookings = [...allBookings].sort((a: any, b: any) => 
    new Date(a.startDate || a.createdAt).getTime() - new Date(b.startDate || b.createdAt).getTime()
  );

  const today = new Date();
  // CHANGED: 30 days -> 15 days
  const fifteenDaysLater = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000);

  const expiringBookings = sortedAllBookings
    .filter((b: any) => {
      const endDate = new Date(b.endDate);
      return endDate >= today && endDate <= fifteenDaysLater;
    })
    .map((b: any) => {
      const endDate = new Date(b.endDate);
      const daysLeft = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      // Find original index for consistent ID generation
      const originalIndex = sortedAllBookings.findIndex(item => item._id === b._id);
      
      return { ...b, daysLeft, originalIndex };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <>
      <Card className="border-none shadow-2xl bg-orange-600 text-white transition-all group overflow-hidden relative animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-150 transition-transform text-white">
          <TrendingDown className="h-32 w-32" />
        </div>
        
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2 text-xl tracking-tight font-medium relative z-10">
              <AlertTriangle className="h-6 w-6" /> 
              Expiring Soon
            </CardTitle>
            <Badge className="bg-white/20 text-white border-none font-medium backdrop-blur-sm px-3">
              Action Required
            </Badge>
          </div>
          <p className="text-orange-50/80 text-sm relative z-10">
            {expiringBookings.length > 0 
              ? `Detecting ${expiringBookings.length} campaigns expiring within 15 days.`
              : "No campaigns expiring in the next 15 days."}
          </p>
        </CardHeader>

        {expiringBookings.length > 0 && (
          <CardContent className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Show only top 3 on the dashboard card */}
              {expiringBookings.slice(0, 3).map((booking: any, i) => {
                const customId = generateBookingId(booking, booking.originalIndex);
                const customerName = booking.customerId?.company || booking.customerId?.name || "Unknown Customer";
                const phone = booking.customerId?.phone;
                const email = booking.customerId?.email;
                const contactPerson = booking.customerId?.name;

                return (
                  <div 
                    key={booking._id} 
                    className="flex items-center justify-between p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 hover:bg-white/20 transition-all cursor-pointer animate-in fade-in slide-in-from-right duration-500"
                    style={{ animationDelay: `${(i + 1) * 150}ms` }}
                    onClick={() => onViewBooking?.(booking)}
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="h-12 w-12 rounded-xl bg-white/20 flex flex-col items-center justify-center font-medium shrink-0 shadow-inner text-xs">
                        <span className="text-lg font-bold leading-none">{booking.daysLeft}</span>
                        <span className="text-[10px] opacity-80">days</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-mono text-orange-200 opacity-80 mb-0.5">{customId}</p>
                        <p className="font-medium text-sm truncate uppercase tracking-tight">{booking.mediaId?.name || "Site N/A"}</p>
                        <p className="text-xs text-white/70 truncate">{customerName}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 shrink-0 items-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/40 text-white border-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Phone className="h-4 w-4" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 shadow-xl" align="end" side="top">
                          <div className="bg-muted/50 p-3 border-b flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">{contactPerson || "Contact Details"}</span>
                          </div>
                          <div className="p-3 space-y-3">
                            {phone && (
                              <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <Phone className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm font-medium truncate">{phone}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(phone, "Phone")}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <a href={`tel:${phone}`}>
                                     <Button size="icon" variant="ghost" className="h-7 w-7 text-success">
                                       <Phone className="h-3.5 w-3.5" />
                                     </Button>
                                  </a>
                                </div>
                              </div>
                            )}
                            
                            {email && (
                              <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <Mail className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-sm font-medium truncate">{email}</span>
                                </div>
                                <div className="flex gap-1">
                                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copyToClipboard(email, "Email")}>
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <a href={`mailto:${email}`}>
                                     <Button size="icon" variant="ghost" className="h-7 w-7 text-blue-500">
                                       <ArrowRight className="h-3.5 w-3.5" />
                                     </Button>
                                  </a>
                                </div>
                              </div>
                            )}

                            {!phone && !email && (
                              <div className="text-center text-sm text-muted-foreground py-2">
                                No contact details available.
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>

                       <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-white">
                         <ChevronRight className="h-5 w-5" />
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6 flex justify-center">
                <Button 
                    variant="outline" 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      setIsReportOpen(true); // Open the local detailed dialog
                    }}
                    className="w-full bg-white/5 border-white/20 text-white hover:bg-white/20 gap-2 py-6 rounded-xl font-medium"
                >
                    View All {expiringBookings.length} Expiring Campaigns <ArrowRight className="h-4 w-4" />
                </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* DETAILED REPORT POPUP */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle>Expiring Campaigns Report</DialogTitle>
                  <DialogDescription>
                    {expiringBookings.length} campaigns ending within the next 15 days.
                  </DialogDescription>
                </div>
              </div>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 p-6 pt-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px]">Booking ID</TableHead>
                  <TableHead>Client Details</TableHead>
                  <TableHead>Media Site</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead className="text-right">Days Left</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiringBookings.map((booking) => {
                  const customId = generateBookingId(booking, booking.originalIndex);
                  const client = booking.customerId;
                  return (
                    <TableRow key={booking._id} className="hover:bg-muted/50">
                      <TableCell className="font-mono text-xs font-medium text-primary">
                        {customId}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{client?.company || "Unknown"}</span>
                          <span className="text-xs text-muted-foreground">{client?.name}</span>
                          <span className="text-[10px] text-muted-foreground">{client?.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                           <span className="text-sm font-medium">{booking.mediaId?.name || "Site N/A"}</span>
                           <span className="text-xs text-muted-foreground">{booking.mediaId?.city}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex items-center gap-2 text-sm">
                           <Calendar className="h-3 w-3 text-muted-foreground" />
                           {booking.endDate ? format(new Date(booking.endDate), "dd MMM yyyy") : "N/A"}
                         </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={booking.daysLeft <= 5 ? "destructive" : "warning"}>
                          {booking.daysLeft} Days
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                           setIsReportOpen(false);
                           onViewBooking?.(booking);
                         }}>
                            <ChevronRight className="h-4 w-4" />
                         </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>

          <DialogFooter className="p-4 border-t bg-muted/20">
            <Button variant="outline" onClick={() => setIsReportOpen(false)}>Close Report</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}