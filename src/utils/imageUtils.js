/**
 * Image URL Utilities
 * Handles Google Drive URL normalization and image URL validation
 */

/**
 * Check if a URL is a Google Drive sharing URL
 */
export const isGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const patterns = [
    /drive\.google\.com\/file\/d\//,
    /drive\.google\.com\/uc/,
    /drive\.google\.com\/open/,
    /drive\.google\.com\/folders\//,
    /drive\.google\.com\/drive\/folders/
  ];
  
  return patterns.some(pattern => pattern.test(url));
};

/**
 * Extract Google Drive File ID from various URL formats
 */
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
  
  // Pattern 4: /folders/FILE_ID
  match = url.match(/\/folders\/([^/?]+)/);
  if (match) return match[1];
  
  return null;
};

/**
 * Normalize Google Drive URL to direct image URL
 */
export const normalizeGoogleDriveUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  const fileId = extractGoogleDriveFileId(url);
  if (!fileId) return url;
  
  // Return direct download URL
  return `https://drive.google.com/uc?export=view&id=${fileId}`;
};

/**
 * Normalize any image URL
 * - Converts Google Drive URLs to direct URLs
 * - Returns unchanged for other URLs
 */
export const normalizeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  
  // Trim whitespace
  const trimmed = url.trim();
  if (!trimmed) return trimmed;
  
  // Check if it's a Google Drive URL
  if (isGoogleDriveUrl(trimmed)) {
    return normalizeGoogleDriveUrl(trimmed);
  }
  
  // Return unchanged for other URLs
  return trimmed;
};

/**
 * Check if a URL appears to be a valid image URL
 */
export const isValidImageUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  
  const trimmed = url.trim();
  if (!trimmed) return false;
  
  // Check if it's a Google Drive URL (valid)
  if (isGoogleDriveUrl(trimmed)) return true;
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico|tiff?|avif|heic|heif)(\?.*)?$/i;
  if (imageExtensions.test(trimmed)) return true;
  
  // Check if it starts with http/https and doesn't look like a page
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    // Avoid HTML pages
    const htmlExtensions = /\.(html|htm|php|asp|aspx)$/i;
    if (htmlExtensions.test(trimmed)) return false;
    
    // Check if it contains common image CDN patterns
    const cdnPatterns = [
      /googleapis\.com/,
      /cloudinary\.com/,
      /imgix\.net/,
      /cdn\./,
      /images\./
    ];
    if (cdnPatterns.some(pattern => pattern.test(trimmed))) return true;
    
    // If it's a direct URL without extension, it might still be an image
    // Return true for most HTTP URLs that don't look like pages
    return true;
  }
  
  return false;
};

/**
 * Get a safe image URL for preview
 */
export const getPreviewImageUrl = (url) => {
  if (!url) return null;
  return normalizeImageUrl(url);
};
