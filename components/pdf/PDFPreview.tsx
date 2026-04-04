"use client";

import React, { useEffect } from "react";
import { usePDF, DocumentProps, pdf } from "@react-pdf/renderer";
import { Loader2, AlertCircle, FileDown, ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileOpener } from "@capacitor-community/file-opener";

interface PDFPreviewProps {
  document: React.ReactElement<DocumentProps>;
  fileName?: string;
}

export function PDFPreview({ document, fileName = "document.pdf" }: PDFPreviewProps) {
  const [instance, updateInstance] = usePDF({ document });
  const isNative = Capacitor.isNativePlatform();

  useEffect(() => {
    updateInstance(document);
  }, [document, updateInstance]);

  const handleNativeOpen = async () => {
    try {
      const blob = await pdf(document).toBlob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: Directory.Cache,
        });

        await FileOpener.open({
          filePath: savedFile.uri,
          contentType: 'application/pdf',
        });
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Error opening PDF in native viewer:", error);
      alert("Failed to open PDF in native viewer. Please try the standard preview.");
    }
  };

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
        {!isNative ? (
          <iframe
            src={instance.url}
            className="w-full h-full border-none"
            title="PDF Preview"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full bg-primary/5 gap-6 p-8">
            <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Smartphone className="h-12 w-12" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-[14px] font-black text-primary uppercase tracking-tight">Native Mobile View</p>
              <p className="text-[10px] font-medium text-accent leading-relaxed max-w-[250px]">
                PDF optimization is ready. Click the button below to open the document with your phone's native viewer.
              </p>
            </div>
            <Button 
               onClick={handleNativeOpen}
               className="h-12 px-8 rounded-xl bg-primary text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-primary/20"
            >
              <ExternalLink className="h-4 w-4 mr-2" /> Open in Native Viewer
            </Button>
          </div>
        )}
        
        <div className="absolute bottom-4 right-4 flex flex-col gap-2">
          {!isNative && (
            <Button
              size="sm"
              className="rounded-full shadow-xl bg-primary text-white hover:bg-primary/90 h-10 w-10 p-0"
              onClick={() => window.open(instance.url!, '_blank')}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          )}
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
      
      {/* Fallback for mobile if needed or just additional buttons */}
      <div className="mt-4 lg:hidden">
        <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[11px] font-black text-primary uppercase tracking-tight">PDF Options</p>
            <p className="text-[10px] text-accent font-medium leading-none">Choose how you want to view the document.</p>
          </div>
          <div className="flex gap-2">
            {isNative && (
              <Button
                size="sm"
                className="h-9 px-4 rounded-lg bg-primary text-white text-[9px] font-black uppercase tracking-widest"
                onClick={handleNativeOpen}
              >
                Open Native
              </Button>
            )}
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
