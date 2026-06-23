import * as pdfjs from 'pdfjs-dist';
import { PDFDocument, degrees } from 'pdf-lib';

// Configure PDF.js worker to run client-side using unpkg CDN
const pdfjsVersion = pdfjs.version || '5.4.624';
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

export interface PdfPageInfo {
  id: string; // unique page instance ID (for drag-drop keys)
  originalFileUuid: string;
  originalFileName: string;
  pageIndex: number; // 0-indexed original page
  rotation: number;  // 0, 90, 180, 270
  width: number;
  height: number;
  thumbnail: string; // Data URL
}

/**
 * Extracts pages from a PDF File and renders them to canvas thumbnails
 */
export async function extractPagesAsThumbnails(
  file: File,
  fileUuid: string,
  onProgress?: (progressText: string) => void
): Promise<PdfPageInfo[]> {
  const arrayBuffer = await file.arrayBuffer();
  
  if (onProgress) onProgress(`Loading document: ${file.name}...`);
  
  // Load PDF document using PDF.js
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const pageInfos: PdfPageInfo[] = [];

  for (let i = 1; i <= numPages; i++) {
    if (onProgress) {
      onProgress(`Rendering page ${i} of ${numPages} for preview...`);
    }

    const page = await pdfDoc.getPage(i);
    
    // Scale for visual thumbnail preview (around 150-200px width)
    const originalViewport = page.getViewport({ scale: 1.0 });
    const scale = 180 / originalViewport.width;
    const viewport = page.getViewport({ scale });

    // Create a temporary canvas to draw the thumbnail
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (context) {
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const renderContext = {
        canvasContext: context,
        viewport: viewport,
        canvas: canvas,
      };

      await page.render(renderContext).promise;
      const thumbnail = canvas.toDataURL('image/jpeg', 0.85);

      pageInfos.push({
        id: `${fileUuid}-${i - 1}-${Math.random().toString(36).substr(2, 9)}`,
        originalFileUuid: fileUuid,
        originalFileName: file.name,
        pageIndex: i - 1,
        rotation: 0,
        width: originalViewport.width,
        height: originalViewport.height,
        thumbnail
      });
    }
  }

  return pageInfos;
}

/**
 * Merges and compiles selected pages with specific rotations into a new PDF
 */
export async function compilePdf(
  pages: PdfPageInfo[],
  filesMap: Map<string, ArrayBuffer>,
  onProgress?: (progressText: string) => void
): Promise<Uint8Array> {
  if (onProgress) onProgress("Initializing compiler engine...");
  const newPdf = await PDFDocument.create();
  
  // Cache parsed PDF documents to avoid parsing the same document multiple times
  const docCache = new Map<string, PDFDocument>();

  for (let i = 0; i < pages.length; i++) {
    const pageInfo = pages[i];
    if (onProgress) {
      onProgress(`Compiling page ${i + 1} of ${pages.length} (${pageInfo.originalFileName})...`);
    }

    let srcDoc = docCache.get(pageInfo.originalFileUuid);
    if (!srcDoc) {
      const bytes = filesMap.get(pageInfo.originalFileUuid);
      if (!bytes) {
        throw new Error(`Binary buffer missing for document reference: ${pageInfo.originalFileName}`);
      }
      srcDoc = await PDFDocument.load(bytes);
      docCache.set(pageInfo.originalFileUuid, srcDoc);
    }

    // Copy page from source document
    const [copiedPage] = await newPdf.copyPages(srcDoc, [pageInfo.pageIndex]);

    // Apply rotation
    if (pageInfo.rotation !== 0) {
      // Accumulate rotation properly
      copiedPage.setRotation(degrees(pageInfo.rotation));
    }

    newPdf.addPage(copiedPage);
  }

  if (onProgress) onProgress("Packing pages and compressing document structure...");
  const compiledBytes = await newPdf.save();
  return compiledBytes;
}
