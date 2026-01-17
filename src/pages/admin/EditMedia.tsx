/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { mediaTypes } from "@/lib/data";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { useMediaById, useUpdateMedia, useUploadMediaImage } from "@/hooks/api/useMedia";
import { isBackendConfigured } from "@/lib/api/config";
import { useLocationData } from "@/contexts/LocationDataContext";
import { MediaType } from "@/lib/api/types";

const EditMedia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // FIX: Initialization guard to prevent cascading resets
  const isPopulated = useRef(false);
  
  const { data: media, isLoading } = useMediaById(id || "");
  const updateMedia = useUpdateMedia();
  const uploadImage = useUploadMediaImage();
  
  const { states, getCitiesForDistrict, getDistrictsForState } = useLocationData();
  
  const [formData, setFormData] = useState({
    customId: '', 
    name: '',
    type: '',
    state: '',
    district: '',
    city: '', 
    address: '',
    size: '',
    lighting: '',
    facing: '',
    pricePerMonth: '',
    imageUrl: '', 
  });

  useEffect(() => {
    // Only populate form data if we have media and haven't populated yet
    if (media && !isPopulated.current) {
      setFormData({
        customId: (media.id || '').trim(),
        name: (media.name || '').trim(),
        type: media.type || '',
        state: (media.state || '').trim(),
        district: (media.district || '').trim(),
        city: (media.city || '').trim(),
        address: (media.address || '').trim(),
        size: (media.size || '').trim(),
        lighting: media.lighting || '',
        facing: (media.facing || '').trim(),
        pricePerMonth: String(media.pricePerMonth || ''),
        imageUrl: media.imageUrl || '', 
      });
      setPreviewUrl(media.imageUrl || null);
      isPopulated.current = true;
    }
  }, [media]);

  // Logic for cascading dropdowns
  const availableDistricts = getDistrictsForState(formData.state);
  const availableTehsils = getCitiesForDistrict(formData.district);

  const handleStateChange = (state: string) => {
    if (state !== formData.state) {
      setFormData(prev => ({ ...prev, state, district: '', city: '' }));
    }
  };

  const handleDistrictChange = (district: string) => {
    if (district !== formData.district) {
      setFormData(prev => ({ ...prev, district, city: '' }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const cleanCustomId = formData.customId.trim();
    const cleanDistrict = formData.district.trim();
    const cleanCity = formData.city.trim();

    if (!cleanDistrict || !cleanCity) {
      toast({
        title: "Location Required",
        description: "Please select a valid District and Town/Tehsil.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalImageUrl = formData.imageUrl || media?.imageUrl;

      if (selectedFile && isBackendConfigured()) {
        const uploadResponse: any = await uploadImage.mutateAsync({ 
          file: selectedFile, 
          customId: cleanCustomId,
          district: cleanDistrict
        });
        finalImageUrl = uploadResponse.url; 
      }

      if (isBackendConfigured() && media) {
        // Database Sync with TRIMMED data
        await updateMedia.mutateAsync({
          id: (media._id || id)!,
          data: {
            id: cleanCustomId,
            name: formData.name.trim(),
            type: formData.type as MediaType, // FIX: TypeScript cast to MediaType
            state: formData.state.trim(),
            district: cleanDistrict,
            city: cleanCity,
            address: formData.address.trim(),
            size: formData.size.trim(),
            lighting: formData.lighting as any,
            facing: formData.facing.trim(),
            pricePerMonth: Number(formData.pricePerMonth),
            imageUrl: finalImageUrl,
            landmark: cleanCustomId
          }
        });
      }

      toast({ title: "Media Updated Successfully" });
      navigate('/admin/media');
    } catch (error: any) {
      console.error("Update Error:", error);
      toast({
        title: "Update Failed",
        description: error.response?.data?.message || error.message, 
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold mb-1">Edit Media Location</h1>
          <p className="text-muted-foreground font-mono text-sm">Ref: {formData.customId}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="customId">Media ID *</Label>
                  <Input 
                    id="customId"
                    value={formData.customId}
                    onChange={(e) => setFormData({ ...formData, customId: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Media Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="type">Media Type *</Label>
                  <Select 
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      {mediaTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Managed Location Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <Label>State *</Label>
                  <Select value={formData.state} onValueChange={handleStateChange}>
                    <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
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
                    onValueChange={handleDistrictChange}
                    disabled={!formData.state}
                  >
                    <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                    <SelectContent>
                      {/* Safety: Add current value if not in list yet to prevent auto-deselect */}
                      {formData.district && !availableDistricts.includes(formData.district) && (
                        <SelectItem value={formData.district}>{formData.district}</SelectItem>
                      )}
                      {availableDistricts.map(district => (
                        <SelectItem key={district} value={district}>{district}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Town / Tehsil *</Label>
                  <Select 
                    value={formData.city} 
                    onValueChange={(v) => setFormData({ ...formData, city: v })}
                    disabled={!formData.district}
                  >
                    <SelectTrigger><SelectValue placeholder="Select Town/Tehsil" /></SelectTrigger>
                    <SelectContent>
                      {/* Safety: Add current city if not in the list to prevent auto-deselect */}
                      {formData.city && !availableTehsils.includes(formData.city) && (
                        <SelectItem value={formData.city}>{formData.city}</SelectItem>
                      )}
                      {availableTehsils.map(tehsil => (
                        <SelectItem key={tehsil} value={tehsil}>{tehsil}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <Label htmlFor="address">Full Address</Label>
                <Textarea 
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border/50">
              <h3 className="text-lg font-semibold mb-4">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
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
                    <SelectTrigger><SelectValue placeholder="Select lighting" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Front Lit">Front Lit</SelectItem>
                      <SelectItem value="Back Lit">Back Lit</SelectItem>
                      <SelectItem value="Non-Lit">Non-Lit</SelectItem>
                      <SelectItem value="Digital">Digital</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="facing">Facing Direction</Label>
                  <Input
                    id="facing"
                    value={formData.facing}
                    onChange={(e) => setFormData({ ...formData, facing: e.target.value })}
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-border/50">
              <h3 className="font-semibold mb-4">Media Photography</h3>
              <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 cursor-pointer group transition-colors">
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full aspect-video object-cover rounded mb-2" />
                ) : (
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground group-hover:text-primary" />
                )}
                <Input type="file" accept="image/*" onChange={handleFileChange} className="mt-2" />
              </div>
            </Card>

            <Card className="p-6 bg-card border-border/50">
              <h3 className="font-semibold mb-4">Financials</h3>
              <div className="space-y-2">
                <Label htmlFor="price">Monthly Rate (₹) *</Label>
                <Input
                  id="price"
                  type="number"
                  value={formData.pricePerMonth}
                  onChange={(e) => setFormData({ ...formData, pricePerMonth: e.target.value })}
                  required
                />
              </div>
            </Card>

            <div className="space-y-3">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4 mr-2" /> Update Media</>
                )}
              </Button>
              <Button type="button" variant="outline" className="w-full" onClick={() => navigate(-1)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EditMedia;