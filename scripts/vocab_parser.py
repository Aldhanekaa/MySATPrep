#!/usr/bin/env python3
"""
SAT Vocabulary Parser

This script parses the extracted text from SAT vocabulary and generates a structured JSON file
containing words, their definitions, and examples.
"""

import json
import re
from typing import List, Dict, Any

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
        
        # Split text into potential vocabulary entries
        # Look for patterns like word followed by part of speech
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
    
    # Pattern to match vocabulary entries with flexible whitespace and newlines
    # Pattern: word \n (part_of_speech) \n definition \n (example)
    pattern = r'(\w+)\s*\n\s*(\([^)]+\))\s*\n\s*([^(]+?)\s*(\([^)]+\))'
    
    matches = re.finditer(pattern, text, re.MULTILINE | re.DOTALL)
    
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
    
    # If the main pattern didn't work well, try simpler approach
    if len(entries) < 5:
        entries = extract_with_simple_pattern(text)
    
    return entries

def extract_with_simple_pattern(text: str) -> List[Dict[str, Any]]:
    """
    Extract vocabulary entries using a simpler approach by splitting on word patterns.
    """
    entries = []
    
    # Split text into individual words and process sequentially
    # Look for pattern: word \n (pos) \n definition (example)
    
    # First, let's find all potential vocabulary word starts
    # These are standalone words on their own line, followed by a part of speech
    word_pattern = r'\n([a-z]+)\s*\n\s*(\([^)]+\))'
    word_matches = list(re.finditer(word_pattern, text, re.IGNORECASE))
    
    for i, match in enumerate(word_matches):
        word = match.group(1).lower().strip()
        part_of_speech = match.group(2).strip()
        
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

def extract_definition_and_example(content: str) -> tuple:
    """
    Extract definition and example from content between two vocabulary words.
    """
    # Look for the first parenthetical expression (which should be an example)
    example_match = re.search(r'\(([^)]{20,})\)', content)
    
    if not example_match:
        return None, None
    
    example_start = example_match.start()
    example = example_match.group(0)
    
    # Everything before the example (cleaned up) should be the definition
    definition_text = content[:example_start].strip()
    
    # Clean up definition text
    definition_text = re.sub(r'\s+', ' ', definition_text)
    definition_text = definition_text.strip()
    
    # Remove any remaining artifacts
    definition_text = re.sub(r'^[^\w]+', '', definition_text)
    
    if len(definition_text) < 5 or len(example) < 15:
        return None, None
    
    return definition_text, example
    """
    Extract vocabulary entries using alternative parsing patterns.
    """
    entries = []
    
    # Split text into lines and look for numbered entries or clear word patterns
    lines = text.split('\n')
    
    current_entry = None
    
    for i, line in enumerate(lines):
        line = line.strip()
        
        # Skip empty lines and headers
        if not line or line in ['SAT Vocabulary', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z']:
            continue
        
        # Check if this line looks like a word (starts with lowercase letter, no spaces)
        if re.match(r'^[a-z]+$', line) and len(line) > 2:
            # This might be a vocabulary word
            word = line
            
            # Look for part of speech in next few lines
            part_of_speech = ''
            definition = ''
            example = ''
            
            for j in range(i + 1, min(i + 10, len(lines))):
                next_line = lines[j].strip()
                
                # Check for part of speech pattern
                if re.match(r'^\([^)]+\)$', next_line):
                    part_of_speech = next_line
                    
                    # Look for definition in subsequent lines
                    definition_lines = []
                    example_found = False
                    
                    for k in range(j + 1, min(j + 5, len(lines))):
                        def_line = lines[k].strip()
                        
                        # Check if this line contains an example (starts with parenthesis)
                        if def_line.startswith('(') and def_line.endswith(')') and len(def_line) > 10:
                            example = def_line
                            example_found = True
                            break
                        elif def_line and not def_line.startswith('(') and not re.match(r'^[a-z]+$', def_line):
                            definition_lines.append(def_line)
                    
                    definition = ' '.join(definition_lines).strip()
                    
                    if definition and example_found:
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
                    break
            
    return entries

def clean_text(text: str) -> str:
    """Clean and normalize the input text."""
    # Keep the original structure but clean up excessive spaces
    text = re.sub(r'[ \t]+', ' ', text)  # Replace multiple spaces/tabs with single space
    text = re.sub(r' \n', '\n', text)    # Remove spaces before newlines
    text = re.sub(r'\n ', '\n', text)    # Remove spaces after newlines
    return text.strip()

def clean_word(word: str) -> str:
    """Clean and normalize a vocabulary word."""
    # Remove any non-alphabetic characters except hyphens
    word = re.sub(r'[^a-zA-Z\-]', '', word)
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
    definition = re.sub(r'^[^\w]+|[^\w\s.!?]+$', '', definition)
    
    return definition.strip()

def clean_example(example: str) -> str:
    """Clean and normalize example text."""
    # Remove parentheses
    example = example.strip('()')
    
    # Clean up whitespace
    example = re.sub(r'\s+', ' ', example)
    
    return example.strip()

def is_valid_entry(word: str, part_of_speech: str, definition: str, example: str) -> bool:
    """
    Validate that the extracted entry looks like a real vocabulary entry.
    """
    # Check minimum requirements
    if not word or len(word) < 2:
        return False
    
    if not part_of_speech or not re.match(r'^[a-z\.]+$', part_of_speech):
        return False
    
    if not definition or len(definition) < 5:
        return False
    
    if not example or len(example) < 10:
        return False
    
    # Check that word contains only letters and hyphens
    if not re.match(r'^[a-zA-Z\-]+$', word):
        return False
    
    # Check that definition doesn't contain too many non-letter characters
    letter_ratio = len(re.findall(r'[a-zA-Z]', definition)) / len(definition)
    if letter_ratio < 0.7:
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
