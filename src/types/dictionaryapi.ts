// types.ts
export type partOfSpeechType = "noun" | "verb" | "adjective" | "adverb";
export type DictionaryAPI_Phonetic = {
  audio?: string;
  sourceUrl?: string;
  license?: {
    name: string;
    url: string;
  };
  text?: string;
};

export type Vocab_Phonetic = {
  audio?: string;
  sourceUrl?: string;
  license?: {
    name: string;
    url: string;
  };
  text: string;
};

export type DictionaryAPI_Definition = {
  definition: string;
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryAPI_Meaning = {
  partOfSpeech: string;
  definitions: DictionaryAPI_Definition[];
  synonyms: string[];
  antonyms: string[];
};

export type DictionaryAPI_License = {
  name: string;
  url: string;
};

export type DictionaryAPI_DictionaryEntry = {
  word: string;
  phonetics: DictionaryAPI_Phonetic[];
  meanings: DictionaryAPI_Meaning[];
  license: DictionaryAPI_License;
  sourceUrls: string[];
};

export type DictionaryAPI_Response_OK = DictionaryAPI_DictionaryEntry[];

export type DictionaryAPI_Response_NOTFOUND = {
  title: string;
  message: string;
  resolution: string;
};

export type VocabAPI_Meaning = {
  [K in partOfSpeechType]?: DictionaryAPI_Meaning;
};

export type VocabAPI_Response_OK = {
  word: string;
  phonetic: Vocab_Phonetic | null;
  meanings: VocabAPI_Meaning;
};
