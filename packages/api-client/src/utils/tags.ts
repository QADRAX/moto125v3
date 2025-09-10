import { TagComponentItem } from '../types/entities';

/**
 * Try to extract human-readable strings from unknown tag component items.
 * Adjust keys when you formalize the component shape.
 */
export function extractTagStrings(items?: TagComponentItem[] | null): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((it) => it?.name ?? it?.text ?? it?.label ?? it?.value ?? '')
    .map((s) => (typeof s === 'string' ? s.trim() : ''))
    .filter(Boolean);
}
