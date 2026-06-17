'use client';

import React, { useState, useCallback } from 'react';
import { Upload, X, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';

interface FileWithProgress {
  file: File;
  id: string;
  photoId?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
  preview: string;
}

interface UploadZoneProps {
  galleryId: string;
  onComplete?: (photoIds: string[]) => void;
}

const POLL_INTERVAL_MS = 2000;
const POLL_TIMEOUT_MS = 90_000;

export const UploadZone: React.FC<UploadZoneProps> = ({ galleryId, onComplete }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState<FileWithProgress[]>([]);

  const handleFiles = useCallback(async (files: FileList) => {
    const newUploads: FileWithProgress[] = Array.from(files).map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending' as const,
      preview: URL.createObjectURL(file)
    }));

    setUploads(prev => [...prev, ...newUploads]);

    const markError = (ids: string[], message: string) => {
      setUploads(prev => prev.map(u =>
        ids.includes(u.id) ? { ...u, status: 'error', error: message } : u
      ));
    };

    // Request presigned URLs from server
    let uploadUrls: { url: string; photoId: string; key: string }[];
    try {
      const response = await fetch('/api/upload-urls', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gallery_id: galleryId,
          files: newUploads.map(u => ({
            filename: u.file.name,
            content_type: u.file.type,
            size: u.file.size,
          })),
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body.error || `Failed to get upload URLs (${response.status})`);
      }
      ({ uploadUrls } = await response.json());
    } catch (err) {
      markError(newUploads.map(u => u.id), err instanceof Error ? err.message : 'Upload failed');
      return;
    }

    // Upload each file to S3 via presigned URL
    const pendingPhotoIds: string[] = [];
    for (let i = 0; i < newUploads.length; i++) {
      const upload = newUploads[i];
      const { url, photoId } = uploadUrls[i];

      setUploads(prev => prev.map(u =>
        u.id === upload.id ? { ...u, status: 'uploading', photoId } : u
      ));

      try {
        await uploadToS3(url, upload.file, (progress) => {
          setUploads(prev => prev.map(u =>
            u.id === upload.id ? { ...u, progress } : u
          ));
        });

        // Notify server that upload is complete (enqueues processing)
        const res = await fetch('/api/upload-complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photoId }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || 'Failed to start processing');
        }

        pendingPhotoIds.push(photoId);
        setUploads(prev => prev.map(u =>
          u.id === upload.id ? { ...u, progress: 100, status: 'processing' } : u
        ));
      } catch (err) {
        markError([upload.id], err instanceof Error ? err.message : 'Upload failed');
      }
    }

    if (pendingPhotoIds.length === 0) return;

    // Poll until the worker has processed every photo (or timeout)
    const supabase = createClient();
    const deadline = Date.now() + POLL_TIMEOUT_MS;
    const remaining = new Set(pendingPhotoIds);

    while (remaining.size > 0 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, POLL_INTERVAL_MS));
      const { data } = await supabase
        .from('photos')
        .select('id, status')
        .in('id', Array.from(remaining));

      for (const photo of data || []) {
        if (photo.status === 'ready') {
          remaining.delete(photo.id);
          setUploads(prev => prev.map(u =>
            u.photoId === photo.id ? { ...u, status: 'complete' } : u
          ));
        } else if (photo.status === 'failed') {
          remaining.delete(photo.id);
          setUploads(prev => prev.map(u =>
            u.photoId === photo.id ? { ...u, status: 'error', error: 'Processing failed' } : u
          ));
        }
      }
    }

    if (remaining.size > 0) {
      setUploads(prev => prev.map(u =>
        u.photoId && remaining.has(u.photoId)
          ? { ...u, status: 'error', error: 'Processing timed out — check the worker' }
          : u
      ));
    }

    onComplete?.(pendingPhotoIds);
  }, [galleryId, onComplete]);

  const removeUpload = (id: string) => {
    setUploads(prev => prev.filter(u => u.id !== id));
  };

  return (
    <div className="space-y-6">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          isDragging ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <Upload className="text-gray-400" size={32} />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Drag and drop your photos</h3>
          <p className="text-gray-500 text-sm mt-1">High resolution JPEGs or PNGs supported</p>
        </div>
      </div>

      <AnimatePresence>
        {uploads.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploads.map((upload) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={upload.id}
                className="p-3 bg-white border border-gray-100 rounded-xl flex items-center gap-4 group"
              >
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                  <img src={upload.preview} alt="" className="w-full h-full object-cover" />
                  {upload.status !== 'complete' && upload.status !== 'error' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="text-[10px] text-white font-bold">{Math.round(upload.progress)}%</div>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{upload.file.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {upload.status === 'uploading' && <span className="text-[10px] uppercase tracking-wider text-blue-500 font-bold">Uploading</span>}
                    {upload.status === 'processing' && (
                      <div className="flex items-center gap-1">
                        <Loader2 size={10} className="animate-spin text-orange-500" />
                        <span className="text-[10px] uppercase tracking-wider text-orange-500 font-bold">Processing</span>
                      </div>
                    )}
                    {upload.status === 'complete' && (
                      <div className="flex items-center gap-1 text-green-500">
                        <CheckCircle2 size={10} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">Ready</span>
                      </div>
                    )}
                    {upload.status === 'error' && (
                      <div className="flex items-center gap-1 text-red-500" title={upload.error}>
                        <AlertCircle size={10} />
                        <span className="text-[10px] uppercase tracking-wider font-bold">{upload.error || 'Failed'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => removeUpload(upload.id)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

async function uploadToS3(
  url: string,
  file: File,
  onProgress: (progress: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    xhr.setRequestHeader('Content-Type', file.type);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error('Upload failed'));
    xhr.send(file);
  });
}
