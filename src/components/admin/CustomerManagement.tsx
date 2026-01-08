/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Plus, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { type Customer, customerGroups as defaultGroups } from "@/lib/data";
// Import the specific CustomerGroup type from your API definitions
import { type CustomerGroup } from "@/lib/api/types"; 
import { useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from "@/hooks/api/useCustomers";
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
import { cn } from "@/lib/utils";

// Define the shape of the form data using the CustomerGroup union type
type CustomerFormData = Omit<Customer, 'id' | 'totalBookings' | 'totalSpent'> & {
  group: CustomerGroup;
};

interface CustomerFormProps {
  customer?: Customer;
  availableGroups?: string[];
  onSave: (customer: CustomerFormData) => void;
  onCancel: () => void;
  onAddGroup?: (newGroup: string) => void;
  isLoading?: boolean;
}

function CustomerForm({ customer, onSave, onCancel, availableGroups = defaultGroups, onAddGroup, isLoading }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");
  // Initialize group state with the CustomerGroup type
  const [group, setGroup] = useState<CustomerGroup>((customer?.group as CustomerGroup) || "" as CustomerGroup);
  
  const [openGroup, setOpenGroup] = useState(false);
  const [groupSearch, setGroupSearch] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !company || !email || !phone || !group) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields, including Group.",
        variant: "destructive",
      });
      return;
    }
    onSave({ name, company, email, phone, address, group });
  };

  const handleCreateGroup = () => {
    if (groupSearch && !availableGroups.includes(groupSearch)) {
      if (onAddGroup) {
        onAddGroup(groupSearch);
      }
      // Cast the search string as CustomerGroup to satisfy type requirements
      setGroup(groupSearch as CustomerGroup);
      setOpenGroup(false);
      toast({ description: `Created new group: ${groupSearch}` });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Name *</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="Company" disabled={isLoading} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Customer Group *</Label>
        <Popover open={openGroup} onOpenChange={setOpenGroup}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              role="combobox" 
              aria-expanded={openGroup} 
              className="w-full justify-between font-normal"
              disabled={isLoading}
            >
              {group || "Select group..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-0" align="start">
            <Command>
              <CommandInput placeholder="Search or create group..." value={groupSearch} onValueChange={setGroupSearch} />
              <CommandList>
                <CommandEmpty>
                   <div className="p-2">
                     <p className="text-sm text-muted-foreground mb-2">No group found.</p>
                     <Button size="sm" variant="secondary" className="w-full h-8 text-xs" onClick={handleCreateGroup} type="button">
                       <Plus className="h-3 w-3 mr-1" /> Create "{groupSearch}"
                     </Button>
                   </div>
                </CommandEmpty>
                <CommandGroup heading="Groups">
                  {availableGroups.map((g) => (
                    <CommandItem 
                      key={g} 
                      value={g} 
                      onSelect={(val) => { 
                        // Cast the selection as CustomerGroup
                        setGroup(val as CustomerGroup); 
                        setOpenGroup(false); 
                      }}
                    >
                      <Check className={cn("mr-2 h-4 w-4", group === g ? "opacity-100" : "opacity-0")} />
                      {g}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" disabled={isLoading} />
        </div>
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" disabled={isLoading} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" disabled={isLoading} />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>Cancel</Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {customer ? 'Update' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

// --- Wrapper Components with API Integration ---

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded?: (customer: Customer) => void;
  availableGroups: string[];
  onAddGroup: (g: string) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded, availableGroups, onAddGroup }: AddCustomerDialogProps) {
  const createMutation = useCreateCustomer();

  const handleSave = async (data: CustomerFormData) => {
    try {
      // Data now matches CreateCustomerRequest exactly
      const result = await createMutation.mutateAsync(data);
      toast({ title: "Customer Added", description: `${data.company} added to database.` });
      onCustomerAdded?.(result as any);
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to add customer. Check if API is running.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Add Customer</DialogTitle></DialogHeader>
        <CustomerForm 
          onSave={handleSave} 
          onCancel={() => onOpenChange(false)} 
          availableGroups={availableGroups} 
          onAddGroup={onAddGroup} 
          isLoading={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerUpdated?: (customer: Customer) => void;
  availableGroups: string[];
  onAddGroup: (g: string) => void;
}

export function EditCustomerDialog({ customer, open, onOpenChange, onCustomerUpdated, availableGroups, onAddGroup }: EditCustomerDialogProps) {
  const updateMutation = useUpdateCustomer();

  const handleSave = async (data: CustomerFormData) => {
    try {
      const result = await updateMutation.mutateAsync({ id: customer.id, data });
      toast({ title: "Customer Updated" });
      onCustomerUpdated?.(result as any);
      onOpenChange(false);
    } catch (error) {
      toast({ 
        title: "Update Failed", 
        description: "Could not save changes to backend.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
        <CustomerForm 
          customer={customer} 
          onSave={handleSave} 
          onCancel={() => onOpenChange(false)} 
          availableGroups={availableGroups} 
          onAddGroup={onAddGroup} 
          isLoading={updateMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerDeleted: (id: string) => void;
}

export function DeleteCustomerDialog({ customer, open, onOpenChange, onCustomerDeleted }: DeleteCustomerDialogProps) {
  const deleteMutation = useDeleteCustomer();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(customer.id);
      onCustomerDeleted?.(customer.id);
      onOpenChange(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete customer.", variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Delete Customer</DialogTitle></DialogHeader>
        <div className="py-4"><p>Are you sure you want to delete <strong>{customer.company}</strong>?</p></div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteMutation.isPending}>Cancel</Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}