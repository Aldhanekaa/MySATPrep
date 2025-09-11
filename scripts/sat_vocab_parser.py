#!/usr/bin/env python3
"""
SAT Vocabulary Parser

This script parses the extracted text from SAT vocabulary and generates a structured JSON file
containing words, their definitions, and examples.
"""

import json
import re
from typing import List, Dict, Any, Tuple

def parse_vocabulary_data(input_file: str, output_file: str) -> None:
    """
    Parse vocabulary data from extracted text and generate structured JSON.
    
    Args:
        input_file: Path to the input JSON file containing extracted text
        output_file: Path to the output JSON file to write structured vocabulary
    """
    
    # Load the extracted text data
    with open(input_file, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    vocabulary_list = []
    
    for page_data in data:
        text = page_data.get('text', '')
        page_number = page_data.get('page', 0)
        
        # Extract vocabulary entries from this page
        entries = extract_vocabulary_entries(text)
        
        for entry in entries:
            if entry:  # Only add non-empty entries
                entry['page'] = page_number
                vocabulary_list.append(entry)
    
    # Remove duplicates based on word
    unique_vocab = []
    seen_words = set()
    
    for vocab in vocabulary_list:
        word_key = vocab['word'].lower()
        if word_key not in seen_words:
            seen_words.add(word_key)
            unique_vocab.append(vocab)
    
    # Sort by word alphabetically
    unique_vocab.sort(key=lambda x: x['word'].lower())
    
    # Write to output file
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(unique_vocab, f, indent=2, ensure_ascii=False)
    
    print(f"Successfully parsed {len(unique_vocab)} vocabulary words")
    print(f"Output written to: {output_file}")

def extract_vocabulary_entries(text: str) -> List[Dict[str, Any]]:
    """
    Extract vocabulary entries from a text block.
    
    Args:
        text: The text content to parse
        
    Returns:
        List of vocabulary entry dictionaries
    """
    entries = []
    
    # More precise pattern to match vocabulary entries
    # Look for: newline + single word + newline + (part_of_speech) + newline + definition + (example)
    pattern = r'\n([a-z]+)\s*\n\s*(\([^)]+\))\s*\n\s*([^(]+?)\s*(\([^)]{20,}\))'
    
    matches = re.finditer(pattern, text, re.MULTILINE | re.DOTALL | re.IGNORECASE)
    
    for match in matches:
        word = match.group(1).strip()
        part_of_speech = match.group(2).strip()
        definition = match.group(3).strip()
        example = match.group(4).strip()
        
        # Clean up the extracted parts
        word = clean_word(word)
        part_of_speech = clean_part_of_speech(part_of_speech)
        definition = clean_definition(definition)
        example = clean_example(example)
        
        # Validate that this looks like a real vocabulary entry
        if is_valid_entry(word, part_of_speech, definition, example):
            entry = {
                'word': word,
                'part_of_speech': part_of_speech,
                'definition': definition,
                'example': example
            }
            entries.append(entry)
    
    return entries

def clean_characters(text: str) -> str:
    """
    Replace unusual characters with their English equivalents.
    
    Args:
        text: String to clean
        
    Returns:
        Cleaned string with proper English characters
    """
    if not isinstance(text, str):
        return text
    
    # Character mappings for common encoding issues
    char_replacements = {
        'Õ': "'",      # Curly apostrophe/single quote
        'Ó': '"',      # Opening double quote  
        'Ò': '"',      # Closing double quote
        'Þ': 'fi',     # Ligature for 'fi'
        'ß': 'fl',     # Ligature for 'fl'
        'È': 'A',      # Accented A
        'É': 'E',      # Accented E
        'Í': 'I',      # Accented I
        'Ñ': '-',      # En dash
        'Ð': '-',      # Em dash
        '…': '...',    # Ellipsis
        '•': '*',      # Bullet point
        ''': "'",      # Left single quote
        ''': "'",      # Right single quote
        '"': '"',      # Left double quote
        '"': '"',      # Right double quote
        '–': '-',      # En dash
        '—': '-',      # Em dash
    }
    
    # Apply character replacements
    for old_char, new_char in char_replacements.items():
        text = text.replace(old_char, new_char)
    
    # Handle any remaining non-ASCII characters by removing them
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    
    # Clean up any double spaces that might have been created
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def clean_word(word: str) -> str:
    """Clean and normalize a vocabulary word."""
    # First clean unusual characters
    word = clean_characters(word)
    # Remove any non-alphabetic characters except hyphens
    word = re.sub(r'[^a-zA-Z\-]', '', word)
    return word.lower().strip()

def clean_part_of_speech(pos: str) -> str:
    """Clean and normalize part of speech."""
    # First clean unusual characters
    pos = clean_characters(pos)
    # Remove parentheses and normalize
    pos = pos.strip('()')
    return pos.strip()

def clean_definition(definition: str) -> str:
    """Clean and normalize definition text."""
    # First clean unusual characters
    definition = clean_characters(definition)
    # Remove extra whitespace and clean up
    definition = re.sub(r'\s+', ' ', definition)
    definition = definition.strip()
    
    # Remove any leading/trailing punctuation that doesn't belong
    definition = re.sub(r'^[^\w]+|[^\w\s.!?,;:]+$', '', definition)
    
    # Remove any remaining line breaks or weird characters
    definition = re.sub(r'[\n\r\t]', ' ', definition)
    definition = re.sub(r'\s+', ' ', definition)
    
    # Ensure proper capitalization
    if definition and definition[0].islower():
        definition = definition[0].upper() + definition[1:]
    
    return definition.strip()

def clean_example(example: str) -> str:
    """Clean and normalize example text."""
    # First clean unusual characters
    example = clean_characters(example)
    # Remove parentheses
    example = example.strip('()')
    
    # Clean up whitespace and line breaks
    example = re.sub(r'[\n\r\t]', ' ', example)
    example = re.sub(r'\s+', ' ', example)
    
    # Remove any leading/trailing artifacts
    example = example.strip()
    
    return example

def is_valid_entry(word: str, part_of_speech: str, definition: str, example: str) -> bool:
    """
    Validate that the extracted entry looks like a real vocabulary entry.
    """
    # Check minimum requirements
    if not word or len(word) < 2:
        return False
    
    # Check that word contains only letters and hyphens
    if not re.match(r'^[a-zA-Z\-]+$', word):
        return False
    
    # Check part of speech format
    if not part_of_speech or not re.match(r'^[a-z\.]+$', part_of_speech):
        return False
    
    # Check definition length and content
    if not definition or len(definition) < 5:
        return False
    
    # Check example length and content
    if not example or len(example) < 15:
        return False
    
    # Check that definition contains mostly alphabetic characters
    letter_count = len(re.findall(r'[a-zA-Z]', definition))
    if letter_count == 0:
        return False
    
    letter_ratio = letter_count / len(definition)
    if letter_ratio < 0.6:
        return False
    
    # Make sure the word isn't just a common header or single character
    if word.lower() in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'sat', 'vocabulary', 'the', 'most', 'common', 'words']:
        return False
    
    # Check that the example contains the word (shows it's actually used)
    word_variants = [word, word.capitalize(), word.upper()]
    if not any(variant in example for variant in word_variants):
        # Sometimes the word is modified (e.g., "abased" from "abase")
        word_root = word.rstrip('ed').rstrip('ing').rstrip('s')
        if len(word_root) >= 3 and not any(variant in example for variant in [word_root, word_root.capitalize()]):
            return False
    
    return True

def main():
    """Main function to run the vocabulary parser."""
    input_file = 'extracted_text.json'
    output_file = 'sat_vocabulary_parsed.json'
    
    try:
        parse_vocabulary_data(input_file, output_file)
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
        print("Please make sure the file exists in the current directory.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_file}'")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
