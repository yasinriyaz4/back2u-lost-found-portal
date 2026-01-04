import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useItem } from '@/hooks/useItems';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader } from '@/components/ui/loader';
import { Calendar, Upload, MapPin, ArrowLeft } from 'lucide-react';

const itemSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000),
  category: z.enum(['lost', 'found']),
  location: z.string().min(3, 'Location is required'),
  item_date: z.string().min(1, 'Date is required'),
  contact_number: z.string().optional(),
  status: z.enum(['active', 'claimed', 'resolved']),
});

type ItemFormData = z.infer<typeof itemSchema>;

const MAX_IMAGES = 5;

const EditItem = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { item, loading: itemLoading, error } = useItem(id);
  
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [existingUrls, setExistingUrls] = useState<string[]>([]);

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemSchema),
    defaultValues: {
      title: '',
      description: '',
      category: 'lost',
      location: '',
      item_date: '',
      contact_number: '',
      status: 'active',
    },
  });

  useEffect(() => {
    if (item) {
      form.reset({
        title: item.title,
        description: item.description,
        category: item.category,
        location: item.location,
        item_date: item.item_date,
        contact_number: item.contact_number || '',
        status: item.status,
      });
      // Handle both new image_urls array and legacy image_url
      const urls = (item as any).image_urls?.length > 0 
        ? (item as any).image_urls 
        : item.image_url 
          ? [item.image_url] 
          : [];
      setExistingUrls(urls);
    }
  }, [item, form]);

  // Check ownership
  if (item && user?.id !== item.user_id) {
    navigate('/dashboard');
    return null;
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const totalImages = existingUrls.length + imageFiles.length;
    const remainingSlots = MAX_IMAGES - totalImages;
    if (files.length > remainingSlots) {
      toast({
        title: 'Too many images',
        description: `You can only have ${MAX_IMAGES} images. ${remainingSlots} slot(s) remaining.`,
        variant: 'destructive',
      });
      return;
    }

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    for (const file of files) {
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: `${file.name}: Please upload JPG, JPEG, or PNG images only`,
          variant: 'destructive',
        });
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: `${file.name}: Must be smaller than 5MB`,
          variant: 'destructive',
        });
        continue;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    setImagePreviews(prev => [...prev, ...validPreviews]);
  };

  const removeExistingImage = (index: number) => {
    setExistingUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: ItemFormData) => {
    if (!user || !item) return;

    setLoading(true);
    try {
      // Upload new images
      const newImageUrls: string[] = [];
      for (const imageFile of imageFiles) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('item-images')
          .upload(fileName, imageFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('item-images')
          .getPublicUrl(fileName);

        newImageUrls.push(publicUrl);
      }

      // Combine existing and new image URLs
      const allImageUrls = [...existingUrls, ...newImageUrls];

      const { error } = await supabase
        .from('items')
        .update({
          title: data.title,
          description: data.description,
          category: data.category,
          location: data.location,
          item_date: data.item_date,
          contact_number: data.contact_number || null,
          status: data.status,
          image_url: allImageUrls[0] || null,
          image_urls: allImageUrls,
        })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: 'Item updated!',
        description: 'Your changes have been saved.',
      });

      navigate(`/items/${item.id}`);
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update item',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (itemLoading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container py-8 max-w-2xl">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Edit Item</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="lost">🔴 Lost</SelectItem>
                            <SelectItem value="found">🟢 Found</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="claimed">Claimed</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Item Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Black Leather Wallet" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Provide details about the item..."
                          className="min-h-32"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Where was it lost/found?" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="item_date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input type="date" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="contact_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Number (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Your phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Images (up to {MAX_IMAGES})</FormLabel>
                  <div className="mt-2 space-y-4">
                    {(existingUrls.length > 0 || imagePreviews.length > 0) && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {existingUrls.map((url, index) => (
                          <div key={`existing-${index}`} className="relative aspect-square">
                            <img 
                              src={url} 
                              alt={`Image ${index + 1}`} 
                              className="w-full h-full object-cover rounded-lg"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeExistingImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        {imagePreviews.map((preview, index) => (
                          <div key={`new-${index}`} className="relative aspect-square">
                            <img 
                              src={preview} 
                              alt={`New ${index + 1}`} 
                              className="w-full h-full object-cover rounded-lg border-2 border-primary"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              className="absolute top-1 right-1 h-6 w-6"
                              onClick={() => removeNewImage(index)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {(existingUrls.length + imageFiles.length) < MAX_IMAGES && (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                        <div className="flex flex-col items-center justify-center py-4">
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Click to upload images
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 5MB ({existingUrls.length + imageFiles.length}/{MAX_IMAGES})
                          </p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg"
                          multiple
                          onChange={handleImageChange}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader size="sm" className="mr-2" /> : null}
                  Save Changes
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EditItem;
