/**
 * Image URL Utilities
 * Handles Google Drive URL normalization
 */

export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const patterns = [
    /drive\.google\.com\/file\/d\//,
    /drive\.google\.com\/uc/,
    /drive\.google\.com\/open/,
    /drive\.google\.com\/folders\//
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

export const extractGoogleDriveFileId = (url) => {
  if (!url || typeof url !== 'string') return null;
  
  // Pattern 1: /file/d/FILE_ID/
  let match = url.match(/\/file\/d\/([^/]+)/);
  if (match) return match[1];
  
  // Pattern 2: id=FILE_ID
  match = url.match(/[?&]id=([^&]+)/);
  if (match) return match[1];
  
  // Pattern 3: open?id=FILE_ID
  match = url.match(/open\?id=([^&]+)/);
  if (match) return match[1];
  
  return null;
};

export const normalizeGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  // Use googleusercontent.com format - much more reliable for direct image embedding
  return `https://lh3.googleusercontent.com/d/${fileId}`;
};

export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  if (isGoogleDriveUrl(trimmed)) {
    return normalizeGoogleDriveUrl(trimmed);
  }
  
  return trimmed;
};
