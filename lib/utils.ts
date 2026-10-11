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
