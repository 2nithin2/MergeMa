import React, { useState } from 'react';
import { Eye, Download, FileText, Image as ImageIcon, CheckSquare, Square, X } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';
import { PdfPageInfo } from '../utils/pdfEngine';

export interface ConvertedPageResult {
  blob?: Blob;
  sizeBytes?: number;
  width?: number;
  height?: number;
  status: 'idle' | 'converting' | 'done' | 'error';
  errorMsg?: string;
  previewUrl?: string; // object URL of the converted image
}

interface PdfToImageWorkspaceProps {
  pages: PdfPageInfo[];
  documentName: string;
  selectedPages: Set<number>;
  onTogglePage: (pageIndex: number) => void;
  onToggleAll: (selectAll: boolean) => void;
  results: Map<number, ConvertedPageResult>;
  onDownloadSingle: (pageIndex: number) => void;
  onClearAll: () => void;
  outputFormat: 'png' | 'jpeg' | 'webp';
  onRenameDocument?: (newName: string) => void;
}

export const PdfToImageWorkspace: React.FC<PdfToImageWorkspaceProps> = ({
  pages,
  documentName,
  selectedPages,
  onTogglePage,
  onToggleAll,
  results,
  onDownloadSingle,
  onClearAll,
  outputFormat,
  onRenameDocument
}) => {
  const [activePreviewUrl, setActivePreviewUrl] = useState<string | null>(null);
  const [activePreviewPageNum, setActivePreviewPageNum] = useState<number | null>(null);
  const [isEditingDoc, setIsEditingDoc] = useState(false);
  const [tempDocName, setTempDocName] = useState(documentName);

  const startEditingDoc = () => {
    playHoverSound();
    setIsEditingDoc(true);
    setTempDocName(documentName);
  };

  const saveRenameDoc = () => {
    playReorderSound();
    if (tempDocName.trim() && onRenameDocument) {
      onRenameDocument(tempDocName.trim());
    }
    setIsEditingDoc(false);
  };

  const handleKeyPressDoc = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveRenameDoc();
    } else if (e.key === 'Escape') {
      setIsEditingDoc(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCardHover = () => {
    playHoverSound();
  };

  const handlePreviewClose = () => {
    playReorderSound();
    setActivePreviewUrl(null);
    setActivePreviewPageNum(null);
  };

  const handleOpenPreview = (pageIndex: number, url: string) => {
    playReorderSound();
    setActivePreviewUrl(url);
    setActivePreviewPageNum(pageIndex + 1);
  };

  const isAllSelected = pages.length > 0 && selectedPages.size === pages.length;

  if (pages.length === 0) {
    return (
      <div className="empty-state-view">
        <FileText className="empty-icon" style={{ strokeWidth: 1.2, color: 'var(--accent-purple)' }} />
        <h3 style={{ fontFamily: 'var(--font-cyber)' }}>PDF CONVERTER QUEUE EMPTY</h3>
        <p style={{ fontSize: '0.85rem' }}>Drag & Drop a PDF file here, or tap to browse.</p>
      </div>
    );
  }

  return (
    <div className="page-organizer-container">
      <div className="organizer-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <h2 className="organizer-title" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
          CONVERTER WORKSPACE
          {isEditingDoc ? (
            <input
              type="text"
              className="cyber-input"
              value={tempDocName}
              onChange={(e) => setTempDocName(e.target.value)}
              onBlur={saveRenameDoc}
              onKeyDown={handleKeyPressDoc}
              autoFocus
              style={{ padding: '2px 6px', fontSize: '0.7rem', height: '24px', width: '200px', marginLeft: '8px' }}
            />
          ) : (
            <span 
              style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginLeft: '8px', fontFamily: 'var(--font-standard)', fontWeight: 'normal', cursor: 'pointer', textDecoration: 'underline dotted rgba(255,255,255,0.15)' }}
              title="Click to rename PDF"
              onClick={startEditingDoc}
            >
              ({documentName} — {pages.length} Pages)
            </span>
          )}
        </h2>
        
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button 
            className="tab-btn" 
            onClick={() => { playReorderSound(); onToggleAll(!isAllSelected); }}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            {isAllSelected ? 'DESELECT ALL' : 'SELECT ALL'}
          </button>
          
          <button 
            className="tab-btn" 
            onClick={() => { playReorderSound(); onClearAll(); }}
            style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid rgba(255, 62, 62, 0.2)', color: '#ff5555' }}
          >
            UNLOAD PDF
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
        {pages.map((page, idx) => {
          const isSelected = selectedPages.has(idx);
          const result = results.get(idx) || { status: 'idle' };
          
          return (
            <div
              key={page.id}
              className="cyber-card"
              onMouseEnter={handleCardHover}
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '0.75rem', 
                border: isSelected ? '1px solid rgba(107, 15, 26, 0.5)' : '1px solid rgba(255,255,255,0.06)', 
                background: isSelected ? 'rgba(107, 15, 26, 0.08)' : 'rgba(26, 4, 16, 0.35)', 
                position: 'relative', 
                overflow: 'hidden',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Background Status Trim */}
              {result.status === 'done' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-emerald, #00ff9d)' }} />
              )}
              {result.status === 'converting' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-cyan)', animation: 'pulseGlow 1s infinite' }} />
              )}
              {result.status === 'error' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#ff3e3e' }} />
              )}

              {/* Page Selection Bar & Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  onClick={() => { playReorderSound(); onTogglePage(idx); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: isSelected ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-cyber)',
                    padding: 0
                  }}
                >
                  {isSelected ? <CheckSquare size={13} style={{ color: 'var(--accent-cyan)' }} /> : <Square size={13} />}
                  PAGE {idx + 1}
                </button>

                {/* Status Indicator */}
                {result.status === 'idle' && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                    READY
                  </span>
                )}
                {result.status === 'converting' && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '1px 5px', borderRadius: '3px', animation: 'pulseGlow 1s infinite' }}>
                    RENDERING
                  </span>
                )}
                {result.status === 'done' && (
                  <span style={{ fontSize: '0.6rem', color: '#00ff9d', border: '1px solid #00ff9d', background: 'rgba(0, 255, 157, 0.05)', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                    CONVERTED
                  </span>
                )}
                {result.status === 'error' && (
                  <span style={{ fontSize: '0.6rem', color: '#ff3e3e', border: '1px solid #ff3e3e', padding: '1px 5px', borderRadius: '3px' }}>
                    FAILED
                  </span>
                )}
              </div>

              {/* Thumbnail Display (renders high-quality output when completed) */}
              <div style={{ display: 'flex', gap: '0.75rem', height: '110px' }}>
                <div style={{ width: '90px', background: '#030409', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <img
                    src={result.previewUrl || page.thumbnail}
                    alt={`Page ${idx + 1}`}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>

                {/* Metadata Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', fontSize: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>PDF SIZE:</span>
                    <span style={{ color: 'var(--text-secondary)' }}>{Math.round(page.width)}x{Math.round(page.height)} pt</span>
                  </div>

                  {result.status === 'done' && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>IMG FORMAT:</span>
                        <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{outputFormat.toUpperCase()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>IMG RESOL.:</span>
                        <span style={{ color: '#00ff9d', fontWeight: 'bold' }}>{result.width}x{result.height} px</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>FILE SIZE:</span>
                        <span style={{ color: '#00ff9d', fontWeight: 'bold' }}>{formatSize(result.sizeBytes)}</span>
                      </div>
                    </>
                  )}

                  {result.status !== 'done' && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.6rem', fontStyle: 'italic', marginTop: '2px' }}>
                      Ready to render with high clarity bounds.
                    </div>
                  )}
                </div>
              </div>

              {/* Error messages if any */}
              {result.status === 'error' && result.errorMsg && (
                <div style={{ fontSize: '0.6rem', color: '#ff3e3e', background: 'rgba(255, 62, 62, 0.05)', padding: '4px', borderRadius: '3px', border: '1px solid rgba(255, 62, 62, 0.15)', wordBreak: 'break-word' }}>
                  {result.errorMsg}
                </div>
              )}

              {/* Action Bar */}
              <div style={{ display: 'flex', gap: '0.4rem', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.5rem', marginTop: 'auto' }}>
                <button
                  className="action-btn-mini"
                  disabled={result.status !== 'done' || !result.previewUrl}
                  onClick={() => handleOpenPreview(idx, result.previewUrl!)}
                  title="Preview Full Clarity Render"
                  style={{ flex: 1, height: '28px', gap: '4px', fontSize: '0.65rem' }}
                >
                  <Eye size={12} />
                  PREVIEW
                </button>
                <button
                  className="action-btn-mini"
                  disabled={result.status !== 'done'}
                  onClick={() => onDownloadSingle(idx)}
                  title="Download Image File"
                  style={{ width: '28px', height: '28px' }}
                >
                  <Download size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox / Clarity Preview Modal */}
      {activePreviewUrl && (
        <div className="compiler-modal-overlay" style={{ animation: 'fadeIn 0.25s ease', zIndex: 110 }}>
          <div className="compiler-window" style={{ maxWidth: '900px', width: '95vw', height: '92vh', maxHeight: '800px' }}>
            
            {/* Header */}
            <div className="compiler-header">
              <div className="compiler-title-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ImageIcon size={14} />
                CLARITY MATRIX PREVIEW — PAGE {activePreviewPageNum} ({outputFormat.toUpperCase()})
              </div>
              <button 
                onClick={handlePreviewClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                title="Close Lightbox"
              >
                <X size={18} />
              </button>
            </div>

            {/* Viewport */}
            <div style={{ 
              flex: 1, 
              padding: '1rem', 
              background: '#030409', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              overflow: 'auto',
              position: 'relative'
            }}>
              <img 
                src={activePreviewUrl} 
                alt="Clarity Render Preview" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: '100%', 
                  objectFit: 'contain',
                  boxShadow: '0 0 25px rgba(0,0,0,0.8)',
                  border: '1px solid rgba(255,255,255,0.05)'
                }} 
              />
            </div>

            {/* Footer */}
            <div style={{ 
              padding: '0.75rem 1.5rem', 
              borderTop: '1px solid rgba(0,240,255,0.08)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              fontSize: '0.7rem', 
              color: 'var(--text-muted)' 
            }}>
              <div>
                Renders vectors cleanly without pixelation.
              </div>
              <div>
                Scroll or zoom viewport if image overflows.
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default PdfToImageWorkspace;
