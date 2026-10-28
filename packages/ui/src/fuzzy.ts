/**
 * Subsequence fuzzy matching for the command palette and searchable trees.
 */

export interface ScoredItem<T> {
  item: T;
  score: number;
}

function isSeparator(ch: string | undefined): boolean {
  return ch === undefined || /[\s\-_./\\]/.test(ch);
}

/**
 * Returns a match score for `query` against `target`, or null when the query
 * is not a subsequence of the target. Higher is better. Earlier and
 * consecutive matches score higher, as do word-boundary starts.
 */
export function fuzzyScore(query: string, target: string): number | null {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  if (q.length === 0) return 0;

  let score = 0;
  let searchFrom = 0;
  let prevMatch = -1;

  for (let qi = 0; qi < q.length; qi++) {
    const ch = q[qi]!;
    const found = t.indexOf(ch, searchFrom);
    if (found === -1) return null;

    score += 100 - Math.min(found, 100); // earlier is better
    if (prevMatch !== -1 && found === prevMatch + 1) score += 50; // consecutive
    if (found === 0 || isSeparator(t[found - 1])) score += 30; // word start

    prevMatch = found;
    searchFrom = found + 1;
  }

  // Prefer shorter targets among equal-quality matches.
  score -= t.length;
  return score;
}

/** Filters and ranks `items` by fuzzy score against `query`. */
export function fuzzyFilter<T>(
  query: string,
  items: readonly T[],
  getText: (item: T) => string,
): ScoredItem<T>[] {
  const q = query.trim();
  const scored: ScoredItem<T>[] = [];
  for (const item of items) {
    const score = fuzzyScore(q, getText(item));
    if (score !== null) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored;
}
