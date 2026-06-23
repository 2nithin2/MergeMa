import React, { useState } from 'react';
import Header from './components/Header';
import UploadZone from './components/UploadZone';
import PageOrganizer from './components/PageOrganizer';
import ControlPanel from './components/ControlPanel';
import StatusTerminal from './components/StatusTerminal';
import PagePreviewModal from './components/PagePreviewModal';
import { PdfPageInfo, extractPagesAsThumbnails, compilePdf } from './utils/pdfEngine';
import { playHoverSound, playProcessLoop, stopProcessLoop, playCompletionSound, playErrorSound } from './utils/audioEffects';

interface LoadedFile {
  uuid: string;
  name: string;
  pageCount: number;
}

export const App: React.FC = () => {
  const [filesMap] = useState<Map<string, ArrayBuffer>>(() => new Map());
  const [files, setFiles] = useState<LoadedFile[]>([]);
  const [pages, setPages] = useState<PdfPageInfo[]>([]);
  
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

  return (
    <div className="app-container">
      <Header onHoverSound={triggerHoverSound} />
      
      <div className="dashboard-layout">
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
        
        <main className="workspace-panel">
          <UploadZone
            onFilesSelected={handleFilesSelected}
            onHoverSound={triggerHoverSound}
          />
          
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
    </div>
  );
};

export default App;
