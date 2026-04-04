"use client";

import React, { useEffect } from "react";
import { usePDF, DocumentProps } from "@react-pdf/renderer";
import { Loader2, AlertCircle, FileDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PDFPreviewProps {
  document: React.ReactElement<DocumentProps>;
  fileName?: string;
}

export function PDFPreview({ document, fileName = "document.pdf" }: PDFPreviewProps) {
  const [instance, updateInstance] = usePDF({ document });

  useEffect(() => {
    updateInstance(document);
  }, [document, updateInstance]);

  if (instance.loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-secondary/10 rounded-2xl border border-dashed border-border gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-[10px] font-black text-accent uppercase tracking-widest">Generating PDF...</p>
      </div>
    );
  }

  if (instance.error) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-danger/5 rounded-2xl border border-dashed border-danger/20 gap-3 p-6 text-center">
        <AlertCircle className="h-8 w-8 text-danger" />
        <div className="space-y-1">
          <p className="text-[12px] font-black text-danger uppercase tracking-tight">Failed to generate PDF</p>
          <p className="text-[10px] font-medium text-danger/60 leading-relaxed max-w-[200px]">
            There was an error generating the document preview.
          </p>
        </div>
      </div>
    );
  }

  if (!instance.url) return null;

  return (
    <div className="relative h-full w-full flex flex-col">
      <div className="flex-1 rounded-xl overflow-hidden bg-zinc-800/5 border border-border relative">
        <iframe
          src={instance.url}
          className="w-full h-full border-none"
          title="PDF Preview"
        />
        
        {/* Mobile helper overlay - visible on touch devices if needed, or just standard action buttons */}
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
           <Button
            size="sm"
            className="rounded-full shadow-xl bg-primary text-white hover:bg-primary/90 h-10 w-10 p-0"
            onClick={() => window.open(instance.url!, '_blank')}
            title="Open in new tab"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <a 
            href={instance.url} 
            download={fileName}
            className="flex items-center justify-center rounded-full shadow-xl bg-emerald-500 text-white hover:bg-emerald-600 h-10 w-10 transition-all active:scale-95"
            title="Download PDF"
          >
            <FileDown className="h-4 w-4" />
          </a>
        </div>
      </div>
      
      {/* Fallback for mobile if iframe is blocked or doesn't show */}
      <div className="mt-4 lg:hidden">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-primary uppercase tracking-tight">Mobile Preview</p>
            <p className="text-[10px] text-accent font-medium leading-none">If preview doesn't appear, use buttons below.</p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 rounded-lg text-[9px] font-black uppercase tracking-widest"
              onClick={() => window.open(instance.url!, '_blank')}
            >
               Open
            </Button>
            <a 
              href={instance.url} 
              download={fileName}
              className="h-9 px-4 flex items-center justify-center rounded-lg bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest"
            >
              Download
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
