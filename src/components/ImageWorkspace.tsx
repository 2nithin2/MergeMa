import React from 'react';
import { Eye, Download, Trash2, Image as ImageIcon, RefreshCcw } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

export interface ImageFileItem {
  uuid: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  previewUrl: string;
  compressedBlob?: Blob;
  compressedSize?: number;
  compressedWidth?: number;
  compressedHeight?: number;
  compressedPreviewUrl?: string;
  qualityUsed?: number;
  compressionStatus: 'idle' | 'compressing' | 'done' | 'error';
  errorMsg?: string;
}

interface ImageWorkspaceProps {
  images: ImageFileItem[];
  onRemoveImage: (uuid: string) => void;
  onPreviewImage: (uuid: string) => void;
  onCompressSingle: (uuid: string) => void;
  onDownloadSingle: (uuid: string) => void;
  onClearAll: () => void;
}

export const ImageWorkspace: React.FC<ImageWorkspaceProps> = ({
  images,
  onRemoveImage,
  onPreviewImage,
  onCompressSingle,
  onDownloadSingle,
  onClearAll
}) => {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleCardHover = () => {
    playHoverSound();
  };

  if (images.length === 0) {
    return (
      <div className="empty-state-view">
        <ImageIcon className="empty-icon" style={{ strokeWidth: 1.2, color: 'var(--accent-purple)' }} />
        <h3 style={{ fontFamily: 'var(--font-cyber)' }}>IMAGE QUEUE EMPTY</h3>
        <p style={{ fontSize: '0.85rem' }}>Drag & Drop photos here, or tap to browse.</p>
      </div>
    );
  }

  return (
    <div className="page-organizer-container">
      <div className="organizer-header">
        <h2 className="organizer-title">
          <ImageIcon size={16} style={{ color: 'var(--accent-cyan)' }} />
          IMAGES WORKSPACE ({images.length})
        </h2>
        <button 
          className="tab-btn" 
          onClick={() => { playReorderSound(); onClearAll(); }}
          style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid rgba(255, 62, 62, 0.2)', color: '#ff5555' }}
        >
          CLEAR WORKSPACE
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem', padding: '1rem 0' }}>
        {images.map((item) => {
          const reduction = item.compressedSize 
            ? ((item.originalSize - item.compressedSize) / item.originalSize * 100).toFixed(0)
            : null;

          return (
            <div
              key={item.uuid}
              className="cyber-card"
              onMouseEnter={handleCardHover}
              style={{ display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(26, 4, 16, 0.35)', position: 'relative', overflow: 'hidden' }}
            >
              {/* Background accent matching status */}
              {item.compressionStatus === 'done' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-emerald, #00ff9d)' }} />
              )}
              {item.compressionStatus === 'compressing' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: 'var(--accent-cyan)', animation: 'pulseGlow 1s infinite' }} />
              )}
              {item.compressionStatus === 'error' && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#ff3e3e' }} />
              )}

              {/* Card Header & Status Badge */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span 
                  style={{ fontSize: '0.65rem', fontFamily: 'var(--font-cyber)', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }}
                  title={item.name}
                >
                  {item.name}
                </span>
                
                {/* Status indicator */}
                {item.compressionStatus === 'idle' && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.15)', padding: '1px 5px', borderRadius: '3px' }}>
                    READY
                  </span>
                )}
                {item.compressionStatus === 'compressing' && (
                  <span style={{ fontSize: '0.6rem', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', padding: '1px 5px', borderRadius: '3px', animation: 'pulseGlow 1s infinite' }}>
                    OPTIMIZING
                  </span>
                )}
                {item.compressionStatus === 'done' && (
                  <span style={{ fontSize: '0.6rem', color: '#00ff9d', border: '1px solid #00ff9d', background: 'rgba(0, 255, 157, 0.05)', padding: '1px 5px', borderRadius: '3px', fontWeight: 'bold' }}>
                    OPTIMIZED
                  </span>
                )}
                {item.compressionStatus === 'error' && (
                  <span style={{ fontSize: '0.6rem', color: '#ff3e3e', border: '1px solid #ff3e3e', padding: '1px 5px', borderRadius: '3px' }}>
                    FAILED
                  </span>
                )}
              </div>

              {/* Side-by-side view (Image & comparison stats) */}
              <div style={{ display: 'flex', gap: '0.75rem', height: '90px' }}>
                <div style={{ width: '90px', background: '#030409', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                  <img
                    src={item.compressedPreviewUrl || item.previewUrl}
                    alt={item.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                </div>
                
                {/* Stats list */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', fontSize: '0.65rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>ORIG. SIZE:</span>
                    <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{formatSize(item.originalSize)}</span>
                  </div>
                  
                  {item.compressionStatus === 'done' && item.compressedSize && (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--accent-cyan)' }}>COMP. SIZE:</span>
                        <span style={{ color: '#00ff9d', fontWeight: 'bold' }}>{formatSize(item.compressedSize)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-muted)' }}>RESOLUTION:</span>
                        <span style={{ color: 'var(--text-secondary)' }}>
                          {item.compressedWidth}x{item.compressedHeight}
                        </span>
                      </div>
                    </>
                  )}

                  {item.compressionStatus !== 'done' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>RESOLUTION:</span>
                      <span style={{ color: 'var(--text-secondary)' }}>{item.originalWidth}x{item.originalHeight}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Error messages if any */}
              {item.compressionStatus === 'error' && item.errorMsg && (
                <div style={{ fontSize: '0.6rem', color: '#ff3e3e', background: 'rgba(255, 62, 62, 0.05)', padding: '4px', borderRadius: '3px', border: '1px solid rgba(255, 62, 62, 0.15)', wordBreak: 'break-word' }}>
                  {item.errorMsg}
                </div>
              )}

              {/* Action Bar */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '0.6rem' }}>
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    className="action-btn-mini"
                    disabled={item.compressionStatus === 'compressing'}
                    onClick={() => { playReorderSound(); onPreviewImage(item.uuid); }}
                    title="Compare Before/After"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Eye size={13} />
                  </button>
                  <button
                    className="action-btn-mini"
                    disabled={item.compressionStatus !== 'done'}
                    onClick={() => { playReorderSound(); onDownloadSingle(item.uuid); }}
                    title="Download Compressed Image"
                    style={{ width: '32px', height: '32px' }}
                  >
                    <Download size={13} />
                  </button>
                  {item.compressionStatus === 'idle' && (
                    <button
                      className="action-btn-mini"
                      onClick={() => onCompressSingle(item.uuid)}
                      title="Optimize Single Image"
                      style={{ width: '32px', height: '32px' }}
                    >
                      <RefreshCcw size={12} />
                    </button>
                  )}
                </div>

                <button
                  className="action-btn-mini delete-btn"
                  onClick={() => { playReorderSound(); onRemoveImage(item.uuid); }}
                  title="Remove Image"
                  style={{ width: '32px', height: '32px' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* Green overlay size reduction badge */}
              {item.compressionStatus === 'done' && reduction && (
                <div style={{ position: 'absolute', top: '15px', right: '-30px', transform: 'rotate(45deg)', background: '#00ff9d', color: '#000000', fontSize: '0.55rem', fontWeight: 'bold', padding: '2px 30px', boxShadow: '0 0 5px rgba(0,255,157,0.4)', pointerEvents: 'none', textAlign: 'center' }}>
                  -{reduction}%
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ImageWorkspace;
