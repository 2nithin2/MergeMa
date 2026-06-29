import React from 'react';
import { Sparkles, Download, Trash2, ChevronRight, Settings, Image as ImageIcon } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

export interface PdfToImageSettings {
  format: 'png' | 'jpeg' | 'webp';
  scale: number; // 1.0, 2.0, 3.0, 4.0
  quality: number; // 0.1 to 1.0
  filenameBase: string;
}

interface PdfToImageControlPanelProps {
  hasDocument: boolean;
  isProcessing: boolean;
  settings: PdfToImageSettings;
  onSettingsChange: (settings: PdfToImageSettings) => void;
  onConvert: () => void;
  onDownloadAll: () => void;
  onClearAll: () => void;
  selectedPagesCount: number;
  totalConvertedCount: number;
}

export const PdfToImageControlPanel: React.FC<PdfToImageControlPanelProps> = ({
  hasDocument,
  isProcessing,
  settings,
  onSettingsChange,
  onConvert,
  onDownloadAll,
  onClearAll,
  selectedPagesCount,
  totalConvertedCount
}) => {
  const handleFormatChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playReorderSound();
    onSettingsChange({
      ...settings,
      format: e.target.value as any
    });
  };

  const handleScaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    playReorderSound();
    onSettingsChange({
      ...settings,
      scale: parseFloat(e.target.value)
    });
  };

  const handleQualityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      quality: parseFloat(e.target.value) / 100
    });
  };

  const handleFilenameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({
      ...settings,
      filenameBase: e.target.value
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
          CONVERTER CONFIG
        </div>

        {/* Output format */}
        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label className="control-label">OUTPUT IMAGE FORMAT</label>
          <select 
            className="cyber-input" 
            value={settings.format} 
            onChange={handleFormatChange}
          >
            <option value="png">PNG (.png Lossless - Best Clarity)</option>
            <option value="jpeg">JPEG (.jpg Compressed)</option>
            <option value="webp">WEBP (.webp Modern)</option>
          </select>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {settings.format === 'png' 
              ? 'Lossless format. Retains perfect pixel clarity for text.' 
              : `Lossy format. Outputs lightweight files at specified quality.`}
          </span>
        </div>

        {/* Render Scale / Clarity */}
        <div className="control-group" style={{ marginBottom: '1rem' }}>
          <label className="control-label">RENDER CLARITY (DPI SCALE)</label>
          <select 
            className="cyber-input" 
            value={settings.scale.toString()} 
            onChange={handleScaleChange}
          >
            <option value="1">1.0x (Standard Web Quality)</option>
            <option value="2">2.0x (Sharp - Recommended)</option>
            <option value="3">3.0x (High Definition)</option>
            <option value="4">4.0x (Ultra HD - Maximum Lossless Clarity)</option>
          </select>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Higher scale renders vector fonts and graphics at higher resolutions to avoid pixelation.
          </span>
        </div>

        {/* Quality Slider (for JPEG / WEBP) */}
        {settings.format !== 'png' && (
          <div className="control-group" style={{ marginBottom: '1rem' }}>
            <label className="control-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>IMAGE QUALITY</span>
              <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>
                {Math.round(settings.quality * 100)}%
              </span>
            </label>
            <input 
              type="range" 
              className="cyber-slider"
              min="10"
              max="100"
              value={Math.round(settings.quality * 100)}
              onChange={handleQualityChange}
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.07)',
                height: '4px',
                borderRadius: '2px',
                outline: 'none',
                accentColor: 'var(--accent-cyan)'
              }}
            />
          </div>
        )}

        {/* Output Filename Prefix */}
        <div className="control-group" style={{ marginBottom: '0.5rem' }}>
          <label className="control-label">OUTPUT FILENAME PREFIX</label>
          <input
            type="text"
            className="cyber-input"
            value={settings.filenameBase}
            onChange={handleFilenameChange}
            placeholder="e.g. page_export"
            style={{ fontSize: '0.75rem' }}
          />
          <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            Files will be saved as <code>{(settings.filenameBase || 'document')}_page_X.{settings.format}</code>
          </span>
        </div>
      </div>

      {/* Action Card */}
      <div className="cyber-card">
        <div className="sidebar-section-title">
          <ChevronRight size={12} />
          EXECUTE CONVERSION
        </div>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
          Processes each page client-side. Selecting higher clarity scales requires more system memory.
        </p>
        
        <button
          className="neon-button"
          disabled={!hasDocument || isProcessing || selectedPagesCount === 0}
          onClick={onConvert}
          onMouseEnter={buttonHover}
          style={{ marginBottom: '0.75rem' }}
        >
          <Sparkles size={14} />
          {isProcessing ? 'CONVERTING...' : `CONVERT SELECTED (${selectedPagesCount})`}
        </button>

        <button
          className="neon-button purple-btn"
          disabled={totalConvertedCount === 0 || isProcessing}
          onClick={onDownloadAll}
          onMouseEnter={buttonHover}
        >
          <Download size={14} />
          DOWNLOAD ALL IMAGES
        </button>
      </div>

      {/* Status Card */}
      <div className="cyber-card" style={{ marginTop: 'auto' }}>
        <div className="sidebar-section-title">
          <ImageIcon size={13} style={{ color: 'var(--accent-purple)' }} />
          CONVERTER MATRIX
        </div>
        {!hasDocument ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
            No document loaded in memory
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Selected Pages:</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>{selectedPagesCount}</span>
            </div>
            <div style={{ fontSize: '0.7rem', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Converted Images:</span>
              <span style={{ color: 'var(--accent-emerald, #00ff9d)', fontWeight: 'bold' }}>{totalConvertedCount}</span>
            </div>
            
            <button 
              className="tab-btn" 
              onClick={() => { playReorderSound(); onClearAll(); }}
              style={{ 
                padding: '0.4rem 0.8rem', 
                border: '1px solid rgba(255, 62, 62, 0.2)', 
                color: '#ff5555', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '4px',
                marginTop: '0.5rem'
              }}
            >
              <Trash2 size={11} />
              UNLOAD DOCUMENT
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PdfToImageControlPanel;
