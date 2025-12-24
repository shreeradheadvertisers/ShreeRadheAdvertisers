import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { states, districts, mediaTypes } from "@/lib/data";
import { ArrowLeft, Save, Upload } from "lucide-react";

const AddMedia = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    state: '',
    district: '',
    city: '',
    address: '',
    size: '',
    lighting: '',
    facing: '', // This will now accept free text
    traffic: '',
    pricePerMonth: '',
  });

  const availableDistricts = formData.state ? districts[formData.state] || [] : [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Media Added Successfully!",
      description: "The new media location has been added to the system.",
    });
    navigate('/admin/media');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Add New Media</h1>
          <p className="text-muted-foreground">Create a new outdoor advertising location</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="name">Media Name *</Label>
                  <Input 
                    id="name"
                    placeholder="e.g., Bandra Unipole 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Media Type *</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {mediaTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Location */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select 
                    value={formData.state}
                    onValueChange={(v) => setFormData({ ...formData, state: v, district: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {states.map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>District *</Label>
                  <Select 
                    value={formData.district}
                    onValueChange={(v) => setFormData({ ...formData, district: v })}
                    disabled={!formData.state}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select district" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input 
                    id="city"
                    placeholder="City name"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Textarea 
                  id="address"
                  placeholder="Enter complete address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </Card>

            {/* Specifications */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="size">Size *</Label>
                  <Input 
                    id="size"
                    placeholder="e.g., 40x20 ft"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lighting</Label>
                  <Select 
                    value={formData.lighting}
                    onValueChange={(v) => setFormData({ ...formData, lighting: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select lighting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Lit">Front Lit</SelectItem>
                      <SelectItem value="Back Lit">Back Lit</SelectItem>
                      <SelectItem value="Non-Lit">Non-Lit</SelectItem>
                      <SelectItem value="Digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="facing">Facing Direction</Label>
                  <Input 
                    id="facing"
                    placeholder="e.g., From Mumbai towards Pune"
                    value={formData.facing}
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Image Upload */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="font-semibold mb-4">Media Image</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer">
                <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">Click to upload</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
              </div>
            </Card>

            {/* Pricing */}
            <Card className="p-6 bg-card border-border/50">
              <h3 className="font-semibold mb-4">Pricing</h3>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rate (₹) *</Label>
                <Input 
                  id="price"
                  type="number"
                  placeholder="e.g., 100000"
                  value={formData.pricePerMonth}
                  onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                />
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6 bg-card border-border/50">
              <div className="space-y-3">
                <Button type="submit" className="w-full">
                  <Save className="h-4 w-4 mr-2" />
                  Save Media
                </Button>
                <Button type="button" variant="outline" className="w-full" onClick={() => navigate(-1)}>
                  Cancel
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddMedia;