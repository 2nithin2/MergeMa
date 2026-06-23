import React, { useState } from 'react';
import { Layers, Combine, Scissors, Shuffle, RefreshCw, Trash2, FilePlus, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

interface LoadedFile {
  uuid: string;
  name: string;
  pageCount: number;
}

interface ControlPanelProps {
  files: LoadedFile[];
  onRemoveFile: (uuid: string) => void;
  onReorderFiles: (files: LoadedFile[]) => void;
  onMergeTrigger: (filename: string) => void;
  onSplitTrigger: (rangeText: string, filename: string) => void;
  onSplitEveryPageTrigger: () => void;
  onMixTrigger: (fileAUuid: string, fileBUuid: string) => void;
  onRotateAllTrigger: (angle: 90 | -90) => void;
  hasPages: boolean;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  files,
  onRemoveFile,
  onReorderFiles,
  onMergeTrigger,
  onSplitTrigger,
  onSplitEveryPageTrigger,
  onMixTrigger,
  onRotateAllTrigger,
  hasPages
}) => {
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'mix'>('merge');
  
  // Tab states
  const [outputFilename, setOutputFilename] = useState('mergema_compiled');
  const [splitRange, setSplitRange] = useState('1-3, 5');
  const [mixFileA, setMixFileA] = useState('');
  const [mixFileB, setMixFileB] = useState('');

  const handleTabChange = (tab: 'merge' | 'split' | 'mix') => {
    playReorderSound();
    setActiveTab(tab);
  };

  const triggerMerge = () => {
    playReorderSound();
    const finalName = outputFilename.trim() ? outputFilename.trim() : 'mergema_compiled';
    onMergeTrigger(finalName.endsWith('.pdf') ? finalName : `${finalName}.pdf`);
  };

  const triggerSplit = () => {
    playReorderSound();
    const finalName = `${outputFilename.trim() || 'mergema_split'}_extracted.pdf`;
    onSplitTrigger(splitRange, finalName);
  };

  const triggerSplitEvery = () => {
    playReorderSound();
    onSplitEveryPageTrigger();
  };

  const triggerMix = () => {
    playReorderSound();
    if (!mixFileA || !mixFileB) return;
    onMixTrigger(mixFileA, mixFileB);
  };

  const handleRotateAll = (angle: 90 | -90) => {
    playReorderSound();
    onRotateAllTrigger(angle);
  };

  const moveFile = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= files.length) return;
    const updated = [...files];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    playReorderSound();
    onReorderFiles(updated);
  };

  const buttonHover = () => {
    playHoverSound();
  };

  return (
    <div className="control-sidebar">
      {/* Tab Selectors */}
      <div>
        <div className="sidebar-section-title">
          <Layers size={13} />
          OPERATION MODE
        </div>
        <div className="tabs-row">
          <button 
            className={`tab-btn ${activeTab === 'merge' ? 'active' : ''}`}
            onClick={() => handleTabChange('merge')}
            onMouseEnter={buttonHover}
          >
            <Combine size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
            MERGE
          </button>
          <button 
            className={`tab-btn ${activeTab === 'split' ? 'active' : ''}`}
            onClick={() => handleTabChange('split')}
            onMouseEnter={buttonHover}
          >
            <Scissors size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
            SPLIT
          </button>
          <button 
            className={`tab-btn ${activeTab === 'mix' ? 'active' : ''}`}
            onClick={() => handleTabChange('mix')}
            onMouseEnter={buttonHover}
          >
            <Shuffle size={14} style={{ display: 'block', margin: '0 auto 4px' }} />
            MIX
          </button>
        </div>
      </div>

      {/* Target File Settings Card */}
      <div className="cyber-card">
        <div className="sidebar-section-title">
          <ChevronRight size={12} />
          EXPORT CONFIG
        </div>
        <div className="control-group">
          <label className="control-label">OUTPUT FILENAME</label>
          <input
            type="text"
            className="cyber-input"
            value={outputFilename}
            onChange={(e) => setOutputFilename(e.target.value)}
            placeholder="mergema_output"
          />
        </div>
      </div>

      {/* Tab Panels */}
      {activeTab === 'merge' && (
        <div className="cyber-card">
          <div className="sidebar-section-title">
            <Combine size={13} />
            MERGE COMPILER
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Compiles all active pages from the workspace. Drag pages to customize sequence, rotate or delete pages before compiling.
          </p>
          <button
            className="neon-button"
            disabled={!hasPages}
            onClick={triggerMerge}
            onMouseEnter={buttonHover}
          >
            COMPILE & DOWNLOAD PDF
          </button>
        </div>
      )}

      {activeTab === 'split' && (
        <div className="cyber-card">
          <div className="sidebar-section-title">
            <Scissors size={13} />
            SPLIT / EXTRACT
          </div>
          
          <div className="control-group" style={{ marginBottom: '1rem' }}>
            <label className="control-label">PAGE SELECTIONS</label>
            <input
              type="text"
              className="cyber-input"
              value={splitRange}
              onChange={(e) => setSplitRange(e.target.value)}
              placeholder="e.g. 1-3, 5"
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              Use comma-separated ranges e.g. "1-4, 7, 9-12"
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              className="neon-button"
              disabled={!hasPages || !splitRange}
              onClick={triggerSplit}
              onMouseEnter={buttonHover}
            >
              EXTRACT PAGES
            </button>
            <button
              className="neon-button purple-btn"
              disabled={!hasPages}
              onClick={triggerSplitEvery}
              onMouseEnter={buttonHover}
            >
              SPLIT ALL PAGES (ZIP)
            </button>
          </div>
        </div>
      )}

      {activeTab === 'mix' && (
        <div className="cyber-card purple">
          <div className="sidebar-section-title">
            <Shuffle size={13} />
            AUTO-MIX PAGES
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: '1.4' }}>
            Choose two documents. Their pages will alternate (A1, B1, A2, B2) into the workspace.
          </p>
          
          <div className="control-group" style={{ marginBottom: '0.75rem' }}>
            <label className="control-label">DOCUMENT A</label>
            <select 
              className="cyber-input"
              value={mixFileA}
              onChange={(e) => setMixFileA(e.target.value)}
            >
              <option value="">-- Select File A --</option>
              {files.map(f => <option key={f.uuid} value={f.uuid}>{f.name}</option>)}
            </select>
          </div>

          <div className="control-group" style={{ marginBottom: '1.25rem' }}>
            <label className="control-label">DOCUMENT B</label>
            <select 
              className="cyber-input"
              value={mixFileB}
              onChange={(e) => setMixFileB(e.target.value)}
            >
              <option value="">-- Select File B --</option>
              {files.map(f => <option key={f.uuid} value={f.uuid}>{f.name}</option>)}
            </select>
          </div>

          <button
            className="neon-button purple-btn"
            disabled={!mixFileA || !mixFileB || mixFileA === mixFileB}
            onClick={triggerMix}
            onMouseEnter={buttonHover}
          >
            AUTO-MIX IN WORKSPACE
          </button>
        </div>
      )}

      {/* Bulk Rotations Card */}
      <div className="cyber-card">
        <div className="sidebar-section-title">
          <RefreshCw size={13} />
          BULK ACTIONS
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <button
            className="neon-button"
            style={{ fontSize: '0.7rem', padding: '0.5rem' }}
            disabled={!hasPages}
            onClick={() => handleRotateAll(-90)}
            onMouseEnter={buttonHover}
          >
            ROTATE CCW
          </button>
          <button
            className="neon-button"
            style={{ fontSize: '0.7rem', padding: '0.5rem' }}
            disabled={!hasPages}
            onClick={() => handleRotateAll(90)}
            onMouseEnter={buttonHover}
          >
            ROTATE CW
          </button>
        </div>
      </div>

      {/* Loaded Files Monitor */}
      <div className="cyber-card" style={{ marginTop: 'auto' }}>
        <div className="sidebar-section-title">
          <FilePlus size={13} />
          LOADED FILES ({files.length})
        </div>
        
        {files.length === 0 ? (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '0.5rem' }}>
            No files loaded in memory
          </div>
        ) : (
          <div className="file-list">
            {files.map((file, index) => (
              <div key={file.uuid} className="file-item">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxWidth: '160px' }}>
                  <div className="file-name-text" title={file.name} style={{ fontFamily: 'var(--font-cyber)', fontSize: '0.65rem' }}>
                    {index + 1}. {file.name}
                  </div>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>
                    Pages: {file.pageCount}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <button
                    className="delete-file-btn"
                    onClick={() => moveFile(index, 'up')}
                    disabled={index === 0}
                    style={{ opacity: index === 0 ? 0.35 : 1, padding: '2px' }}
                    title="Move File Up"
                  >
                    <ArrowUp size={11} />
                  </button>
                  <button
                    className="delete-file-btn"
                    onClick={() => moveFile(index, 'down')}
                    disabled={index === files.length - 1}
                    style={{ opacity: index === files.length - 1 ? 0.35 : 1, padding: '2px' }}
                    title="Move File Down"
                  >
                    <ArrowDown size={11} />
                  </button>
                  <button
                    className="delete-file-btn"
                    onClick={() => { playReorderSound(); onRemoveFile(file.uuid); }}
                    style={{ padding: '2px' }}
                    title="Remove file & pages"
                  >
                    <Trash2 size={11} style={{ color: 'rgba(255, 62, 62, 0.7)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
export default ControlPanel;
