import React, { useEffect, useRef, useState } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { X, ZoomIn, ZoomOut } from 'lucide-react';
import { PdfPageInfo } from '../utils/pdfEngine';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

// Set up PDF.js worker Src for client-side rendering
const pdfjsVersion = pdfjs.version || '5.4.624';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

interface PagePreviewModalProps {
  pageInfo: PdfPageInfo;
  filesMap: Map<string, ArrayBuffer>;
  onClose: () => void;
}

export const PagePreviewModal: React.FC<PagePreviewModalProps> = ({
  pageInfo,
  filesMap,
  onClose
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const renderHighRes = async () => {
      try {
        setLoading(true);
        setErrorText(null);
        const bytes = filesMap.get(pageInfo.originalFileUuid);
        if (!bytes) {
          throw new Error('Source file binary not found in local memory cache.');
        }

        const loadingTask = pdfjs.getDocument({ data: new Uint8Array(bytes) });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(pageInfo.pageIndex + 1);

        if (!active) return;

        const viewport = page.getViewport({ scale, rotation: pageInfo.rotation });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        await page.render({
          canvasContext: context,
          viewport,
          canvas
        }).promise;

        if (active) setLoading(false);
      } catch (e: any) {
        console.error(e);
        if (active) {
          setErrorText(e?.message || String(e));
          setLoading(false);
        }
      }
    };

    renderHighRes();

    return () => {
      active = false;
    };
  }, [pageInfo, scale, filesMap]);

  const handleZoomIn = () => {
    playHoverSound();
    setScale(s => Math.min(3, s + 0.2));
  };

  const handleZoomOut = () => {
    playHoverSound();
    setScale(s => Math.max(0.6, s - 0.2));
  };

  return (
    <div className="compiler-modal-overlay" style={{ zIndex: 1001 }}>
      <div className="compiler-window" style={{ maxWidth: '90vw', width: 'auto', maxHeight: '90vh' }}>
        <div className="compiler-header">
          <span className="compiler-title-text" style={{ textTransform: 'uppercase' }}>
            PREVIEW: {pageInfo.originalFileName} (PAGE {pageInfo.pageIndex + 1})
          </span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button className="action-btn-mini" onClick={handleZoomOut} title="Zoom Out">
              <ZoomOut size={14} />
            </button>
            <button className="action-btn-mini" onClick={handleZoomIn} title="Zoom In">
              <ZoomIn size={14} />
            </button>
            <button className="action-btn-mini delete-btn" onClick={() => { playReorderSound(); onClose(); }} title="Close Preview">
              <X size={14} />
            </button>
          </div>
        </div>
        <div className="compiler-body" style={{ overflow: 'auto', maxHeight: 'calc(90vh - 120px)', padding: '1rem', background: '#000' }}>
          {loading && (
            <div style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-cyber)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>
              RENDERING SECTOR IMAGERY...
            </div>
          )}
          {errorText && (
            <div style={{ color: 'rgba(255, 62, 62, 0.9)', fontFamily: 'var(--font-cyber)', fontSize: '0.85rem', padding: '2rem', textAlign: 'center' }}>
              ✖ PREVIEW DECODING ERROR:<br />
              <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{errorText}</span>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            style={{ 
              display: (loading || errorText) ? 'none' : 'block', 
              maxWidth: '100%', 
              height: 'auto', 
              margin: '0 auto',
              border: '1px solid rgba(107, 15, 26, 0.4)', 
              boxShadow: '0 0 20px rgba(107, 15, 26, 0.15)' 
            }} 
          />
        </div>
      </div>
    </div>
  );
};
export default PagePreviewModal;
