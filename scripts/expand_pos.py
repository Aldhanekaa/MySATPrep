#!/usr/bin/env python3
"""
Script to expand part-of-speech abbreviations in the vocabulary JSON file.
Changes: adj. → adjective, n. → noun, v. → verb, adv. → adverb
"""

import json
import os

def expand_pos_abbreviations():
    """Expand part-of-speech abbreviations in the vocabulary file."""
    
    # File path
    input_file = "sat_vocabulary_categorized.json"
    
    if not os.path.exists(input_file):
        print(f"Error: {input_file} not found!")
        return
    
    # Load the vocabulary data
    print(f"Loading {input_file}...")
    with open(input_file, 'r', encoding='utf-8') as f:
        vocabulary = json.load(f)
    
    # Mapping of abbreviations to full forms
    pos_mapping = {
        "adj.": "adjective",
        "n.": "noun", 
        "v.": "verb",
        "adv.": "adverb"
    }
    
    # Count changes
    changes_made = 0
    pos_counts = {}
    
    # Process each entry
    for entry in vocabulary:
        if "part_of_speech" in entry:
            old_pos = entry["part_of_speech"]
            if old_pos in pos_mapping:
                entry["part_of_speech"] = pos_mapping[old_pos]
                changes_made += 1
                
                # Count the new pos
                new_pos = entry["part_of_speech"]
                pos_counts[new_pos] = pos_counts.get(new_pos, 0) + 1
    
    # Save the updated data
    print(f"Saving updated vocabulary...")
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(vocabulary, f, indent=2, ensure_ascii=False)
    
    # Report results
    print(f"\n✅ Successfully expanded {changes_made} part-of-speech abbreviations!")
    print("\nPart-of-speech distribution:")
    for pos, count in sorted(pos_counts.items()):
        print(f"  {pos}: {count} words")
    
    print(f"\nFile updated: {input_file}")

if __name__ == "__main__":
    expand_pos_abbreviations()
