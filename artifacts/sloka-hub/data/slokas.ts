import rawSlokas from "./slokas-180.json";

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
  times_quoted_approx?: string | null;
  chapter_verse?: string;
}

// The app ships only Prabhupada's favourite verses. The full 700-verse
// "Bhagavad Gita As It Is" dataset was removed — see
// PLAN-remove-full-bg-and-chapter-grouping.md.
export const slokas: Sloka[] = [...(rawSlokas as Sloka[])];

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

// ── Chapter grouping ────────────────────────────────────────────────
// Each source text is sub-divided into chapters/cantos/lilas so the list
// reads like a table of contents. Texts that aren't numbered (most
// Upanisads, Visnu Purana, etc.) return null and render as one group.

export interface ChapterSection {
  title: string; // e.g. "Bhagavad-gita · Chapter 7"
  source: string;
  chapter: string | null; // "Chapter 7", "Canto 1", "Madhya-lila", or null
  data: Sloka[];
}

const LILA_ORDER: Record<string, number> = {
  "Adi-lila": 1,
  "Madhya-lila": 2,
  "Antya-lila": 3,
};

/** A chapter/canto/lila label used to group a verse, or null if un-numbered. */
export function chapterLabel(s: Sloka): string | null {
  const cv = s.chapter_verse?.trim();
  if (!cv) return null;
  // Caitanya-caritamrta: "Madhya 7.128" -> "Madhya-lila"
  const lila = cv.match(/^(Adi|Madhya|Antya)/i);
  if (lila) {
    const w = lila[1].toLowerCase();
    return w.charAt(0).toUpperCase() + w.slice(1) + "-lila";
  }
  const first = cv.match(/^(\d+)/);
  if (!first) return null;
  // Srimad-Bhagavatam is canto.chapter.verse -> group by Canto only.
  if (s.source.toLowerCase().includes("bhagavatam")) {
    return `Canto ${first[1]}`;
  }
  return `Chapter ${first[1]}`;
}

function numParts(cv?: string): number[] {
  return (cv?.match(/\d+/g) ?? []).map(Number);
}

/** Sort verses within a chapter by their numeric parts (2.11 before 2.14). */
function verseCompare(a: Sloka, b: Sloka): number {
  const pa = numParts(a.chapter_verse);
  const pb = numParts(b.chapter_verse);
  const n = Math.max(pa.length, pb.length);
  for (let i = 0; i < n; i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d;
  }
  return (a.title ?? "").localeCompare(b.title ?? "");
}

/** Order chapter headings: numeric ascending, lilas in canonical order, un-numbered last. */
function chapterKeyCompare(a: string, b: string): number {
  if (a === b) return 0;
  if (a === "") return 1;
  if (b === "") return -1;
  const la = LILA_ORDER[a];
  const lb = LILA_ORDER[b];
  if (la && lb) return la - lb;
  const na = Number(a.match(/\d+/)?.[0] ?? 1e9);
  const nb = Number(b.match(/\d+/)?.[0] ?? 1e9);
  return na - nb;
}

/** Group verses into source -> chapter sections for the Slokas list. */
export function groupBySourceAndChapter(items: Sloka[]): ChapterSection[] {
  const bySource = new Map<string, Sloka[]>();
  for (const s of items) {
    const arr = bySource.get(s.source) ?? [];
    arr.push(s);
    bySource.set(s.source, arr);
  }

  const sections: ChapterSection[] = [];
  for (const src of sourceTexts) {
    const arr = bySource.get(src);
    if (!arr) continue;

    const byChapter = new Map<string, Sloka[]>();
    for (const s of arr) {
      const key = chapterLabel(s) ?? "";
      const a = byChapter.get(key) ?? [];
      a.push(s);
      byChapter.set(key, a);
    }

    const keys = [...byChapter.keys()].sort(chapterKeyCompare);
    for (const key of keys) {
      const data = byChapter.get(key)!.slice().sort(verseCompare);
      sections.push({
        title: key ? `${src} · ${key}` : src,
        source: src,
        chapter: key || null,
        data,
      });
    }
  }
  return sections;
}
