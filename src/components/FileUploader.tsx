import React, { useState, useRef } from 'react';
import { UploadCloud, Loader2 } from 'lucide-react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

interface FileUploaderProps {
  onUploadComplete: (url: string) => void;
  onParsedText?: (text: string) => void;
  accept?: string;
  label?: string;
}

export function FileUploader({ onUploadComplete, onParsedText, accept = "video/mp4,application/pdf", label = "UPLOAD FILE" }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bytesInfo, setBytesInfo] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File) => {
    if (!onParsedText) return;
    try {
      const arrayBuffer = await file.arrayBuffer();
      // Dynamically load pdfjs-dist to prevent any bundler or loading-time exceptions
      const pdfjsLib = await import('pdfjs-dist');
      
      try {
        const workerUrl = new URL('pdfjs-dist/build/pdf.worker.mjs', import.meta.url).href;
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
      } catch (workerErr) {
        console.warn("Failed to dynamically configure PDF worker path, using default.", workerErr);
      }

      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str || '').join(' ');
        fullText += pageText + "\n";
      }
      onParsedText(fullText.substring(0, 50000));
    } catch (e) {
      console.error("PDF Parsing Error (ignoring so upload can complete):", e);
    }
  };

  const uploadToLocalServer = (file: File) => {
    const xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const p = (event.loaded / event.total) * 100;
        setProgress(p);
        setBytesInfo((event.loaded / (1024 * 1024)).toFixed(2) + " MB / " + (event.total / (1024 * 1024)).toFixed(2) + " MB");
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const res = JSON.parse(xhr.responseText);
          onUploadComplete(res.url);
        } catch (e) {
          console.error("[Upload] Failed to parse response", e);
          alert("Uploaded file processing success, but response parsing failed.");
        }
      } else {
        console.error("[Upload] Server error:", xhr.status, xhr.responseText);
        alert(`Upload failed: Server returned code ${xhr.status}`);
      }
      setIsUploading(false);
    });

    xhr.addEventListener('error', () => {
      console.error("[Upload] Network connection/CORS error.");
      alert("Network error occurred during the file upload. Please verify network connection.");
      setIsUploading(false);
    });

    xhr.open('POST', '/api/upload');
    xhr.send(formData);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Run PDF text extraction in background without blocking the core file upload
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith('.pdf')) {
      if (onParsedText) {
        extractPdfText(file).catch(err => {
          console.error("Background PDF extraction failed", err);
        });
      }
    }

    setIsUploading(true);
    setProgress(0);
    setBytesInfo("0 MB / " + (file.size / (1024 * 1024)).toFixed(2) + " MB");

    // Try uploading to Firebase Storage first for maximum accessibility inside sandbox iframes
    try {
      const uniqueFilename = `uploads/${Date.now()}_${Math.round(Math.random() * 1e9)}_${file.name}`;
      const storageRef = ref(storage, uniqueFilename);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
          setBytesInfo((snapshot.bytesTransferred / (1024 * 1024)).toFixed(2) + " MB / " + (snapshot.totalBytes / (1024 * 1024)).toFixed(2) + " MB");
        }, 
        async (error) => {
          console.warn("[Upload] Firebase Storage upload failed, falling back to local server upload:", error);
          uploadToLocalServer(file);
        }, 
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("[Upload] Firebase Storage upload succeeded:", downloadUrl);
            onUploadComplete(downloadUrl);
            setIsUploading(false);
          } catch (urlErr) {
            console.error("[Upload] Failed to get Firebase download URL, falling back:", urlErr);
            uploadToLocalServer(file);
          }
        }
      );
    } catch (fbErr) {
      console.warn("[Upload] Firebase Storage initialization error, falling back:", fbErr);
      uploadToLocalServer(file);
    }
  };

  return (
    <div className="w-full">
      <input 
        type="file" 
        accept={accept}
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      
      {!isUploading ? (
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center gap-2 w-full px-2 py-3 min-h-[44px] bg-surface border-2 border-dashed border-border hover:border-primary hover:text-primary transition-colors text-[10px] font-mono font-bold text-muted cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" /> {label}
        </button>
      ) : (
        <div className="flex flex-col items-center justify-center gap-2 w-full p-2 bg-surface text-[10px] font-mono text-muted border border-border">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> 
            UPLOADING {Math.round(progress)}%
          </div>
          <div className="font-mono text-[9px] opacity-70 border-b border-border/20 pb-1 w-full text-center">{bytesInfo}</div>
          <div className="w-full h-1 bg-border overflow-hidden">
            <div className="h-full bg-primary transition-all duration-200" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
}
