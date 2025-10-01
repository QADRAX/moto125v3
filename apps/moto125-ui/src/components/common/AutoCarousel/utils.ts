/**
 * Returns item offsets and the index currently in view (by left edge).
 */
export function getOffsets(root: HTMLUListElement | null) {
  if (!root) return { offsets: [] as number[], idx: 0 };
  const lis = Array.from(root.querySelectorAll<HTMLLIElement>("li[data-index]"));
  const offsets = lis.map((li) => li.offsetLeft);
  const sl = root.scrollLeft;
  let idx = 0;
  for (let i = 0; i < offsets.length; i++) {
    if (offsets[i] <= sl + 1) idx = i;
    else break;
  }
  return { offsets, idx };
}

/**
 * Smoothly scrolls the list to a given item index.
 */
export function scrollToIndex(root: HTMLUListElement | null, nextIdx: number) {
  if (!root) return;
  const lis = root.querySelectorAll<HTMLLIElement>("li[data-index]");
  const target = lis[nextIdx];
  if (!target) return;
  root.scrollTo({ left: target.offsetLeft, behavior: "smooth" });
}

/**
 * Card-level click handler:
 * - If the click target is already an interactive element, do nothing.
 * - Otherwise, finds first <a> inside the card and forwards the click.
 */
export function handleCardClick(e: React.MouseEvent<HTMLLIElement, MouseEvent>) {
  const target = e.target as HTMLElement;
  const interactive = target.closest(
    "a, button, input, textarea, select, label, [role='button']"
  );
  if (interactive) return;

  const anchor = (e.currentTarget as HTMLElement).querySelector("a") as
    | HTMLAnchorElement
    | null;

  anchor?.click();
}
