/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useCustomers } from "@/hooks/api/useCustomers";
import { useMedia } from "@/hooks/api/useMedia";
import { useCreateBooking, useBookings } from "@/hooks/api/useBookings"; 
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Check,
  ChevronsUpDown,
  Trash2,
  CalendarPlus,
  Loader2,
  ListPlus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { format, isAfter, isBefore, startOfDay, areIntervalsOverlapping } from "date-fns";

const getId = (obj: any) => obj?._id || obj?.id || "";

interface BookingItem {
  tempId: string;
  mediaId: string;
  mediaName: string;
  mediaType: string;
  startDate: string; 
  endDate: string;   
  amount: string;
  status: string;
  paymentStatus: string;
}

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const { data: customerRes } = useCustomers();
  const { data: mediaRes } = useMedia({ limit: 5000 } as any);
  const { data: existingBookingsRes } = useBookings({ limit: 2000 } as any); 
  
  const createBookingMutation = useCreateBooking();

  // --- FIX: Wrap data extraction in useMemo to prevent unstable dependencies ---
  const customers = useMemo(() => customerRes?.data || [], [customerRes?.data]);
  const mediaLocations = useMemo(() => mediaRes?.data || [], [mediaRes?.data]);
  const existingBookings = useMemo(() => existingBookingsRes?.data || [], [existingBookingsRes?.data]);
  // ---------------------------------------------------------------------------

  const [customerId, setCustomerId] = useState("");
  const [bookingQueue, setBookingQueue] = useState<BookingItem[]>([]);
  
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  const [customerSearch, setCustomerSearch] = useState("");
  const [mediaSearch, setMediaSearch] = useState("");

  const [currentItem, setCurrentItem] = useState({
    mediaId: "",
    startDate: "",
    endDate: "",
    amount: "",
    paymentStatus: "Pending",
  });

  const selectedCustomer = customers.find((c: any) => getId(c) === customerId);
  const currentMedia = mediaLocations.find((m: any) => getId(m) === currentItem.mediaId);

  // Optimized Filtering
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 50);
    const searchLower = customerSearch.toLowerCase();
    return customers.filter((c: any) => 
      c.name.toLowerCase().includes(searchLower) || 
      c.company?.toLowerCase().includes(searchLower)
    ).slice(0, 50);
  }, [customers, customerSearch]);

  const filteredMedia = useMemo(() => {
    if (!mediaSearch) return mediaLocations.slice(0, 50);
    const searchLower = mediaSearch.toLowerCase();
    return mediaLocations.filter((m: any) => 
      m.name.toLowerCase().includes(searchLower) || 
      m.city?.toLowerCase().includes(searchLower) ||
      m.type?.toLowerCase().includes(searchLower)
    ).slice(0, 50);
  }, [mediaLocations, mediaSearch]);

  const resetCurrentItem = () => {
    setCurrentItem({
      mediaId: "",
      startDate: "",
      endDate: "",
      amount: "",
      paymentStatus: "Pending",
    });
  };

  const calculateStatus = (start: string, end: string) => {
    if (!start || !end) return "Upcoming";
    const today = startOfDay(new Date());
    const startDate = startOfDay(new Date(start));
    const endDate = startOfDay(new Date(end));

    if (isAfter(startDate, today)) return "Upcoming";
    if (isBefore(endDate, today)) return "Completed";
    return "Active";
  };

  const checkConflicts = () => {
    if (!currentItem.mediaId || !currentItem.startDate || !currentItem.endDate) return null;

    const newStart = new Date(currentItem.startDate);
    const newEnd = new Date(currentItem.endDate);
    const targetMediaId = currentItem.mediaId;

    const dbConflict = existingBookings.find((b: any) => {
      if (getId(b.mediaId) !== targetMediaId) return false;
      if (b.status === 'Cancelled') return false;
      if (b.deleted === true) return false;
      return areIntervalsOverlapping(
        { start: newStart, end: newEnd },
        { start: new Date(b.startDate), end: new Date(b.endDate) },
        { inclusive: true }
      );
    });

    if (dbConflict) return "Already booked by another client for these dates.";

    const queueConflict = bookingQueue.find((item) => {
      if (item.mediaId !== targetMediaId) return false;
      return areIntervalsOverlapping(
        { start: newStart, end: newEnd },
        { start: new Date(item.startDate), end: new Date(item.endDate) },
        { inclusive: true }
      );
    });

    if (queueConflict) return "Already in your current queue.";

    return null;
  };

  const handleAddItem = () => {
    if (!currentItem.mediaId || !currentItem.startDate || !currentItem.endDate || !currentItem.amount) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill all fields." });
      return;
    }

    if (new Date(currentItem.startDate) > new Date(currentItem.endDate)) {
        toast({ variant: "destructive", title: "Invalid Dates", description: "Start Date cannot be after End Date." });
        return;
    }

    const conflictMsg = checkConflicts();
    if (conflictMsg) {
      toast({ variant: "destructive", title: "Unavailable", description: conflictMsg });
      return;
    }

    const media = mediaLocations.find((m: any) => getId(m) === currentItem.mediaId);
    if (!media) return;

    const autoStatus = calculateStatus(currentItem.startDate, currentItem.endDate);

    const newItem: BookingItem = {
      tempId: Math.random().toString(36).substring(7),
      mediaId: getId(media),
      mediaName: media.name,
      mediaType: media.type,
      startDate: currentItem.startDate,
      endDate: currentItem.endDate,
      amount: currentItem.amount,
      status: autoStatus,
      paymentStatus: currentItem.paymentStatus,
    };

    setBookingQueue([...bookingQueue, newItem]);
    resetCurrentItem();
  };

  const handleRemoveItem = (id: string) => {
    setBookingQueue((prev) => prev.filter((item) => item.tempId !== id));
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!customerId) {
      toast({ variant: "destructive", title: "Error", description: "Select a customer first." });
      return;
    }

    try {
      for (const item of bookingQueue) {
        // Logic to determine paid amount
        const paidAmount = item.paymentStatus === 'Paid' ? Number(item.amount) : 0;

        const payload = {
          customerId: customerId,
          mediaId: item.mediaId,
          customer: customerId,
          media: item.mediaId,
          startDate: new Date(item.startDate).toISOString(),
          endDate: new Date(item.endDate).toISOString(),
          amount: Number(item.amount),
          amountPaid: paidAmount, 
          status: item.status, 
          paymentStatus: item.paymentStatus,
        } as any;

        await createBookingMutation.mutateAsync(payload);
      }

      toast({ title: "Success", description: `Bookings created successfully.` });
      setBookingQueue([]);
      setCustomerId("");
      resetCurrentItem();
      setOpen(false);

    } catch (error: any) {
      console.error("❌ API Error:", error.response?.data || error);
      toast({
        variant: "destructive",
        title: "Booking Failed",
        description: error?.response?.data?.message || "Check console for details.",
      });
    }
  };

  const displayStatus = (s: string) => s === "Upcoming" ? "Confirmed" : s;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Create Booking
        </Button>
      </DialogTrigger>
      
      <DialogContent 
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto flex flex-col"
        aria-describedby="booking-desc"
      >
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription id="booking-desc">
            Bookings are automatically set to "Active" or "Confirmed" based on dates.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex flex-col gap-2">
            <Label>Customer</Label>
            <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className={cn("w-full justify-between font-normal", !customerId && "text-muted-foreground")}>
                  {selectedCustomer ? `${selectedCustomer.company} (${selectedCustomer.name})` : "Select customer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search customer..." 
                    value={customerSearch}
                    onValueChange={setCustomerSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No customer found.</CommandEmpty>
                    <CommandGroup>
                      {filteredCustomers.map((c: any) => {
                        const id = getId(c);
                        return (
                          <CommandItem key={id} value={`${c.company} ${c.name} ${id}`} onSelect={() => { setCustomerId(id); setCustomerOpen(false); }}>
                            <Check className={cn("mr-2 h-4 w-4", customerId === id ? "opacity-100" : "opacity-0")} />
                            {c.company} — {c.name}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          <div className="bg-muted/30 p-4 rounded-lg border border-dashed space-y-4 shadow-sm relative">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                    <CalendarPlus className="h-4 w-4" /> Add Item
                </div>
                {currentItem.startDate && currentItem.endDate && (
                    <Badge variant="secondary" className="text-xs">
                       Will be: {displayStatus(calculateStatus(currentItem.startDate, currentItem.endDate))}
                    </Badge>
                )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label className="text-xs text-muted-foreground uppercase">Media Location</Label>
                <Popover open={mediaOpen} onOpenChange={setMediaOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" role="combobox" className="w-full justify-between font-normal bg-background mt-1">
                      {currentMedia ? currentMedia.name : "Search media..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search media..." 
                        value={mediaSearch}
                        onValueChange={setMediaSearch}
                      />
                      <CommandList>
                        <CommandGroup>
                          {filteredMedia.length > 0 ? (
                            filteredMedia.map((m: any) => {
                              const id = getId(m);
                              return (
                                <CommandItem key={id} value={`${m.name} ${id}`} onSelect={() => {
                                  setCurrentItem({ ...currentItem, mediaId: id, amount: m.pricePerMonth?.toString() || "" });
                                  setMediaOpen(false);
                                }}>
                                  <Check className={cn("mr-2 h-4 w-4", currentItem.mediaId === id ? "opacity-100" : "opacity-0")} />
                                  <div><div className="font-medium">{m.name}</div><div className="text-xs text-muted-foreground">{m.city} • {m.type}</div></div>
                                </CommandItem>
                              );
                            })
                          ) : (
                             <div className="py-6 text-center text-sm text-muted-foreground">No media found.</div>
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground uppercase">Start Date</Label>
                <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background mt-1",
                        !currentItem.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentItem.startDate ? format(new Date(currentItem.startDate), "dd/MM/yyyy") : "DD/MM/YYYY"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentItem.startDate ? new Date(currentItem.startDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentItem({ ...currentItem, startDate: format(date, "yyyy-MM-dd") });
                          setStartDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex flex-col gap-1">
                <Label className="text-xs text-muted-foreground uppercase">End Date</Label>
                <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-background mt-1",
                        !currentItem.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {currentItem.endDate ? format(new Date(currentItem.endDate), "dd/MM/yyyy") : "DD/MM/YYYY"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={currentItem.endDate ? new Date(currentItem.endDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setCurrentItem({ ...currentItem, endDate: format(date, "yyyy-MM-dd") });
                          setEndDateOpen(false);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase">Payment Status</Label>
                <Select value={currentItem.paymentStatus} onValueChange={(val) => setCurrentItem({...currentItem, paymentStatus: val})}>
                  <SelectTrigger className="mt-1 bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Partially Paid">Partially Paid</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground uppercase">Amount (₹)</Label>
                <Input type="number" className="mt-1 bg-background" value={currentItem.amount} onChange={(e) => setCurrentItem({ ...currentItem, amount: e.target.value })} />
              </div>

              <div className="md:col-span-2 pt-2">
                <Button type="button" className="w-full bg-primary/90 hover:bg-primary" onClick={handleAddItem}>
                  <ListPlus className="mr-2 h-4 w-4" /> Add to Queue
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Booking Queue ({bookingQueue.length})</Label>
            {bookingQueue.length > 0 && (
              <div className="border rounded-md overflow-hidden max-h-[200px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-xs uppercase font-medium text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left">Media</th>
                      <th className="px-3 py-2 text-left">Period</th>
                      <th className="px-3 py-2 text-center">Status</th>
                      <th className="px-3 py-2 text-right">Amount</th>
                      <th className="px-3 py-2 w-[50px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookingQueue.map((item) => (
                      <tr key={item.tempId} className="bg-card hover:bg-muted/50">
                        <td className="px-3 py-2 font-medium">{item.mediaName}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">
                          <div>{format(new Date(item.startDate), 'dd/MM/yyyy')}</div>
                          <div className="opacity-50 text-[10px]">to</div>
                          <div>{format(new Date(item.endDate), 'dd/MM/yyyy')}</div>
                        </td>
                        <td className="px-3 py-2 text-center text-xs">
                           <Badge variant={item.status === 'Active' ? 'default' : 'outline'} className="mr-1 mb-1">
                              {displayStatus(item.status)}
                           </Badge>
                           <div className="text-muted-foreground text-[10px]">{item.paymentStatus}</div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">₹{Number(item.amount).toLocaleString()}</td>
                        <td className="px-3 py-2 text-center"><Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.tempId)}><Trash2 className="h-4 w-4 text-destructive" /></Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={bookingQueue.length === 0 || createBookingMutation.isPending}>
            {createBookingMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Confirm Bookings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}