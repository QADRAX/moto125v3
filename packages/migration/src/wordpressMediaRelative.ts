import { getPool } from './db';
import { RowDataPacket } from 'mysql2/promise';

/** Build table name with WP prefix from env (defaults to "wp_"). */
function t(name: string): string {
  const prefix = process.env.WP_TABLE_PREFIX ?? 'wp_';
  return `\`${prefix}${name}\``;
}

/**
 * Extract the "relative to wp-content/uploads" path from a full uploads URL.
 * Example:
 *   https://site.com/wp-content/uploads/2021/05/image.jpg -> 2021/05/image.jpg
 */
function extractRelativeFromUploadsUrl(url: string): string | null {
  const m = url.match(/\/wp-content\/uploads\/(.+)$/i);
  return m?.[1] ?? null;
}

/**
 * Parse `_wp_attachment_metadata` (PHP serialized) to try to extract the "file" entry.
 * This is a lightweight fallback, not a full PHP serializer.
 */
function tryExtractFileFromSerializedMetadata(serialized: string): string | null {
  // Look for: s:4:"file";s:<len>:"<path>";
  const m = serialized.match(/s:\d+:"file";s:\d+:"([^"]+)"/);
  return m?.[1] ?? null;
}

/**
 * Get the featured image relative path under "wp-content/uploads" for a given WP post ID.
 *
 * Lookup flow:
 *  1) wp_postmeta: (post_id = postId, meta_key = '_thumbnail_id') -> attachmentId
 *  2) wp_postmeta: (post_id = attachmentId, meta_key = '_wp_attached_file') -> relative path
 *  3) Fallback: wp_posts.guid (attachment) -> extract content after `/wp-content/uploads/`
 *  4) Fallback: wp_postmeta: (post_id = attachmentId, meta_key = '_wp_attachment_metadata') -> parse "file"
 *
 * @param postId WordPress post ID (the numeric ID)
 * @returns Relative path like "2021/05/image.jpg"
 * @throws if cannot resolve a featured image path
 */
export async function getFeaturedImageRelativePathFromDb(postId: number): Promise<string> {
  const pool = getPool();

  // 1) Read _thumbnail_id from postmeta
  const [rowsThumb] = await pool.query<(RowDataPacket & { meta_value: string })[]>(
    `SELECT meta_value
     FROM ${t('postmeta')}
     WHERE post_id = :postId AND meta_key = '_thumbnail_id'
     LIMIT 1`,
    { postId }
  );

  const thumbnailId = rowsThumb[0]?.meta_value ? Number(rowsThumb[0].meta_value) : null;
  if (!thumbnailId || Number.isNaN(thumbnailId)) {
    throw new Error(`No featured image (_thumbnail_id) for post ${postId}`);
  }

  // 2) Try _wp_attached_file (preferred and already relative)
  const [rowsAttachedFile] = await pool.query<(RowDataPacket & { meta_value: string })[]>(
    `SELECT meta_value
     FROM ${t('postmeta')}
     WHERE post_id = :attachmentId AND meta_key = '_wp_attached_file'
     LIMIT 1`,
    { attachmentId: thumbnailId }
  );

  const attachedFileRaw = rowsAttachedFile[0]?.meta_value?.trim();
  if (attachedFileRaw) {
    // Ensure it's a clean relative path (no leading slash)
    const cleaned = attachedFileRaw.replace(/^\/+/, '');
    return cleaned;
  }

  // 3) Fallback: use posts.guid and extract the relative part if it's a full URL
  const [rowsGuid] = await pool.query<(RowDataPacket & { guid: string })[]>(
    `SELECT guid
     FROM ${t('posts')}
     WHERE ID = :id
     LIMIT 1`,
    { id: thumbnailId }
  );

  const guid = rowsGuid[0]?.guid?.trim();
  if (guid) {
    const rel = extractRelativeFromUploadsUrl(guid);
    if (rel) return rel.replace(/^\/+/, '');
  }

  // 4) Fallback: parse _wp_attachment_metadata for "file"
  const [rowsMeta] = await pool.query<(RowDataPacket & { meta_value: string })[]>(
    `SELECT meta_value
     FROM ${t('postmeta')}
     WHERE post_id = :attachmentId AND meta_key = '_wp_attachment_metadata'
     LIMIT 1`,
    { attachmentId: thumbnailId }
  );

  const serialized = rowsMeta[0]?.meta_value;
  if (serialized) {
    const fileFromMeta = tryExtractFileFromSerializedMetadata(serialized);
    if (fileFromMeta) {
      return fileFromMeta.replace(/^\/+/, '');
    }
  }

  throw new Error(`Could not resolve featured image relative path for post ${postId}`);
}
