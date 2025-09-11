import fs from "fs";
import path from "path";

const inputPath = path.resolve(
  process.cwd(),
  "vocabs/sat_vocabulary_dataset.json"
);

/** Replace smart quotes, ligatures, stray control chars, and normalize spacing */
function normalizeText(text) {
  if (text == null) return text;
  let s = String(text);
  // Normalize line breaks inside fields: collapse internal newlines to spaces
  s = s.replace(/[\r\n]+/g, " ");

  // Replace common PDF ligatures and odd characters
  const replacements = [
    [/\u2018|\u2019|\u201A|\u201B/g, "'"], // single quotes
    [/\u201C|\u201D|\u201E|\u201F/g, '"'], // double quotes
    [/\u2013|\u2014|\u2212|\u2012|\u2015/g, "-"], // dashes
    [/\u00A0/g, " "], // nbsp
    [/\uFB01/g, "fi"], // ﬁ
    [/\uFB02/g, "fl"], // ﬂ
    [/\uFB00/g, "ff"], // ﬀ
    [/\uFB03/g, "ffi"], // ﬃ
    [/\uFB04/g, "ffl"], // ﬄ
    [/\u00DF/g, "ss"], // ß -> ss (approx)
    [/\u00D0/g, "D"],
    [/\u00DE/g, "Th"],
    [/\u00FE/g, "th"],
    [/\u00D8/g, "O"],
    [/\u00F8/g, "o"],
  ];
  for (const [re, rep] of replacements) s = s.replace(re, rep);

  // Collapse multiple spaces
  s = s.replace(/\s{2,}/g, " ");
  // Trim
  s = s.trim();
  return s;
}

/** Fix common corruptions in the word field */
function normalizeWord(word) {
  if (word == null) return word;
  let w = normalizeText(word);

  // Remove leading markers like single letters + newline (e.g., "v\nveneer", "t\ntacit")
  w = w.replace(/^[a-zA-Z]\s+/, "");

  // Remove noisy prefix like "vocabulary" possibly glued to the word
  w = w.replace(/^vocabulary\s+/i, "");

  // Remove stray internal spaces that split a single word (e.g., "vir tuoso" => "virtuoso")
  // Only do this for letter-space-letter patterns within a single token
  if (/^[a-z]+\s+[a-z]+$/i.test(w) && !w.includes(" ")) {
    // No-op: already a single token
  } else {
    // If exactly two tokens and both alphabetic, and total length small, join
    const parts = w.split(/\s+/);
    if (parts.length === 2 && parts.every((p) => /^[A-Za-z]+$/.test(p))) {
      // Heuristic: many corruptions like "vir tuoso", "tor tuous"
      if (parts[0].length <= 5 || parts[1].length <= 5) {
        w = parts.join("");
      }
    }
  }

  return w;
}

function normalizeEntry(entry) {
  const e = { ...entry };
  e.word = normalizeWord(e.word);
  e.part_of_speech = normalizeText(e.part_of_speech);
  e.definition = normalizeText(e.definition);
  e.example = normalizeText(e.example);
  e.difficulty = normalizeText(e.difficulty);
  e.category = normalizeText(e.category);
  e.etymology = normalizeText(e.etymology);
  // numeric fields: ensure numbers if present
  if (e.syllable_count != null) e.syllable_count = Number(e.syllable_count);
  if (e.word_length != null) e.word_length = Number(e.word_length);
  if (e.definition_number != null)
    e.definition_number = Number(e.definition_number);
  return e;
}

function main() {
  const raw = fs.readFileSync(inputPath, "utf8");
  const data = JSON.parse(raw);

  if (Array.isArray(data)) {
    // Unexpected shape, but handle
    const cleaned = data.map(normalizeEntry);
    fs.writeFileSync(inputPath, JSON.stringify(cleaned, null, 2) + "\n");
    return;
  }

  if (data && Array.isArray(data.words)) {
    data.meta = data.meta || {};
    data.summary = data.summary || {};
    data.words = data.words.map(normalizeEntry);

    // Recompute simple derived stats if present
    data.meta.total_entries = data.words.length;
    data.summary.word_count = data.words.length;

    fs.writeFileSync(inputPath, JSON.stringify(data, null, 2) + "\n");
  } else {
    // Just rewrite normalized
    fs.writeFileSync(inputPath, JSON.stringify(data, null, 2) + "\n");
  }
}

main();
