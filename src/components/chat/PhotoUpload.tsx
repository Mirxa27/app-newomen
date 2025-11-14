import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Image as ImageIcon, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/db/supabase';

interface PhotoUploadProps {
  onPhotoUploaded: (url: string) => void;
  disabled?: boolean;
}

export function PhotoUpload({ onPhotoUploaded, disabled }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      toast.error('Image must be smaller than 1MB');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `chat-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('newomen-photos')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('newomen-photos')
        .getPublicUrl(filePath);

      onPhotoUploaded(publicUrl);
      toast.success('Photo uploaded successfully');
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      setPreview(null);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="relative">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || uploading}
      />
      
      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-lg object-cover border-2 border-primary"
          />
          <Button
            size="icon"
            variant="destructive"
            className="absolute -top-2 -right-2 h-7 w-7 sm:h-6 sm:w-6 rounded-full touch-manipulation"
            onClick={handleClearPreview}
            aria-label="Remove photo"
          >
            <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
          </Button>
        </div>
      ) : (
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          size="icon"
          variant="outline"
          className="h-[52px] w-[52px] sm:h-10 sm:w-10 touch-manipulation"
          aria-label="Upload photo"
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          ) : (
            <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
          )}
        </Button>
      )}
    </div>
  );
}
