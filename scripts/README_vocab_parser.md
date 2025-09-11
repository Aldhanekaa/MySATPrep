# SAT Vocabulary Parser

This Python script parses extracted SAT vocabulary text and converts it into structured JSON format.

## Overview

The script takes raw text data from PDF extraction (typically containing vocabulary words with their parts of speech, definitions, and examples) and converts it into a clean, structured JSON format suitable for use in applications.

## Features

- Extracts vocabulary words with their parts of speech (e.g., v., adj., n.)
- Captures definitions and examples for each word
- Handles various text formatting and cleaning issues
- Removes duplicates and validates entries
- Outputs alphabetically sorted vocabulary list

## Input Format

The script expects a JSON file containing extracted text with the following structure:

```json
[
  {
    "page": 1,
    "text": "vocabulary text content..."
  }
]
```

## Output Format

The script generates a JSON file with vocabulary entries in this format:

```json
[
  {
    "word": "abase",
    "part_of_speech": "v.",
    "definition": "To humiliate, degrade",
    "example": "After being overthrown and abased, the deposed leader offered to bow down to his conqueror.",
    "page": 1
  }
]
```

## Usage

1. Ensure you have the input file `extracted_text.json` in the same directory
2. Run the script:

```bash
python3 sat_vocab_parser.py
```

3. The output will be saved as `sat_vocabulary_parsed.json`

## Requirements

- Python 3.6+
- Standard library modules: `json`, `re`, `typing`

## Text Pattern Recognition

The parser recognizes vocabulary entries with the following pattern:

- Word on its own line
- Part of speech in parentheses (e.g., "(v.)", "(adj.)", "(n.)")
- Definition text
- Example in parentheses

Example input text pattern:

```
abase
(v.)
to humiliate, degrade
(After being overthrown and abased, the deposed leader offered to bow down to his conqueror.)
```

## Validation

The script validates entries by checking:

- Word contains only letters and hyphens
- Part of speech follows expected format
- Definition and example meet minimum length requirements
- Example contains the vocabulary word (or its variants)
- Filters out common headers and single characters

## Results

The current version successfully parses approximately 850+ vocabulary words from the SAT vocabulary dataset.
