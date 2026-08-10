import React, { useState, useEffect, useRef } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, ExternalLink, RefreshCw } from 'lucide-react';
import { FileUploader } from './FileUploader';

// Configure PDFJS worker path explicitly for Vite
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

interface PdfCanvasViewerProps {
  url: string;
  onReupload?: (newUrl: string) => void;
}

export function PdfCanvasViewer({ url, onReupload }: PdfCanvasViewerProps) {
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderTaskRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setCurrentPage(1);

    const loadPdf = async () => {
      try {
        let pdfData: Uint8Array | null = null;
        
        // Proxy URL to bypass CORS/sandbox restrictions
        const proxyUrl = `/api/download?url=${encodeURIComponent(url)}`;
        
        try {
          // Fetch from same-origin proxy
          const response = await fetch(proxyUrl);
          const contentType = response.headers.get('content-type') || '';
          
          if (response.status === 404) {
            throw new Error("FILE_NOT_FOUND");
          }

          if (contentType.includes('text/html') || response.status === 401 || response.status === 403) {
            throw new Error("AUTHENTICATION_REQUIRED");
          }
          
          if (response.ok) {
            const arrayBuffer = await response.arrayBuffer();
            pdfData = new Uint8Array(arrayBuffer);
          } else {
            throw new Error(`Proxy returned status ${response.status}`);
          }
        } catch (fetchErr: any) {
          if (fetchErr.message === "FILE_NOT_FOUND") {
            throw new Error("PDF file not found (404). This temporary upload file is no longer available on the server. Please re-upload your PDF file in Edit mode.");
          }
          if (fetchErr.message === "AUTHENTICATION_REQUIRED") {
            throw new Error("Authentication session is required to view this document inline. Please open the application in a new tab or use the download option.");
          }
          console.warn("[PdfCanvasViewer] Pre-fetch via proxy failed, trying direct URL loading as fallback.", fetchErr);
        }

        const loadingTask = pdfData 
          ? pdfjsLib.getDocument({ data: pdfData }) 
          : pdfjsLib.getDocument(url);
          
        const pdfDoc = await loadingTask.promise;
        if (active) {
          setPdf(pdfDoc);
          setNumPages(pdfDoc.numPages);
          setLoading(false);
        }
      } catch (err: any) {
        console.error("Error loading PDF via pdf.js:", err);
        if (active) {
          setError(err.message || "Failed to load PDF document");
          setLoading(false);
        }
      }
    };

    loadPdf();

    return () => {
      active = false;
    };
  }, [url]);

  useEffect(() => {
    if (!pdf) return;

    let active = true;
    const renderPage = async () => {
      try {
        // Cancel existing render task if any
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdf.getPage(currentPage);
        if (!active) return;

        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Support high DPI screens (retina displays) for crystal clear rendering
        const dpr = window.devicePixelRatio || 1;
        canvas.height = viewport.height * dpr;
        canvas.width = viewport.width * dpr;
        canvas.style.height = `${viewport.height}px`;
        canvas.style.width = `${viewport.width}px`;
        
        context.scale(dpr, dpr);

        const renderContext = {
          canvasContext: context,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err.name !== 'RenderingCancelledException') {
          console.error("Error rendering PDF page:", err);
        }
      }
    };

    renderPage();

    return () => {
      active = false;
    };
  }, [pdf, currentPage, scale]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.6));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-white font-mono gap-3 w-full h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#11a877]" />
        <div className="text-xs uppercase tracking-widest text-[#8a8278]">Rendering PDF Pages...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl text-center text-text-main max-w-md mx-auto my-12 shadow-md border border-border">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center font-bold text-lg mb-3">✕</div>
        <h4 className="font-bold text-base">Unable to Render PDF</h4>
        <p className="text-xs text-red-600 font-medium mt-2 mb-4 leading-relaxed bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </p>
        <div className="flex flex-col gap-3 justify-center w-full">
          <div className="flex gap-3 justify-center w-full">
            <a 
              href={`/api/download?url=${encodeURIComponent(url)}`}
              download
              className="bg-[#11a877] hover:bg-[#0bc3b2] text-white px-4 py-2 text-xs font-bold uppercase rounded font-mono flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" /> Download
            </a>
            <a 
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#2f6f9f] hover:bg-[#1f4e72] text-white px-4 py-2 text-xs font-bold uppercase rounded font-mono flex items-center gap-1.5"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </a>
          </div>
          {onReupload && (
            <div className="w-full pt-3 border-t border-border mt-1">
              <FileUploader 
                accept="application/pdf"
                label="RE-UPLOAD PDF DOCUMENT"
                onUploadComplete={(newUrl) => {
                  setError(null);
                  onReupload(newUrl);
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] text-white rounded-xl overflow-hidden shadow-xl">
      {/* Viewer controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#121212] border-b border-white/10 z-10">
        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handlePrevPage} 
            disabled={currentPage <= 1}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-white" />
          </button>
          <span className="font-mono text-xs text-neutral-300 min-w-[70px] text-center">
            PAGE {currentPage} / {numPages}
          </span>
          <button 
            type="button"
            onClick={handleNextPage} 
            disabled={currentPage >= numPages}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            type="button"
            onClick={handleZoomOut}
            disabled={scale <= 0.6}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-white" />
          </button>
          <span className="font-mono text-[10px] text-neutral-300 min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            type="button"
            onClick={handleZoomIn}
            disabled={scale >= 3}
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <a 
            href={`/api/download?url=${encodeURIComponent(url)}`}
            download
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-[#11a877] hover:text-[#0bc3b2]"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </a>
          <a 
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors text-[#2f6f9f] hover:text-[#428bca]"
            title="Open in New Tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Canvas container with scroll */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start bg-[#1a1a1a] min-h-[400px]">
        <div className="shadow-2xl border border-white/5 bg-white rounded overflow-hidden">
          <canvas ref={canvasRef} className="max-w-full" />
        </div>
      </div>
    </div>
  );
}
