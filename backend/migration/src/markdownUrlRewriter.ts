/**
 * Rewrites Markdown URLs with two rules:
 *  - Images: move legacy "/images/..." (absolute to moto125.cc or relative) to the Azure Blob base.
 *  - Links: make them relative if they point to moto125.cc (keep externals untouched).
 *
 * Supported forms:
 *  - Inline image: ![alt](URL "title")
 *  - Inline link:  [text](URL "title")
 *  - Reference definitions: [id]: URL "title"
 */

const OLD_HOST_REGEX = /^https?:\/\/(?:www\.)?moto125\.cc/i;

function isLegacyImagesPath(url: string): boolean {
  try {
    if (url.startsWith('/images/')) return true;
    if (OLD_HOST_REGEX.test(url)) {
      const u = new URL(url);
      return u.pathname.startsWith('/images/');
    }
    return false;
  } catch {
    // if it's something odd, don't treat as legacy image
    return false;
  }
}

function toBlobForImage(url: string, blobBase: string): string {
  if (!url) return url;
  // already in blob? leave as is
  if (url.startsWith(blobBase)) return url;

  if (isLegacyImagesPath(url)) {
    const path = url.startsWith('http') ? new URL(url).pathname : url;
    return `${blobBase}${path}`.replace(/([^:]\/)\/+/g, '$1');
  }
  return url;
}

function toRelativeForLink(url: string): string {
  if (!url) return url;
  // already relative or anchor/mailto/etc
  if (/^(\/|#|mailto:|tel:)/i.test(url)) return url;

  try {
    if (OLD_HOST_REGEX.test(url)) {
      const u = new URL(url);
      // keep path + search + hash
      return `${u.pathname}${u.search}${u.hash}` || '/';
    }
  } catch {
    // not a valid absolute URL -> leave as-is
  }
  return url;
}

// Inline image: ![alt](url "title")
const IMAGE_INLINE =
  /!\[([^\]]*)\]\(\s*<?([^)\s]+)>?(?:\s+(".*?"|'.*?'|\([^)]+\)))?\s*\)/g;

// Inline link (negative lookbehind to ignore images): [text](url "title")
const LINK_INLINE =
  /(?<!\!)\[(.*?)\]\(\s*<?([^)\s]+)>?(?:\s+(".*?"|'.*?'|\([^)]+\)))?\s*\)/g;

// Reference definition: [id]: url "title"
const REF_DEF =
  /^\s*\[([^\]]+)\]:\s*<?([^>\s]+)>?(?:\s+(".*?"|'.*?'|\([^)]+\)))?\s*$/gmi;

export function rewriteMarkdownUrls(md: string, blobBase: string): string {
  // 1) Inline images
  md = md.replace(IMAGE_INLINE, (full, alt, url, title = '') => {
    const newUrl = toBlobForImage(url, blobBase);
    return `![${alt}](${newUrl}${title ? ` ${title}` : ''})`;
  });

  // 2) Inline links
  md = md.replace(LINK_INLINE, (full, text, url, title = '') => {
    const newUrl = toRelativeForLink(url);
    return `[${text}](${newUrl}${title ? ` ${title}` : ''})`;
  });

  // 3) Reference definitions
  md = md.replace(REF_DEF, (full, id, url, title = '') => {
    let newUrl = url;
    if (isLegacyImagesPath(url)) {
      newUrl = toBlobForImage(url, blobBase);
    } else if (OLD_HOST_REGEX.test(url)) {
      newUrl = toRelativeForLink(url);
    }
    return `[${id}]: ${newUrl}${title ? ` ${title}` : ''}`;
  });

  return md;
}
