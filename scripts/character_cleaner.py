#!/usr/bin/env python3
"""
Character Cleaner for SAT Vocabulary

This script cleans up unusual characters in the parsed vocabulary JSON file,
replacing them with proper English equivalents.
"""

import json
import re

def clean_characters(text):
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
        '¥': 'Y',      # Yen symbol used as Y
        '†': '+',      # Dagger symbol
        '‡': '++',     # Double dagger
        '…': '...',    # Ellipsis
        '•': '*',      # Bullet point
        '‚': ',',      # Single low quote
        '„': '"',      # Double low quote
        ''': "'",      # Left single quote
        ''': "'",      # Right single quote
        '"': '"',      # Left double quote
        '"': '"',      # Right double quote
        '–': '-',      # En dash
        '—': '-',      # Em dash
        '©': '(c)',    # Copyright
        '®': '(r)',    # Registered
        '™': '(tm)',   # Trademark
    }
    
    # Apply character replacements
    for old_char, new_char in char_replacements.items():
        text = text.replace(old_char, new_char)
    
    # Handle any remaining non-ASCII characters
    # Replace with closest ASCII equivalent or remove
    text = re.sub(r'[^\x00-\x7F]+', '', text)
    
    # Clean up any double spaces that might have been created
    text = re.sub(r'\s+', ' ', text)
    
    return text.strip()

def clean_vocabulary_file(input_file, output_file):
    """
    Clean the vocabulary JSON file by replacing unusual characters.
    
    Args:
        input_file: Path to input JSON file
        output_file: Path to output cleaned JSON file
    """
    # Load the vocabulary data
    with open(input_file, 'r', encoding='utf-8') as f:
        vocabulary_data = json.load(f)
    
    cleaned_count = 0
    total_entries = len(vocabulary_data)
    
    # Clean each vocabulary entry
    for entry in vocabulary_data:
        original_word = entry.get('word', '')
        original_definition = entry.get('definition', '')
        original_example = entry.get('example', '')
        
        # Clean the text fields
        entry['word'] = clean_characters(entry.get('word', ''))
        entry['definition'] = clean_characters(entry.get('definition', ''))
        entry['example'] = clean_characters(entry.get('example', ''))
        
        # Count if any changes were made
        if (original_word != entry['word'] or 
            original_definition != entry['definition'] or 
            original_example != entry['example']):
            cleaned_count += 1
    
    # Save the cleaned data
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(vocabulary_data, f, indent=2, ensure_ascii=False)
    
    print(f"Cleaned {cleaned_count} entries out of {total_entries} total entries")
    print(f"Cleaned vocabulary saved to: {output_file}")
    
    # Show some examples of changes made
    show_cleaning_examples(vocabulary_data[:10])

def show_cleaning_examples(sample_entries):
    """
    Show examples of the cleaning that was performed.
    """
    print("\nExamples of character cleaning:")
    print("-" * 50)
    
    found_examples = False
    for entry in sample_entries:
        word = entry.get('word', '')
        definition = entry.get('definition', '')
        example = entry.get('example', '')
        
        # Check if this entry likely had unusual characters
        if any(char in definition + example for char in ["'", '"']):
            print(f"Word: {word}")
            print(f"Definition: {definition}")
            print(f"Example: {example}")
            print()
            found_examples = True
            break
    
    if not found_examples:
        print("No obvious character cleaning examples found in the sample.")

def main():
    """Main function to run the character cleaner."""
    input_file = 'sat_vocabulary_parsed.json'
    output_file = 'sat_vocabulary_cleaned.json'
    
    try:
        clean_vocabulary_file(input_file, output_file)
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
        print("Please make sure the file exists in the current directory.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_file}'")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
