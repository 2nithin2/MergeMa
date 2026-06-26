import React, { useState } from 'react';
import { Sparkles, Download, Trash2, ChevronRight, Settings, Image as ImageIcon } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

export interface CompressionSettings {
  format: 'jpeg' | 'png' | 'webp' | 'pdf';
  targetSizeKb?: number; // undefined means no limit
  maxWidth: number;
  maxHeight: number;
}

interface ImageControlPanelProps {
  hasImages: boolean;
  isProcessing: boolean;
  onCompressAll: (settings: CompressionSettings) => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  imageCount: number;
}

export const ImageControlPanel: React.FC<ImageControlPanelProps> = ({
  hasImages,
  isProcessing,
  onCompressAll,
  onDownloadAll,
  onClearAll,
  imageCount
}) => {
  const [format, setFormat] = useState<'jpeg' | 'png' | 'webp' | 'pdf'>('jpeg');
  const [sizePreset, setSizePreset] = useState<string>('100'); // KB or "none" or "custom"
  const [customSize, setCustomSize] = useState<number>(50);
  const [customUnit, setCustomUnit] = useState<'KB' | 'MB'>('KB');
  const [resolutionPreset, setResolutionPreset] = useState<string>('auto'); // auto, original, 1920, 1200, 800

  // Calculate actual target size in KB
  const getTargetSizeKb = (): number | undefined => {
    if (sizePreset === 'none') return undefined;
    if (sizePreset === 'custom') {
      return customUnit === 'KB' ? customSize : customSize * 1024;
    }
    return parseInt(sizePreset, 10);
  };

  const getResolutionBounds = (): { maxWidth: number; maxHeight: number } => {
    switch (resolutionPreset) {
      case 'original':
        return { maxWidth: 99999, maxHeight: 99999 };
      case '1920':
        return { maxWidth: 1920, maxHeight: 1080 };
      case '1200':
        return { maxWidth: 1200, maxHeight: 1200 };
      case '800':
        return { maxWidth: 800, maxHeight: 800 };
      case 'auto':
      default:
        // Adjust bounds to be smaller automatically if size limit is very low
        const kbLimit = getTargetSizeKb();
        if (kbLimit && kbLimit <= 50) {
          return { maxWidth: 800, maxHeight: 800 };
        } else if (kbLimit && kbLimit <= 200) {
          return { maxWidth: 1200, maxHeight: 1200 };
        }
        return { maxWidth: 2048, maxHeight: 2048 };
    }
  };

  const handleTriggerCompress = () => {
    playReorderSound();
    const bounds = getResolutionBounds();
    onCompressAll({
      format,
      targetSizeKb: getTargetSizeKb(),
      maxWidth: bounds.maxWidth,
      maxHeight: bounds.maxHeight
    });
  };

  const buttonHover = () => {
    playHoverSound();
  };

  return (
    <div className="control-sidebar">
      {/* Settings Card */}
      <div className="cyber-card">
        <div className="sidebar-section-title">
          <Settings size={13} style={{ color: 'var(--accent-cyan)' }} />
          COMPRESSION CONFIG
        </div>

        {/* Output format */}
        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label className="control-label">TARGET FORMAT</label>
          <select 
            className="cyber-input" 
            value={format} 
            onChange={(e) => { playReorderSound(); setFormat(e.target.value as any); }}
          >
            <option value="jpeg">JPEG (.jpg)</option>
            <option value="png">PNG (.png)</option>
            <option value="webp">WEBP (.webp)</option>
            <option value="pdf">PDF (.pdf Document)</option>
          </select>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {format === 'pdf' ? 'Embeds compressed image into page' : `Converts to ${format.toUpperCase()}`}
          </span>
        </div>

        {/* Target Size Limit */}
        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label className="control-label">MAX FILE SIZE LIMIT</label>
          <select 
            className="cyber-input" 
            value={sizePreset} 
            onChange={(e) => { playReorderSound(); setSizePreset(e.target.value); }}
          >
            <option value="none">No Limit (Optimize Quality)</option>
            <option value="20">20 KB (Govt signature limit)</option>
            <option value="50">50 KB (Govt photo limit)</option>
            <option value="100">100 KB (Govt photo/doc limit)</option>
            <option value="200">200 KB (Portal standard limit)</option>
            <option value="500">500 KB (High resolution limit)</option>
            <option value="1024">1 MB (Standard document)</option>
            <option value="2048">2 MB</option>
            <option value="custom">Custom Limit...</option>
          </select>
        </div>

        {/* Custom size input */}
        {sizePreset === 'custom' && (
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <input 
              type="number" 
              className="cyber-input"
              value={customSize}
              onChange={(e) => setCustomSize(Math.max(1, parseInt(e.target.value) || 0))}
              min="1"
            />
            <select 
              className="cyber-input"
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as any)}
            >
              <option value="KB">KB</option>
              <option value="MB">MB</option>
            </select>
          </div>
        )}

        {/* Dimensions scaling */}
        <div className="control-group">
          <label className="control-label">RESOLUTION SCALE</label>
          <select 
            className="cyber-input" 
            value={resolutionPreset} 
            onChange={(e) => { playReorderSound(); setResolutionPreset(e.target.value); }}
          >
            <option value="auto">Auto-scale to fit size limit</option>
            <option value="original">Keep Original Dimensions</option>
            <option value="1920">Max 1920px (Desktop Full HD)</option>
            <option value="1200">Max 1200px (Medium Document)</option>
            <option value="800">Max 800px (Compact Mobile)</option>
          </select>
        </div>
      </div>

      {/* Compiler Action Card */}
      <div className="cyber-card">
        <div className="sidebar-section-title">
          <ChevronRight size={12} />
          EXECUTE COMPRESSION
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
          Applies smart target compression to all uploaded images. Ideal for government jobs and online portal registrations.
        </p>
        <button
          className="neon-button"
          disabled={!hasImages || isProcessing}
          onClick={handleTriggerCompress}
          onMouseEnter={buttonHover}
          style={{ marginBottom: '0.75rem' }}
        >
          <Sparkles size={14} />
          {isProcessing ? 'PROCESSING...' : 'COMPRESS ALL IMAGES'}
        </button>

        <button
          className="neon-button purple-btn"
          disabled={!hasImages || isProcessing}
          onClick={onDownloadAll}
          onMouseEnter={buttonHover}
        >
          <Download size={14} />
          DOWNLOAD OPTIMIZED
        </button>
      </div>

      {/* Monitor list */}
      <div className="cyber-card" style={{ marginTop: 'auto' }}>
        <div className="sidebar-section-title">
          <ImageIcon size={13} style={{ color: 'var(--accent-purple)' }} />
          LOADED IMAGES ({imageCount})
        </div>
        {imageCount === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
            No images loaded in memory
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>
              Images are ready for size optimization.
            </p>
            <button 
              className="tab-btn" 
              onClick={() => { playReorderSound(); onClearAll(); }}
              style={{ padding: '0.4rem 0.8rem', border: '1px solid rgba(255, 62, 62, 0.2)', color: '#ff5555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Trash2 size={11} />
              CLEAR IMAGES
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageControlPanel;
