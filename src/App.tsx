import React, { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PageOrganizer from './components/PageOrganizer';
import ControlPanel from './components/ControlPanel';
import StatusTerminal from './components/StatusTerminal';
import PagePreviewModal from './components/PagePreviewModal';
import { PdfPageInfo, extractPagesAsThumbnails, compilePdf } from './utils/pdfEngine';
import { playHoverSound, playProcessLoop, stopProcessLoop, playCompletionSound, playErrorSound, playReorderSound } from './utils/audioEffects';

// New Image Compressor components and utilities
import ImageControlPanel, { CompressionSettings } from './components/ImageControlPanel';
import ImageWorkspace, { ImageFileItem } from './components/ImageWorkspace';
import ImagePreviewModal from './components/ImagePreviewModal';
import { compressImage, convertImageToPdf } from './utils/imageCompressor';

interface LoadedFile {
  uuid: string;
  name: string;
  pageCount: number;
}

export const App: React.FC = () => {
  // App mode: PDF processing or Image Compressor
  const [mode, setMode] = useState<'pdf' | 'image'>('pdf');

  // PDF state
  const [filesMap] = useState<Map<string, ArrayBuffer>>(() => new Map());
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  
  // Image compressor state
  const [imageFiles, setImageFiles] = useState<ImageFileItem[]>([]);
  const [previewImageUuid, setPreviewImageUuid] = useState<string | null>(null);
  const [imageSettings, setImageSettings] = useState<CompressionSettings>({
    format: 'jpeg',
    targetSizeKb: 100,
    maxWidth: 2048,
    maxHeight: 2048
  });

  // Compiler modal and logs state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileTitle, setCompileTitle] = useState('COMPILING SYSTEM MATRIX');
  const [logs, setLogs] = useState<string[]>([]);
  
  // Preview page modal state
  const [previewPage, setPreviewPage] = useState<PdfPageInfo | null>(null);

  // Sound effects helper
  const triggerHoverSound = () => {
    playHoverSound();
  };

  const handleModeChange = (newMode: 'pdf' | 'image') => {
    playReorderSound();
    setMode(newMode);
  };

  // ==========================================
  // PDF PROCESSOR HANDLERS
  // ==========================================

  // Files selected callback
  const handleFilesSelected = async (newFiles: File[]) => {
    setIsCompiling(true);
    setCompileTitle('ANALYZING INCOMING SECTOR FILES');
    setLogs(['> Initializing memory injection protocols...', `> Processing ${newFiles.length} file(s)...`]);
    playProcessLoop();

    try {
      const newPagesList: PdfPageInfo[] = [];
      const updatedFiles: LoadedFile[] = [...files];

      for (const file of newFiles) {
        let finalName = file.name;
        let counter = 1;
        while (updatedFiles.some(f => f.name === finalName)) {
          const dotIdx = file.name.lastIndexOf('.');
          if (dotIdx !== -1) {
            const base = file.name.substring(0, dotIdx);
            const ext = file.name.substring(dotIdx);
            finalName = `${base} (${counter})${ext}`;
          } else {
            finalName = `${file.name} (${counter})`;
          }
          counter++;
        }

        const uuid = `file-${Math.random().toString(36).substr(2, 9)}`;
        const buffer = await file.arrayBuffer();
        
        // Add to files binary map
        filesMap.set(uuid, buffer);

        // Extract pages visual metadata
        const extractedPages = await extractPagesAsThumbnails(file, uuid, (statusText) => {
          setLogs(prev => [...prev, statusText]);
        });

        // Use resolved unique filename
        extractedPages.forEach(p => {
          p.originalFileName = finalName;
        });

        updatedFiles.push({
          uuid,
          name: finalName,
          pageCount: extractedPages.length
        });

        newPagesList.push(...extractedPages);
      }

      setFiles(updatedFiles);
      setPages(prev => [...prev, ...newPagesList]);
      setLogs(prev => [...prev, '✔ Sector files analysis complete. Workspace initialized.']);
      playCompletionSound();
    } catch (error: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ CRITICAL FAILURE: ${error?.message || error}`]);
    } finally {
      stopProcessLoop();
      // Brief timeout to let the user see the success log before closing
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }
  };

  // Remove a loaded file and its pages
  const handleRemoveFile = (uuid: string) => {
    // Clean binary cache
    filesMap.delete(uuid);

    // Filter files list
    setFiles(files.filter(f => f.uuid !== uuid));

    // Filter pages list
    setPages(pages.filter(p => p.originalFileUuid !== uuid));
  };

  // Reorder loaded files and rearrange workspace pages accordingly
  const handleReorderFiles = (updatedFiles: LoadedFile[]) => {
    setFiles(updatedFiles);
    
    // Group pages by originalFileUuid
    const pagesMap = new Map<string, PdfPageInfo[]>();
    pages.forEach(p => {
      const list = pagesMap.get(p.originalFileUuid) || [];
      list.push(p);
      pagesMap.set(p.originalFileUuid, list);
    });
    
    // Re-assemble pages in the order of updatedFiles
    const reassembled: PdfPageInfo[] = [];
    updatedFiles.forEach(f => {
      const filePages = pagesMap.get(f.uuid) || [];
      reassembled.push(...filePages);
    });
    
    setPages(reassembled);
  };

  // Clear workspace
  const handleClearAll = () => {
    filesMap.clear();
    setFiles([]);
    setPages([]);
  };

  // Reorder workspace pages
  const handleReorderPages = (reorderedPages: PdfPageInfo[]) => {
    setPages(reorderedPages);
  };

  // Rotate individual page
  const handleRotatePage = (pageId: string, direction: 'cw' | 'ccw') => {
    setPages(pages.map(page => {
      if (page.id === pageId) {
        // Accumulate rotation inside [0, 360) boundary
        let rotationChange = direction === 'cw' ? 90 : -90;
        let newRot = (page.rotation + rotationChange) % 360;
        if (newRot < 0) newRot += 360;
        return { ...page, rotation: newRot };
      }
      return page;
    }));
  };

  // Delete individual page from workspace
  const handleDeletePage = (pageId: string) => {
    setPages(pages.filter(page => page.id !== pageId));
  };

  // Bulk rotation
  const handleRotateAll = (angle: 90 | -90) => {
    setPages(pages.map(page => {
      let newRot = (page.rotation + angle) % 360;
      if (newRot < 0) newRot += 360;
      return { ...page, rotation: newRot };
    }));
  };

  // Mix Pages (alternate Document A and Document B pages)
  const handleMixPages = (fileAUuid: string, fileBUuid: string) => {
    setIsCompiling(true);
    setCompileTitle('AUTOSORTING SECTOR LAYERS');
    setLogs(['> Commencing automatic page alternation matrix...', '> Sorting documents by index...']);
    playProcessLoop();

    setTimeout(() => {
      const pagesA = pages.filter(p => p.originalFileUuid === fileAUuid).sort((a, b) => a.pageIndex - b.pageIndex);
      const pagesB = pages.filter(p => p.originalFileUuid === fileBUuid).sort((a, b) => a.pageIndex - b.pageIndex);

      const mixed: PdfPageInfo[] = [];
      const maxLen = Math.max(pagesA.length, pagesB.length);

      for (let i = 0; i < maxLen; i++) {
        if (i < pagesA.length) mixed.push(pagesA[i]);
        if (i < pagesB.length) mixed.push(pagesB[i]);
      }

      // Add any other pages (not belonging to A and B) to the end of the workspace
      const otherPages = pages.filter(p => p.originalFileUuid !== fileAUuid && p.originalFileUuid !== fileBUuid);

      setPages([...mixed, ...otherPages]);
      setLogs(prev => [...prev, '✔ Workspace reordered successfully. Alternating pages injected.']);
      playCompletionSound();
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }, 600);
  };

  // Initiate PDF file download
  const triggerDownload = (bytes: Uint8Array, name: string) => {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Compile full workspace (Merge & Reorder)
  const handleMergeCompile = async (filename: string) => {
    setIsCompiling(true);
    setCompileTitle('COMPILING INTEGRATED FILES');
    setLogs(['> Initiating merge compiler...', `> Pages to process: ${pages.length}`]);
    playProcessLoop();

    try {
      const bytes = await compilePdf(pages, filesMap, (msg) => {
        setLogs(prev => [...prev, `> ${msg}`]);
      });
      
      setLogs(prev => [...prev, `✔ Saved PDF bytes size: ${(bytes.length / 1024).toFixed(1)} KB`]);
      setLogs(prev => [...prev, `> Downloading compiled file: ${filename}...`]);

      triggerDownload(bytes, filename);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ COMPILE ERROR: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1200);
    }
  };

  // Parse page ranges (e.g. "1-3, 5, 8") into list of 0-indexed workspace pages
  const parsePageRanges = (rangeStr: string, maxPages: number): number[] => {
    const list: number[] = [];
    const parts = rangeStr.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);
        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.min(start, end);
          const to = Math.max(start, end);
          for (let i = from; i <= to; i++) {
            if (i >= 1 && i <= maxPages) {
              list.push(i - 1);
            }
          }
        }
      } else {
        const idx = parseInt(trimmed, 10);
        if (!isNaN(idx) && idx >= 1 && idx <= maxPages) {
          list.push(idx - 1);
        }
      }
    }
    return Array.from(new Set(list)); // Deduplicate
  };

  // Split Ranges trigger
  const handleSplitCompile = async (rangeText: string, filename: string) => {
    setIsCompiling(true);
    setCompileTitle('EXTRACTING PAGE MATRIX');
    setLogs(['> Initiating split range compiler...', `> Input range: ${rangeText}`]);
    playProcessLoop();

    try {
      const selectedIndices = parsePageRanges(rangeText, pages.length);
      if (selectedIndices.length === 0) {
        throw new Error('Range specification did not match any pages in the workspace.');
      }

      setLogs(prev => [...prev, `> Resolved to pages: ${selectedIndices.map(i => i + 1).join(', ')}`]);
      
      const subsetPages = selectedIndices.map(idx => pages[idx]);
      
      const bytes = await compilePdf(subsetPages, filesMap, (msg) => {
        setLogs(prev => [...prev, `> ${msg}`]);
      });

      triggerDownload(bytes, filename);
      setLogs(prev => [...prev, `✔ Split range complete. Extracted file downloaded.`]);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ SPLIT ERROR: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1500);
    }
  };

  // Split Every Single Page
  const handleSplitEveryPage = async () => {
    setIsCompiling(true);
    setCompileTitle('EXPLODING DOC INTO PAGES');
    setLogs(['> Commencing multi-file explode sequence...', `> Workspace contains ${pages.length} pages`]);
    playProcessLoop();

    try {
      for (let i = 0; i < pages.length; i++) {
        const singlePage = pages[i];
        setLogs(prev => [...prev, `> Compiling individual page ${i + 1}...`]);
        
        const bytes = await compilePdf([singlePage], filesMap, () => {});
        
        const filename = `page_${i + 1}_of_${pages.length}.pdf`;
        triggerDownload(bytes, filename);
        
        // Brief sleep to allow window download queue to catch up and not block
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setLogs(prev => [...prev, '✔ Explode sequence finished. All page files dispatched.']);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ SPLIT-ALL ERROR: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1500);
    }
  };

  // ==========================================
  // IMAGE COMPRESSOR HANDLERS
  // ==========================================

  // Image files selected callback
  const handleImageFilesSelected = async (newFiles: File[]) => {
    setIsCompiling(true);
    setCompileTitle('ANALYZING INCOMING SECTOR IMAGES');
    setLogs(['> Initializing image buffer registry...', `> Processing ${newFiles.length} image(s)...`]);
    playProcessLoop();

    try {
      const newImageItems: ImageFileItem[] = [];

      for (const file of newFiles) {
        setLogs(prev => [...prev, `> Reading image dimensions: ${file.name}...`]);
        
        const objectUrl = URL.createObjectURL(file);
        
        // Wait to load image to get width and height
        const dimensions: { width: number; height: number } = await new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve({ width: img.width, height: img.height });
          img.onerror = () => resolve({ width: 0, height: 0 });
          img.src = objectUrl;
        });

        newImageItems.push({
          uuid: `image-${Math.random().toString(36).substr(2, 9)}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          previewUrl: objectUrl,
          compressionStatus: 'idle'
        });
      }

      setImageFiles(prev => [...prev, ...newImageItems]);
      setLogs(prev => [...prev, `✔ ${newImageItems.length} image files queued successfully.`]);
      playCompletionSound();
    } catch (error: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ IMAGE LOAD FAILURE: ${error?.message || error}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }
  };

  // Remove a loaded image
  const handleRemoveImage = (uuid: string) => {
    setImageFiles(prev => {
      const item = prev.find(img => img.uuid === uuid);
      if (item) {
        URL.revokeObjectURL(item.previewUrl);
        if (item.compressedPreviewUrl) {
          URL.revokeObjectURL(item.compressedPreviewUrl);
        }
      }
      return prev.filter(img => img.uuid !== uuid);
    });
  };

  // Clear all images from memory
  const handleClearAllImages = () => {
    imageFiles.forEach(item => {
      URL.revokeObjectURL(item.previewUrl);
      if (item.compressedPreviewUrl) {
        URL.revokeObjectURL(item.compressedPreviewUrl);
      }
    });
    setImageFiles([]);
  };

  // Compress all image files
  const handleCompressAllImages = async (settings: CompressionSettings) => {
    setImageSettings(settings);
    setIsCompiling(true);
    setCompileTitle('COMPRESSING IMAGE MATRIX');
    setLogs([
      '> Initializing hardware compression cores...',
      `> Target Format: ${settings.format.toUpperCase()}`,
      `> Target Size Limit: ${settings.targetSizeKb ? settings.targetSizeKb + ' KB' : 'None (Best Quality)'}`,
      `> Dimension Limit: ${settings.maxWidth} x ${settings.maxHeight}`
    ]);
    playProcessLoop();

    try {
      const updatedList = [...imageFiles];

      for (let i = 0; i < updatedList.length; i++) {
        const item = updatedList[i];
        setLogs(prev => [...prev, `> Compressing file [${i + 1}/${updatedList.length}]: ${item.name}...`]);

        updatedList[i] = { ...item, compressionStatus: 'compressing' };
        setImageFiles([...updatedList]);

        try {
          const imgFormat = settings.format === 'pdf' ? 'jpeg' : settings.format;
          
          const result = await compressImage(
            item.file,
            imgFormat,
            settings.targetSizeKb,
            1.0,
            settings.maxWidth,
            settings.maxHeight
          );

          let outputBlob = result.blob;

          if (settings.format === 'pdf') {
            const pdfBytes = await convertImageToPdf(result.blob, imgFormat);
            outputBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
          }

          if (item.compressedPreviewUrl) {
            URL.revokeObjectURL(item.compressedPreviewUrl);
          }

          updatedList[i] = {
            ...item,
            compressedBlob: outputBlob,
            compressedSize: outputBlob.size,
            compressedWidth: result.width,
            compressedHeight: result.height,
            qualityUsed: result.qualityUsed,
            compressedPreviewUrl: URL.createObjectURL(outputBlob),
            compressionStatus: 'done'
          };

          const diff = ((item.originalSize - outputBlob.size) / item.originalSize * 100).toFixed(0);
          setLogs(prev => [
            ...prev,
            `  ✔ Optimized: ${(item.originalSize / 1024).toFixed(1)} KB -> ${(outputBlob.size / 1024).toFixed(1)} KB (-${diff}%)`
          ]);
        } catch (e: any) {
          updatedList[i] = {
            ...item,
            compressionStatus: 'error',
            errorMsg: e?.message || String(e)
          };
          setLogs(prev => [...prev, `  ✖ Error compressing: ${e?.message || e}`]);
        }

        setImageFiles([...updatedList]);
      }

      setLogs(prev => [...prev, '✔ Batch compression sweep complete. All nodes optimized.']);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ SWEEP ERROR: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }
  };

  // Compress a single image file on-demand
  const handleCompressSingleImage = async (uuid: string) => {
    const itemIdx = imageFiles.findIndex(img => img.uuid === uuid);
    if (itemIdx === -1) return;

    const item = imageFiles[itemIdx];
    const settings = imageSettings;

    setIsCompiling(true);
    setCompileTitle('OPTIMIZING TARGET IMAGE NODE');
    setLogs([
      `> Accessing memory register for ${item.name}...`,
      `> Target Format: ${settings.format.toUpperCase()}`,
      `> Target Size Limit: ${settings.targetSizeKb ? settings.targetSizeKb + ' KB' : 'None'}`
    ]);
    playProcessLoop();

    try {
      const updatedList = [...imageFiles];
      updatedList[itemIdx] = { ...item, compressionStatus: 'compressing' };
      setImageFiles([...updatedList]);

      const imgFormat = settings.format === 'pdf' ? 'jpeg' : settings.format;
      
      const result = await compressImage(
        item.file,
        imgFormat,
        settings.targetSizeKb,
        1.0,
        settings.maxWidth,
        settings.maxHeight
      );

      let outputBlob = result.blob;

      if (settings.format === 'pdf') {
        const pdfBytes = await convertImageToPdf(result.blob, imgFormat);
        outputBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      }

      if (item.compressedPreviewUrl) {
        URL.revokeObjectURL(item.compressedPreviewUrl);
      }

      updatedList[itemIdx] = {
        ...item,
        compressedBlob: outputBlob,
        compressedSize: outputBlob.size,
        compressedWidth: result.width,
        compressedHeight: result.height,
        qualityUsed: result.qualityUsed,
        compressedPreviewUrl: URL.createObjectURL(outputBlob),
        compressionStatus: 'done'
      };

      setImageFiles([...updatedList]);
      const diff = ((item.originalSize - outputBlob.size) / item.originalSize * 100).toFixed(0);
      setLogs(prev => [
        ...prev,
        `✔ Compression complete. Size reduced by ${diff}% (${(outputBlob.size / 1024).toFixed(1)} KB)`
      ]);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      const updatedList = [...imageFiles];
      updatedList[itemIdx] = {
        ...item,
        compressionStatus: 'error',
        errorMsg: e?.message || String(e)
      };
      setImageFiles([...updatedList]);
      setLogs(prev => [...prev, `✖ Single compression failure: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }
  };

  // Download a single compressed image
  const handleDownloadSingleImage = (uuid: string) => {
    const item = imageFiles.find(img => img.uuid === uuid);
    if (!item || !item.compressedBlob || item.compressionStatus !== 'done') return;

    const formatExt = imageSettings.format === 'pdf' ? 'pdf' : imageSettings.format === 'jpeg' ? 'jpg' : imageSettings.format;
    const dotIdx = item.name.lastIndexOf('.');
    const baseName = dotIdx !== -1 ? item.name.substring(0, dotIdx) : item.name;
    const downloadName = `${baseName}_optimized.${formatExt}`;

    triggerBlobDownload(item.compressedBlob, downloadName);
  };

  // Download all compressed images with a staggered delay
  const handleDownloadAllImages = async () => {
    const optimized = imageFiles.filter(img => img.compressionStatus === 'done' && img.compressedBlob);
    if (optimized.length === 0) return;

    setIsCompiling(true);
    setCompileTitle('DISPATCHING OPTIMIZED FILES');
    setLogs([`> Dispatching ${optimized.length} optimized nodes to download pipeline...`]);
    playProcessLoop();

    try {
      for (let i = 0; i < optimized.length; i++) {
        const item = optimized[i];
        setLogs(prev => [...prev, `> Exporting [${i + 1}/${optimized.length}]: ${item.name}...`]);
        handleDownloadSingleImage(item.uuid);
        
        // Wait 350ms to allow browser queue to process download
        await new Promise(resolve => setTimeout(resolve, 350));
      }
      setLogs(prev => [...prev, '✔ Download pipeline dispatch finished successfully.']);
      playCompletionSound();
    } catch (e: any) {
      playErrorSound();
      setLogs(prev => [...prev, `✖ DOWNLOAD PIPELINE FAIL: ${e?.message || e}`]);
    } finally {
      stopProcessLoop();
      setTimeout(() => {
        setIsCompiling(false);
      }, 1000);
    }
  };

  // Generic Blob Downloader
  const triggerBlobDownload = (blob: Blob, name: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const activePreviewImage = imageFiles.find(img => img.uuid === previewImageUuid);

  return (
    <div className="app-container">
      <Header onHoverSound={triggerHoverSound} />
      
      {/* Dynamic Mode Switcher Header */}
      <div className="mode-toggle-bar">
        <button 
          className={`mode-toggle-btn-main ${mode === 'pdf' ? 'active' : ''}`}
          onClick={() => handleModeChange('pdf')}
          onMouseEnter={triggerHoverSound}
        >
          PDF MATRIX SUITE
        </button>
        <button 
          className={`mode-toggle-btn-main ${mode === 'image' ? 'active' : ''}`}
          onClick={() => handleModeChange('image')}
          onMouseEnter={triggerHoverSound}
        >
          IMAGE COMPRESSOR & PORTAL EXPORT
        </button>
      </div>

      <div className="dashboard-layout">
        {mode === 'pdf' ? (
          <ControlPanel
            files={files}
            onRemoveFile={handleRemoveFile}
            onReorderFiles={handleReorderFiles}
            onMergeTrigger={handleMergeCompile}
            onSplitTrigger={handleSplitCompile}
            onSplitEveryPageTrigger={handleSplitEveryPage}
            onMixTrigger={handleMixPages}
            onRotateAllTrigger={handleRotateAll}
            hasPages={pages.length > 0}
          />
        ) : (
          <ImageControlPanel
            hasImages={imageFiles.length > 0}
            isProcessing={isCompiling}
            onCompressAll={handleCompressAllImages}
            onDownloadAll={handleDownloadAllImages}
            onClearAll={handleClearAllImages}
            imageCount={imageFiles.length}
          />
        )}
        
        <main className="workspace-panel">
          <UploadZone
            mode={mode}
            onFilesSelected={mode === 'pdf' ? handleFilesSelected : handleImageFilesSelected}
            onHoverSound={triggerHoverSound}
          />
          
          {mode === 'pdf' ? (
            <PageOrganizer
              pages={pages}
              files={files}
              onReorderPages={handleReorderPages}
              onRotatePage={handleRotatePage}
              onDeletePage={handleDeletePage}
              onPreviewPage={setPreviewPage}
              onClearAll={handleClearAll}
              onHoverSound={triggerHoverSound}
            />
          ) : (
            <ImageWorkspace
              images={imageFiles}
              onRemoveImage={handleRemoveImage}
              onPreviewImage={setPreviewImageUuid}
              onCompressSingle={handleCompressSingleImage}
              onDownloadSingle={handleDownloadSingleImage}
              onClearAll={handleClearAllImages}
            />
          )}
        </main>
      </div>

      <StatusTerminal
        isOpen={isCompiling}
        logs={logs}
        title={compileTitle}
      />

      {previewPage && (
        <PagePreviewModal
          pageInfo={previewPage}
          filesMap={filesMap}
          onClose={() => setPreviewPage(null)}
        />
      )}

      {activePreviewImage && (
        <ImagePreviewModal
          name={activePreviewImage.name}
          originalUrl={activePreviewImage.previewUrl}
          originalSize={activePreviewImage.originalSize}
          originalWidth={activePreviewImage.originalWidth}
          originalHeight={activePreviewImage.originalHeight}
          compressedUrl={activePreviewImage.compressedPreviewUrl}
          compressedSize={activePreviewImage.compressedSize}
          compressedWidth={activePreviewImage.compressedWidth}
          compressedHeight={activePreviewImage.compressedHeight}
          qualityUsed={activePreviewImage.qualityUsed}
          onClose={() => setPreviewImageUuid(null)}
        />
      )}
    </div>
  );
};

export default App;
