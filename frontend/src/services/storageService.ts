import { supabase } from '../lib/supabase';

export interface UploadOptions {
  bucket: 'avatars' | 'product-images' | 'kyc-documents' | 'chat-media' | 'receipts';
  path: string;
  file: File;
  onProgress?: (progress: number) => void;
}

class StorageService {
  private static instance: StorageService;
  
  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  async uploadFile(options: UploadOptions): Promise<string> {
    const { bucket, path, file, onProgress } = options;
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${path}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    
    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        onUploadProgress: (progress) => {
          if (onProgress) {
            const percent = (progress.loaded / progress.total) * 100;
            onProgress(percent);
          }
        }
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);
    
    return publicUrl;
  }

  async deleteFile(url: string): Promise<void> {
    // Extract path from URL
    const path = url.split('/').pop();
    if (!path) return;
    
    const { error } = await supabase.storage
      .from('avatars')
      .remove([path]);
    
    if (error) throw error;
  }

  async compressImage(file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
      };
      reader.onerror = reject;
    });
  }

  async uploadMultipleFiles(
    bucket: UploadOptions['bucket'],
    path: string,
    files: File[]
  ): Promise<string[]> {
    const uploadPromises = files.map(async (file) => {
      const compressed = await this.compressImage(file);
      return this.uploadFile({ bucket, path, file: compressed });
    });
    
    return Promise.all(uploadPromises);
  }
}

export const storageService = StorageService.getInstance();
