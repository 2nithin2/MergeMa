import { PDFDocument } from 'pdf-lib';

export interface CompressImageResult {
  blob: Blob;
  width: number;
  height: number;
  sizeBytes: number;
  qualityUsed: number;
  scaleUsed: number;
}

/**
 * Loads an image from a URL string.
 */
export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image source"));
    img.src = url;
  });
}

/**
 * Core image compressor using HTML5 canvas.
 * For lossy formats (JPEG, WEBP), performs binary search on quality.
 * For lossless PNG, or if target size isn't met at lowest quality, scales down dimensions.
 */
export async function compressImage(
  file: File,
  format: 'jpeg' | 'png' | 'webp',
  targetSizeKb?: number,
  initialScale = 1.0,
  maxWidth = 4096,
  maxHeight = 4096
): Promise<CompressImageResult> {
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(objectUrl);
    
    let scale = initialScale;
    // Apply max bounds
    if (img.width * scale > maxWidth || img.height * scale > maxHeight) {
      scale = Math.min(maxWidth / img.width, maxHeight / img.height);
    }

    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const isLossy = format === 'jpeg' || format === 'webp';

    let minQuality = 0.05;
    let maxQuality = 0.95;
    let quality = 0.85;

    let finalBlob: Blob | null = null;
    let finalWidth = img.width;
    let finalHeight = img.height;
    
    let attempts = 0;
    const maxAttempts = 12;

    const canvas = document.createElement('canvas');

    while (attempts < maxAttempts) {
      const width = Math.max(10, Math.round(img.width * scale));
      const height = Math.max(10, Math.round(img.height * scale));
      
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error("Failed to obtain canvas context");
      }

      // Draw background (white background for JPEGs since they don't support transparency)
      if (format === 'jpeg') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Export blob
      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((res) => {
          if (res) resolve(res);
          else reject(new Error("Canvas blob conversion failed"));
        }, mimeType, isLossy ? quality : undefined);
      });

      finalBlob = blob;
      finalWidth = width;
      finalHeight = height;

      if (!targetSizeKb) {
        // No target size constraint, exit immediately
        break;
      }

      const sizeKb = blob.size / 1024;

      // Check if we met target size
      if (isLossy) {
        if (sizeKb <= targetSizeKb && sizeKb >= targetSizeKb * 0.90) {
          // Close enough to target size!
          break;
        }

        if (sizeKb > targetSizeKb) {
          // Too large, need to compress more
          maxQuality = quality;
          quality = (minQuality + maxQuality) / 2;

          // If quality is very low but still too large, downscale image dimensions
          if (quality < 0.12 && scale > 0.2) {
            scale *= 0.8;
            minQuality = 0.1;
            maxQuality = 0.9;
            quality = 0.7; // reset quality search for new smaller dimensions
          }
        } else {
          // Too small (less than 90% of target). Try increasing quality
          minQuality = quality;
          quality = (minQuality + maxQuality) / 2;
          
          // If we are close to 100% quality and still small, it's fine.
          if (maxQuality - minQuality < 0.05) {
            break;
          }
        }
      } else {
        // Lossless PNG: can only change resolution to hit target size
        if (sizeKb <= targetSizeKb && sizeKb >= targetSizeKb * 0.85) {
          break;
        }

        if (sizeKb > targetSizeKb && scale > 0.15) {
          scale *= 0.8;
        } else {
          // We are under the limit!
          break;
        }
      }

      attempts++;
    }

    if (!finalBlob) {
      throw new Error("Image compression failed to write output blob");
    }

    return {
      blob: finalBlob,
      width: finalWidth,
      height: finalHeight,
      sizeBytes: finalBlob.size,
      qualityUsed: isLossy ? quality : 1.0,
      scaleUsed: scale
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Convers compressed image blob into a single-page PDF document.
 */
export async function convertImageToPdf(
  imageBlob: Blob,
  imageFormat: 'jpeg' | 'png' | 'webp'
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  
  // Read blob bytes
  const arrayBuffer = await imageBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  let embeddedImage;
  // If the format is webp, pdf-lib can't embed webp directly. 
  // We need to render the webp onto a canvas, output as jpeg, and embed it as jpeg.
  if (imageFormat === 'webp') {
    const objectUrl = URL.createObjectURL(imageBlob);
    try {
      const img = await loadImage(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Canvas context creation failed during PDF embedding");
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      const jpegBlob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob((b) => {
          if (b) resolve(b);
          else reject(new Error("Fallback JPEG blob creation failed"));
        }, 'image/jpeg', 0.9);
      });
      
      const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
      embeddedImage = await pdfDoc.embedJpg(jpegBytes);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  } else if (imageFormat === 'png') {
    embeddedImage = await pdfDoc.embedPng(bytes);
  } else {
    // jpeg
    embeddedImage = await pdfDoc.embedJpg(bytes);
  }

  const { width, height } = embeddedImage;
  
  // Add page with exact image dimensions
  const page = pdfDoc.addPage([width, height]);
  page.drawImage(embeddedImage, {
    x: 0,
    y: 0,
    width,
    height
  });

  return await pdfDoc.save();
}
