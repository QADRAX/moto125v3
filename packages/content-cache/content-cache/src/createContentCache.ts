import type {
  ContentCache,
  ContentCacheInitOptions,
} from "@moto125/content-cache-core";
import { ContentCacheImpl } from "./ContentCacheImpl";

export function createContentCache(): ContentCache {
  return new ContentCacheImpl();
}

export async function createAndStartContentCache(
  opts: ContentCacheInitOptions
): Promise<ContentCache> {
  const dm = createContentCache();
  await dm.init(opts);
  return dm;
}
