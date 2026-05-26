const EXPIRY_MS = 24 * 60 * 60 * 1000;

function key(boardCode: string) {
  return `unclaimed:${boardCode}`;
}

export function getUnclaimedLinks(boardCode: string): string[] {
  try {
    const raw = localStorage.getItem(key(boardCode));
    if (!raw) return [];
    const data = JSON.parse(raw) as { ids: string[]; ts: number };
    if (Date.now() - data.ts > EXPIRY_MS) {
      localStorage.removeItem(key(boardCode));
      return [];
    }
    return data.ids;
  } catch {
    return [];
  }
}

export function addUnclaimedLink(boardCode: string, linkId: string) {
  const ids = getUnclaimedLinks(boardCode);
  ids.push(linkId);
  localStorage.setItem(key(boardCode), JSON.stringify({ ids, ts: Date.now() }));
}

export function clearUnclaimedLinks(boardCode: string) {
  localStorage.removeItem(key(boardCode));
}
