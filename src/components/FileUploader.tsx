import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { UploadCloud, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';

// Configure the worker explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

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
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map((item: any) => item.str || '').join(' ');
        fullText += pageText + "\n";
      }
      onParsedText(fullText.substring(0, 50000)); // Limit length to avoid massive strings
    } catch (e) {
      console.error("PDF Parsing Error", e);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      await extractPdfText(file);
    }

    setIsUploading(true);
    setProgress(0);
    setBytesInfo("0 MB / " + (file.size / (1024 * 1024)).toFixed(2) + " MB");

    const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(p);
        setBytesInfo((snapshot.bytesTransferred / (1024 * 1024)).toFixed(2) + " MB / " + (snapshot.totalBytes / (1024 * 1024)).toFixed(2) + " MB");
      },
      (error) => {
        console.error("Upload failed", error);
        alert(`Upload failed: ${error.message} - it might be due to security rules or network issue.`);
        setIsUploading(false);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          onUploadComplete(downloadURL);
          setIsUploading(false);
        });
      }
    );
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
