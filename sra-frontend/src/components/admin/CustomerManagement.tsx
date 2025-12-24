import { useState } from "react";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { type Customer } from "@/lib/data";

interface CustomerFormProps {
  customer?: Customer;
  onSave: (customer: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent'>) => void;
  onCancel: () => void;
}

function CustomerForm({ customer, onSave, onCancel }: CustomerFormProps) {
  const [name, setName] = useState(customer?.name || "");
  const [company, setCompany] = useState(customer?.company || "");
  const [email, setEmail] = useState(customer?.email || "");
  const [phone, setPhone] = useState(customer?.phone || "");
  const [address, setAddress] = useState(customer?.address || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !company || !email || !phone) {
      toast({
        title: "Missing fields",
        description: "Please fill all required fields",
        variant: "destructive",
      });
      return;
    }

    onSave({ name, company, email, phone, address });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Contact Name *</Label>
          <Input
            placeholder="Enter contact name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Company Name *</Label>
          <Input
            placeholder="Enter company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label>Phone *</Label>
          <Input
            placeholder="Enter phone number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input
          placeholder="Enter address"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {customer ? 'Update Customer' : 'Add Customer'}
        </Button>
      </div>
    </form>
  );
}

interface AddCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerAdded?: (customer: Customer) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerAdded }: AddCustomerDialogProps) {
  const handleSave = (customerData: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent'>) => {
    // Generate new ID
    const newId = `CUS-${String(Date.now()).slice(-6)}`;
    const newCustomer: Customer = {
      ...customerData,
      id: newId,
      totalBookings: 0,
      totalSpent: 0,
    };
    
    toast({
      title: "Customer Added",
      description: `${customerData.company} has been added successfully`,
    });
    
    onCustomerAdded?.(newCustomer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
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
}

export function EditCustomerDialog({ customer, open, onOpenChange, onCustomerUpdated }: EditCustomerDialogProps) {
  const handleSave = (customerData: Omit<Customer, 'id' | 'totalBookings' | 'totalSpent'>) => {
    const updatedCustomer: Customer = {
      ...customer,
      ...customerData,
    };
    
    toast({
      title: "Customer Updated",
      description: `${customerData.company} has been updated successfully`,
    });
    
    onCustomerUpdated?.(updatedCustomer);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Customer</DialogTitle>
        </DialogHeader>
        <CustomerForm
          customer={customer}
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface DeleteCustomerDialogProps {
  customer: Customer;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCustomerDeleted?: (customerId: string) => void;
}

export function DeleteCustomerDialog({ customer, open, onOpenChange, onCustomerDeleted }: DeleteCustomerDialogProps) {
  const handleDelete = () => {
    toast({
      title: "Customer Deleted",
      description: `${customer.company} has been removed`,
    });
    
    onCustomerDeleted?.(customer.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Customer</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-muted-foreground">
            Are you sure you want to delete <strong>{customer.company}</strong>? 
            This action cannot be undone.
          </p>
          {customer.totalBookings > 0 && (
            <p className="text-destructive text-sm mt-2">
              Warning: This customer has {customer.totalBookings} booking(s) on record.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}