import rawSlokas from "./slokas.json";
import rawPPSlokas from "./pp-slokas.json";

export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface Sloka {
  id: string;
  title: string;
  source: string;
  transliteration: string[];
  translation: string;
  purport?: string;
  word_by_word: WordMeaning[];
  audio_url?: string;
  category: string;
  rank?: number;
  times_quoted_approx?: number;
  chapter_verse?: string;
}

export const slokas: Sloka[] = [
  ...(rawSlokas as Sloka[]),
  ...(rawPPSlokas as Sloka[]),
];

export const categories = [...new Set(slokas.map((s) => s.category))];

const _sourceCounts = slokas.reduce<Record<string, number>>((acc, s) => {
  acc[s.source] = (acc[s.source] ?? 0) + 1;
  return acc;
}, {});

export const sourceTexts: string[] = Object.entries(_sourceCounts)
  .sort((a, b) => b[1] - a[1])
  .map(([src]) => src);

export function groupBySource(
  items: Sloka[]
): { title: string; data: Sloka[] }[] {
  const map = new Map<string, Sloka[]>();
  for (const sloka of items) {
    const arr = map.get(sloka.source) ?? [];
    arr.push(sloka);
    map.set(sloka.source, arr);
  }
  return sourceTexts
    .filter((src) => map.has(src))
    .map((src) => ({ title: src, data: map.get(src)! }));
}
