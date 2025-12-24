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
import { Textarea } from "@/components/ui/textarea";
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
import { useState } from "react";
import { mediaLocations, customers } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Plus, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreateBookingDialog() {
  const [open, setOpen] = useState(false);
  
  // States for the Searchable Dropdowns
  const [customerOpen, setCustomerOpen] = useState(false);
  const [mediaOpen, setMediaOpen] = useState(false);

  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    customerId: "",
    mediaId: "",
    startDate: "",
    endDate: "",
    amount: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId || !formData.mediaId || !formData.startDate || !formData.endDate) {
      toast({
        variant: "destructive",
        title: "Missing Fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    toast({
      title: "Booking Created",
      description: "The new booking has been successfully created.",
    });
    setOpen(false);
    
    // Reset form
    setFormData({
      customerId: "",
      mediaId: "",
      startDate: "",
      endDate: "",
      amount: "",
      description: "",
    });
  };

  const selectedMedia = mediaLocations.find(m => m.id === formData.mediaId);
  const selectedCustomer = customers.find(c => c.id === formData.customerId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Booking
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Booking</DialogTitle>
          <DialogDescription>
            Enter the details for the new media booking. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="grid gap-6 py-4">
          
          {/* 1. Customer Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer" className="text-right font-medium text-sm">
              Customer
            </Label>
            <div className="col-span-3">
              <Popover open={customerOpen} onOpenChange={setCustomerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={customerOpen}
                    className={cn(
                      "w-full justify-between font-normal text-left",
                      !selectedCustomer && "text-muted-foreground"
                    )}
                  >
                    {selectedCustomer ? (
                      <span className="truncate">
                        {selectedCustomer.company} <span className="text-muted-foreground ml-1">({selectedCustomer.name})</span>
                      </span>
                    ) : (
                      "Select customer..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search customer..." />
                    <CommandList>
                      <CommandEmpty>No customer found.</CommandEmpty>
                      <CommandGroup>
                        {customers.map((customer) => (
                          <CommandItem
                            key={customer.id}
                            value={customer.company + " " + customer.name}
                            onSelect={() => {
                              setFormData({ ...formData, customerId: customer.id });
                              setCustomerOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.customerId === customer.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{customer.company}</span>
                              <span className="text-xs text-muted-foreground">{customer.name}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 2. Media Selection */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="media" className="text-right font-medium text-sm">
              Media
            </Label>
            <div className="col-span-3">
              <Popover open={mediaOpen} onOpenChange={setMediaOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={mediaOpen}
                    className={cn(
                      "w-full justify-between font-normal text-left",
                      !selectedMedia && "text-muted-foreground"
                    )}
                  >
                    {selectedMedia ? (
                      <span className="truncate">
                        {selectedMedia.name} <span className="text-muted-foreground ml-1">({selectedMedia.id})</span>
                      </span>
                    ) : (
                      "Select media..."
                    )}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[340px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search media by name or ID..." />
                    <CommandList>
                      <CommandEmpty>No media found.</CommandEmpty>
                      <CommandGroup>
                        {mediaLocations.slice(0, 50).map((media) => (
                          <CommandItem
                            key={media.id}
                            value={media.name + " " + media.id}
                            onSelect={() => {
                              setFormData({ 
                                ...formData, 
                                mediaId: media.id,
                                amount: media.pricePerMonth.toString()
                              });
                              setMediaOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.mediaId === media.id ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{media.name}</span>
                              <span className="text-xs text-muted-foreground">{media.city} • {media.type}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* 3. Dates */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right font-medium text-sm pt-3">
              Duration
            </Label>
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-1">Start Date</span>
                <Input
                  id="start"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider ml-1">End Date</span>
                <Input
                  id="end"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* 4. Amount */}
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right font-medium text-sm">
              Amount (₹)
            </Label>
            <Input
              id="amount"
              type="number"
              className="col-span-3"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            />
          </div>

          {/* 5. Description (Optional) */}
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="description" className="text-right font-medium text-sm pt-3">
              Description
            </Label>
            <div className="col-span-3">
              <Textarea
                id="description"
                placeholder="Add campaign details (optional)"
                className="resize-none"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button type="submit" className="w-full sm:w-auto">Save Booking</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}