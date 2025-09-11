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
    
    # First, let's find all potential vocabulary word starts
    # These are standalone words on their own line, followed by a part of speech
    word_pattern = r'\n([a-z][a-z\s]*[a-z])\s*\n\s*(\([^)]+\))'
    word_matches = list(re.finditer(word_pattern, text, re.IGNORECASE))
    
    for i, match in enumerate(word_matches):
        word = match.group(1).strip()
        part_of_speech = match.group(2).strip()
        
        # Skip if this doesn't look like a real word
        if not re.match(r'^[a-z\s]+$', word.lower()) or len(word) < 2:
            continue
        
        # Find the start and end positions for this entry
        start_pos = match.end()
        
        # Find the end position (start of next word or end of text)
        if i + 1 < len(word_matches):
            end_pos = word_matches[i + 1].start()
        else:
            end_pos = len(text)
        
        # Extract the content between this word and the next
        content = text[start_pos:end_pos]
        
        # Look for definition and example in this content
        definition, example = extract_definition_and_example(content)
        
        if definition and example:
            # Clean up the extracted parts
            word = clean_word(word)
            part_of_speech = clean_part_of_speech(part_of_speech)
            definition = clean_definition(definition)
            example = clean_example(example)
            
            if is_valid_entry(word, part_of_speech, definition, example):
                entry = {
                    'word': word,
                    'part_of_speech': part_of_speech,
                    'definition': definition,
                    'example': example
                }
                entries.append(entry)
    
    return entries

def extract_definition_and_example(content: str) -> Tuple[str, str]:
    """
    Extract definition and example from content between two vocabulary words.
    
    Returns:
        Tuple of (definition, example) or (None, None) if not found
    """
    # Look for the first substantial parenthetical expression (which should be an example)
    example_matches = list(re.finditer(r'\(([^)]{15,})\)', content))
    
    if not example_matches:
        return None, None
    
    # Find the best example (usually the longest one)
    best_example = max(example_matches, key=lambda m: len(m.group(1)))
    example_start = best_example.start()
    example = best_example.group(0)
    
    # Everything before the example should be the definition
    definition_text = content[:example_start].strip()
    
    # Clean up definition text
    definition_text = re.sub(r'\s+', ' ', definition_text)
    definition_text = definition_text.strip()
    
    # Remove any remaining artifacts like leading punctuation
    definition_text = re.sub(r'^[^\w]+', '', definition_text)
    
    if len(definition_text) < 3 or len(example) < 15:
        return None, None
    
    return definition_text, example

def clean_word(word: str) -> str:
    """Clean and normalize a vocabulary word."""
    # Handle compound words and remove any artifacts
    word = re.sub(r'[^a-zA-Z\s\-]', '', word)
    word = re.sub(r'\s+', ' ', word)
    return word.lower().strip()

def clean_part_of_speech(pos: str) -> str:
    """Clean and normalize part of speech."""
    # Remove parentheses and normalize
    pos = pos.strip('()')
    return pos.strip()

def clean_definition(definition: str) -> str:
    """Clean and normalize definition text."""
    # Remove extra whitespace and clean up
    definition = re.sub(r'\s+', ' ', definition)
    definition = definition.strip()
    
    # Remove any leading/trailing punctuation that doesn't belong
    definition = re.sub(r'^[^\w]+|[^\w\s.!?,;:]+$', '', definition)
    
    # Ensure proper capitalization
    if definition and definition[0].islower():
        definition = definition[0].upper() + definition[1:]
    
    return definition.strip()

def clean_example(example: str) -> str:
    """Clean and normalize example text."""
    # Remove parentheses
    example = example.strip('()')
    
    # Clean up whitespace
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
    
    # Check that word contains mostly letters
    if not re.match(r'^[a-zA-Z\s\-]+$', word):
        return False
    
    # Check part of speech format
    if not part_of_speech or not re.match(r'^[a-z\.]+$', part_of_speech):
        return False
    
    # Check definition length and content
    if not definition or len(definition) < 3:
        return False
    
    # Check example length and content
    if not example or len(example) < 10:
        return False
    
    # Check that definition doesn't contain too many non-letter characters
    letter_count = len(re.findall(r'[a-zA-Z]', definition))
    if letter_count == 0:
        return False
    
    letter_ratio = letter_count / len(definition)
    if letter_ratio < 0.5:
        return False
    
    # Make sure the word isn't just a single character or common header
    if word.lower() in ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z', 'sat', 'vocabulary']:
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
