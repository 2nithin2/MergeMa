import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { playUploadSound } from '../utils/audioEffects';

// Helper to recursively traverse folders dropped into the dropzone
const traverseFileTree = async (item: any, mode: 'pdf' | 'image'): Promise<File[]> => {
  return new Promise((resolve) => {
    if (item.isFile) {
      item.file(
        (file: File) => {
          const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
          const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|tiff)$/i.test(file.name);
          
          if (mode === 'pdf' && isPdf) {
            resolve([file]);
          } else if (mode === 'image' && isImage) {
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
        const promises = entries.map(entry => traverseFileTree(entry, mode));
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
  mode: 'pdf' | 'image';
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFilesSelected, onHoverSound, mode }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const isFileValid = (file: File): boolean => {
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(jpe?g|png|webp|bmp|gif|tiff)$/i.test(file.name);
    
    if (mode === 'pdf') return isPdf;
    if (mode === 'image') return isImage;
    return false;
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
        const filesPromises = entries.map(entry => traverseFileTree(entry, mode));
        const filesArrays = await Promise.all(filesPromises);
        const filteredFiles = filesArrays.flat();

        if (filteredFiles.length > 0) {
          playUploadSound();
          onFilesSelected(filteredFiles);
        }
      }
    } else if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files: File[] = [];
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i];
        if (isFileValid(file)) {
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
        if (isFileValid(file)) {
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
        accept={mode === 'pdf' ? '.pdf,application/pdf' : 'image/*,.jpg,.jpeg,.png,.webp,.bmp,.gif,.tiff'}
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
          {mode === 'pdf' ? 'LOAD DOCUMENTS' : 'LOAD IMAGES'}
        </h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {mode === 'pdf' 
            ? 'Drag & Drop PDF files here, or tap to browse' 
            : 'Drag & Drop image files (JPG, PNG, WEBP, etc.) here, or tap to browse'
          }
        </p>
      </div>
    </div>
  );
};

export default UploadZone;
