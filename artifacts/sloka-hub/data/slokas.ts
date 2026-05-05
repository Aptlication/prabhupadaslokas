import rawSlokas from "./slokas.json";

export interface WordMeaning {
  word: string;
  meaning: string;
}

export interface Sloka {
  id: string;
  title: string;
  source: string;
  devanagari: string[];
  transliteration: string[];
  translation: string;
  purport?: string;
  word_by_word: WordMeaning[];
  audio_url?: string;
  category: string;
}

export const slokas = rawSlokas as Sloka[];

export const categories = [...new Set(slokas.map((s) => s.category))];
