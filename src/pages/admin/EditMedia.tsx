/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { mediaTypes, states } from "@/lib/data";
import { ArrowLeft, Save, Upload, Loader2 } from "lucide-react";
import { useMediaById, useUpdateMedia, useUploadMediaImage } from "@/hooks/api/useMedia";
import { isBackendConfigured } from "@/lib/api/config";
import { useLocationData } from "@/contexts/LocationDataContext";

const EditMedia = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const { data: media, isLoading } = useMediaById(id || "");
  const updateMedia = useUpdateMedia();
  const uploadImage = useUploadMediaImage();
  const { getCitiesForDistrict, getDistrictsForState } = useLocationData();
  
  const [formData, setFormData] = useState({
    id: '', 
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
  });

  // Populate form with existing data once loaded
  useEffect(() => {
    if (media) {
      setFormData({
        id: media.landmark || '', 
        name: media.name,
        type: media.type,
        state: media.state,
        district: media.district,
        city: media.city,
        address: media.address || '',
        size: media.size || '',
        lighting: media.lighting || '',
        facing: media.facing || '',
        pricePerMonth: String(media.pricePerMonth),
      });
      setPreviewUrl(media.image || null);
    }
  }, [media]);

  const availableDistricts = getDistrictsForState(formData.state);
  const availableCities = getCitiesForDistrict(formData.district);

  if (isLoading) return <div className="flex items-center justify-center h-96"><Loader2 className="animate-spin" /></div>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let permanentImageUrl = previewUrl;

      if (selectedFile && isBackendConfigured()) {
        const uploadResponse: any = await uploadImage.mutateAsync({ file: selectedFile, folder: 'media' });
        permanentImageUrl = uploadResponse.url; 
      }

      if (isBackendConfigured() && id) {
        await updateMedia.mutateAsync({
          id,
          data: {
            name: formData.name,
            type: formData.type as any,
            state: formData.state,
            district: formData.district,
            city: formData.city,
            address: formData.address,
            size: formData.size,
            lighting: formData.lighting as any,
            facing: formData.facing,
            pricePerMonth: Number(formData.pricePerMonth),
            image: permanentImageUrl || undefined,
            landmark: formData.id
          }
        });
      }

      toast({ title: "Updated Successfully" });
      navigate('/admin/media');
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-2xl font-bold">Edit Billboard: {formData.name}</h1>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Reuse the exact same layout JSX as AddMedia.tsx */}
        {/* ... Card Content ... */}
      </form>
    </div>
  );
};

export default EditMedia;