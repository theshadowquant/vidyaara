import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatGrade(grade: number): string {
  return grade.toFixed(2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

/**
 * Automatically converts Google Drive URLs to /preview mode.
 * This prevents the mobile OS from popping up the Google Drive account selection dialog,
 * and opens the PDF directly inside the browser.
 */
export function formatGoogleDriveUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;

  // Match https://drive.google.com/file/d/FILE_ID/view...
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch && fileMatch[1]) {
    return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;
  }

  // Match https://drive.google.com/open?id=FILE_ID
  const idMatch = url.match(/drive\.google\.com\/.*[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) {
    return `https://drive.google.com/file/d/${idMatch[1]}/preview`;
  }

  return url;
}

/**
 * Converts a base64 Data URL to a native binary Blob.
 */
export function dataUrlToBlob(dataURI: string): Blob {
  const parts = dataURI.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
  const byteString = atob(parts[1]);
  const u8arr = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    u8arr[i] = byteString.charCodeAt(i);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Safely opens documents in a new tab.
 * For base64 Data URLs, converts to a native blob URL so Chrome's PDF viewer
 * renders the document instead of blocking top-level data: navigation.
 */
export function openDocumentInNewTab(url: string, title?: string) {
  if (!url || url === '#' || url === '#demo') return;

  if (url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const newTab = window.open(blobUrl, '_blank');
      if (!newTab) {
        // Fallback if popup blocker caught the window
        downloadDocument(url, title || 'document.pdf');
      }
      return;
    } catch (err) {
      console.error('Failed to open data URL in new tab:', err);
    }
  }

  const target = formatGoogleDriveUrl(url);
  window.open(target, '_blank', 'noopener,noreferrer');
}

/**
 * Downloads document directly to the client PC.
 */
export function downloadDocument(url: string, fileName?: string) {
  if (!url || url === '#' || url === '#demo') return;

  const defaultName = 'document.pdf';
  const cleanName = fileName ? (fileName.includes('.') ? fileName : `${fileName}.pdf`) : defaultName;

  if (url.startsWith('data:')) {
    try {
      const blob = dataUrlToBlob(url);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 20000);
      return;
    } catch (err) {
      console.error('Failed to download data URL:', err);
    }
  }

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.download = cleanName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
