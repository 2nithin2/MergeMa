import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { playUploadSound } from '../utils/audioEffects';

// Helper to recursively traverse folders dropped into the dropzone
const traverseFileTree = async (item: any): Promise<File[]> => {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file(
        (file: File) => {
          if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
            resolve([file]);
          } else {
            resolve([]);
          }
        },
        () => resolve([])
      );
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      
      const readEntriesBatch = (): Promise<any[]> => {
        return new Promise((res) => {
          dirReader.readEntries(
            (entries: any[]) => res(entries),
            () => res([])
          );
        });
      };

      const readAllEntries = async () => {
        let allEntries: any[] = [];
        let batch = await readEntriesBatch();
        while (batch.length > 0) {
          allEntries = allEntries.concat(batch);
          batch = await readEntriesBatch();
        }
        return allEntries;
      };

      readAllEntries().then(async (entries) => {
        const promises = entries.map(entry => traverseFileTree(entry));
        const fileArrays = await Promise.all(promises);
        resolve(fileArrays.flat());
      });
    } else {
      resolve([]);
    }
  });
};

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  onHoverSound?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, onHoverSound }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const entries: any[] = [];
      for (let i = 0; i < e.dataTransfer.items.length; i++) {
        const item = e.dataTransfer.items[i];
        if (item.kind === 'file') {
          const entry = item.webkitGetAsEntry();
          if (entry) {
            entries.push(entry);
          }
        }
      }

      if (entries.length > 0) {
        const filesPromises = entries.map(entry => traverseFileTree(entry));
        const filesArrays = await Promise.all(filesPromises);
        const pdfFiles = filesArrays.flat();

        if (pdfFiles.length > 0) {
          playUploadSound();
          onFilesSelected(pdfFiles);
        }
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fallback for older browsers
      const files: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          files.push(file);
        }
      }
      if (files.length > 0) {
        playUploadSound();
        onFilesSelected(files);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
          files.push(file);
        }
      }
      if (files.length > 0) {
        playUploadSound();
        onFilesSelected(files);
      }
    }
  };

  const handleClick = () => {
    if (onHoverSound) onHoverSound();
    fileInputRef.current?.click();
  };

  const handleMouseEnter = () => {
    if (onHoverSound) onHoverSound();
  };

  return (
    <div
      className={`dropzone-container ${isDragOver ? 'is-drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
    >
      <div className="cyber-bracket bracket-tl"></div>
      <div className="cyber-bracket bracket-tr"></div>
      <div className="cyber-bracket bracket-bl"></div>
      <div className="cyber-bracket bracket-br"></div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".pdf,application/pdf"
        multiple
        style={{ display: 'none' }}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
        <UploadCloud 
          size={36} 
          style={{ 
            color: isDragOver ? '#bd00ff' : '#00f0ff', 
            filter: `drop-shadow(0 0 8px ${isDragOver ? '#bd00ff' : '#00f0ff'})`,
            transition: 'all 0.3s ease'
          }} 
        />
        <h3 style={{ fontFamily: 'var(--font-cyber)', fontSize: '0.95rem', letterSpacing: '0.5px' }}>
          LOAD DOCUMENTS
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          Drag & Drop PDF files here, or tap to browse
        </p>
      </div>
    </div>
  );
};
export default UploadZone;
