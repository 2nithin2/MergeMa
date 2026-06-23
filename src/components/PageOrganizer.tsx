import React, { useState } from 'react';
import { RotateCw, Trash2, ArrowLeft, ArrowRight, Layers, FileText, Eye } from 'lucide-react';
import { PdfPageInfo } from '../utils/pdfEngine';
import { playHoverSound, playReorderSound } from '../utils/audioEffects';

interface LoadedFile {
  uuid: string;
  name: string;
  pageCount: number;
}

interface PageOrganizerProps {
  pages: PdfPageInfo[];
  files: LoadedFile[];
  onReorderPages: (pages: PdfPageInfo[]) => void;
  onRotatePage: (pageId: string, direction: 'cw' | 'ccw') => void;
  onDeletePage: (pageId: string) => void;
  onPreviewPage: (page: PdfPageInfo) => void;
  onClearAll: () => void;
  onHoverSound?: () => void;
}

export const PageOrganizer: React.FC<PageOrganizerProps> = ({
  pages,
  files,
  onReorderPages,
  onRotatePage,
  onDeletePage,
  onPreviewPage,
  onClearAll,
  onHoverSound
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Drag handlers for mouse drag-and-drop
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
    if (onHoverSound) onHoverSound();
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    // Smooth swapping of elements while dragging
    const updatedPages = [...pages];
    const draggedItem = updatedPages[draggedIndex];
    updatedPages.splice(draggedIndex, 1);
    updatedPages.splice(index, 0, draggedItem);
    
    setDraggedIndex(index);
    onReorderPages(updatedPages);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    playReorderSound();
  };

  // Click handlers for tap-to-move (perfect for mobile)
  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const updatedPages = [...pages];
    const item = updatedPages[index];
    updatedPages.splice(index, 1);
    updatedPages.splice(targetIndex, 0, item);
    
    playReorderSound();
    onReorderPages(updatedPages);
  };

  const handleCardHover = () => {
    playHoverSound();
  };

  if (pages.length === 0) {
    return (
      <div className="empty-state-view">
        <Layers className="empty-icon" />
        <h3 style={{ fontFamily: 'var(--font-cyber)' }}>WORKSPACE EMPTY</h3>
        <p style={{ fontSize: '0.85rem' }}>Upload files on the left to see page structures</p>
      </div>
    );
  }

  return (
    <div className="page-organizer-container">
      <div className="organizer-header">
        <h2 className="organizer-title">
          <FileText size={16} style={{ color: 'var(--accent-cyan)' }} />
          PAGES WORKSPACE ({pages.length})
        </h2>
        <button 
          className="tab-btn" 
          onClick={() => { playReorderSound(); onClearAll(); }}
          style={{ width: 'auto', padding: '0.4rem 0.8rem', border: '1px solid rgba(255, 62, 62, 0.2)', color: '#ff5555' }}
        >
          CLEAR WORKSPACE
        </button>
      </div>

      <div className="organizer-grid">
        {pages.map((page, index) => {
          // Display visual rotation CSS
          const rotationStyle = {
            transform: `rotate(${page.rotation}deg)`
          };

          const fileIndex = files.findIndex(f => f.uuid === page.originalFileUuid);
          return (
            <div
              key={page.id}
              className={`page-card ${draggedIndex === index ? 'dragging' : ''}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onMouseEnter={handleCardHover}
            >
              <div className="page-number-tag" title="Workspace Sequence Index">
                W.{index + 1}
              </div>
              <div className="page-number-tag" style={{ left: 'auto', right: '4px', border: '1px solid rgba(107, 15, 26, 0.4)', color: 'var(--accent-purple)' }} title="Source File & Original Page">
                D.{fileIndex !== -1 ? fileIndex + 1 : '?'} P.{page.pageIndex + 1}
              </div>
              
              <div className="page-preview-wrapper">
                <img
                  src={page.thumbnail}
                  alt={`Page ${page.pageIndex + 1}`}
                  className="page-thumbnail-img"
                  style={rotationStyle}
                />
                
                {/* Visual Quick Actions Overlay */}
                <div className="card-overlay-actions">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="action-btn-mini"
                        onClick={() => { playReorderSound(); onRotatePage(page.id, 'ccw'); }}
                        title="Rotate Counter-Clockwise"
                      >
                        <RotateCw size={12} style={{ transform: 'scaleX(-1)' }} />
                      </button>
                      <button
                        className="action-btn-mini"
                        onClick={() => { playReorderSound(); onRotatePage(page.id, 'cw'); }}
                        title="Rotate Clockwise"
                      >
                        <RotateCw size={12} />
                      </button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        className="action-btn-mini"
                        onClick={() => movePage(index, 'left')}
                        disabled={index === 0}
                        style={{ opacity: index === 0 ? 0.3 : 1 }}
                        title="Move Left"
                      >
                        <ArrowLeft size={12} />
                      </button>
                      <button
                        className="action-btn-mini"
                        onClick={() => { playReorderSound(); onPreviewPage(page); }}
                        title="Preview Page"
                      >
                        <Eye size={12} />
                      </button>
                      <button
                        className="action-btn-mini"
                        onClick={() => movePage(index, 'right')}
                        disabled={index === pages.length - 1}
                        style={{ opacity: index === pages.length - 1 ? 0.3 : 1 }}
                        title="Move Right"
                      >
                        <ArrowRight size={12} />
                      </button>
                    </div>
                    
                    <button
                      className="action-btn-mini delete-btn"
                      onClick={() => { playReorderSound(); onDeletePage(page.id); }}
                      title="Delete Page"
                      style={{ width: '100%', maxWidth: '104px' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="page-label-info" title={page.originalFileName}>
                {page.originalFileName}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PageOrganizer;
