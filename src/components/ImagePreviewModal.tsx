import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Image as ImageIcon, Sparkles } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

interface ImagePreviewModalProps {
  name: string;
  originalUrl: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  compressedUrl?: string;
  compressedSize?: number;
  compressedWidth?: number;
  compressedHeight?: number;
  qualityUsed?: number;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  name,
  originalUrl,
  originalSize,
  originalWidth,
  originalHeight,
  compressedUrl,
  compressedSize,
  compressedWidth,
  compressedHeight,
  qualityUsed,
  onClose
}) => {
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const sliderContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    e.preventDefault();
    playHoverSound();
  };

  const handleTouchStart = () => {
    isDraggingRef.current = true;
    playHoverSound();
  };

  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDraggingRef.current || !sliderContainerRef.current) return;
      const rect = sliderContainerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
      setSliderPosition(percentage);
    };

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingRef.current) {
        isDraggingRef.current = false;
        playReorderSound();
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  const sizeReduction = compressedSize 
    ? ((originalSize - compressedSize) / originalSize * 100).toFixed(0)
    : null;

  return (
    <div className="compiler-modal-overlay" style={{ animation: 'fadeIn 0.25s ease' }}>
      <div className="compiler-window" style={{ maxWidth: '850px', width: '95vw', height: '90vh', maxHeight: '720px' }}>
        
        {/* Header */}
        <div className="compiler-header">
          <div className="compiler-title-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ImageIcon size={14} />
            PREVIEW COMPARISON: {name}
          </div>
          <button 
            onClick={() => { playReorderSound(); onClose(); }}
            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            title="Close Preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '0.6rem 1.25rem', borderBottom: '1px solid rgba(0,240,255,0.06)', fontSize: '0.75rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '1.25rem', color: 'var(--text-secondary)' }}>
            <div>
              <span style={{ color: 'var(--accent-purple)' }}>Original:</span>{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{formatSize(originalSize)}</strong>{' '}
              ({originalWidth}x{originalHeight})
            </div>
            {compressedSize && (
              <div>
                <span style={{ color: 'var(--accent-cyan)' }}>Compressed:</span>{' '}
                <strong style={{ color: 'var(--text-primary)' }}>{formatSize(compressedSize)}</strong>{' '}
                ({compressedWidth}x{compressedHeight})
              </div>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {sizeReduction && (
              <span className="terminal-line success" style={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,255,157,0.1)', padding: '2px 8px', borderRadius: '4px' }}>
                <Sparkles size={11} />
                {sizeReduction}% REDUCED
              </span>
            )}
            <div className="tabs-row" style={{ margin: 0 }}>
              <button 
                className={`tab-btn ${viewMode === 'slider' ? 'active' : ''}`}
                onClick={() => { playHoverSound(); setViewMode('slider'); }}
                style={{ padding: '2px 8px', fontSize: '0.65rem' }}
              >
                SLIDER
              </button>
              <button 
                className={`tab-btn ${viewMode === 'side-by-side' ? 'active' : ''}`}
                onClick={() => { playHoverSound(); setViewMode('side-by-side'); }}
                style={{ padding: '2px 8px', fontSize: '0.65rem' }}
              >
                SIDE-BY-SIDE
              </button>
            </div>
          </div>
        </div>

        {/* Viewport */}
        <div style={{ flex: 1, padding: '1.5rem', background: '#030409', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' }}>
          
          {viewMode === 'slider' && compressedUrl ? (
            <div 
              ref={sliderContainerRef}
              style={{ position: 'relative', width: '100%', height: '100%', maxWidth: '650px', maxHeight: '450px', userSelect: 'none', overflow: 'hidden', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {/* Original Image */}
              <img 
                src={originalUrl} 
                alt="Original" 
                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', pointerEvents: 'none' }}
              />
              <div style={{ position: 'absolute', bottom: '10px', left: '10px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', fontSize: '0.65rem', color: 'var(--accent-purple)', borderRadius: '3px', border: '1px solid var(--accent-purple)', pointerEvents: 'none', fontFamily: 'var(--font-cyber)' }}>
                ORIGINAL
              </div>

              {/* Compressed Image (Clipped Overlay) */}
              <div 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
              >
                <img 
                  src={compressedUrl} 
                  alt="Compressed" 
                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                />
                <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', fontSize: '0.65rem', color: 'var(--accent-cyan)', borderRadius: '3px', border: '1px solid var(--accent-cyan)', pointerEvents: 'none', fontFamily: 'var(--font-cyber)' }}>
                  COMPRESSED
                </div>
              </div>

              {/* Slider Line */}
              <div 
                style={{ position: 'absolute', top: 0, bottom: 0, left: `${sliderPosition}%`, width: '2px', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)', cursor: 'ew-resize', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
              >
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#060814', border: '2px solid var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(0,240,255,0.4)', position: 'relative' }}>
                  <Play size={8} style={{ color: 'var(--accent-cyan)', transform: 'rotate(180deg) translateX(1px)', position: 'absolute', left: '3px' }} />
                  <Play size={8} style={{ color: 'var(--accent-cyan)', transform: 'translateX(1px)', position: 'absolute', right: '3px' }} />
                </div>
              </div>
            </div>
          ) : (
            /* Side-by-side or Fallback */
            <div style={{ display: 'grid', gridTemplateColumns: compressedUrl ? '1fr 1fr' : '1fr', gap: '1.5rem', width: '100%', height: '100%', overflowY: 'auto', padding: '0.5rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxHeight: '350px', background: '#05060d', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden', padding: '0.5rem' }}>
                  <img src={originalUrl} alt="Original" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-cyber)' }}>
                  ORIGINAL ({formatSize(originalSize)})
                </div>
              </div>
              
              {compressedUrl && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', maxHeight: '350px', background: '#05060d', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)', overflow: 'hidden', padding: '0.5rem' }}>
                    <img src={compressedUrl} alt="Compressed" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-cyber)' }}>
                    COMPRESSED ({formatSize(compressedSize!)})
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: '0.75rem 1.5rem', borderTop: '1px solid rgba(0,240,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
          <div>
            Target quality factor used: {qualityUsed ? (qualityUsed * 100).toFixed(0) + '%' : 'N/A'}
          </div>
          <div>
            Drag slider left/right to inspect pixel compression differences
          </div>
        </div>

      </div>
    </div>
  );
};

export default ImagePreviewModal;
