#!/usr/bin/env python3
"""
Vocabulary Query Tool

This script provides utilities to search and filter the categorized vocabulary data.
"""

import json
import sys
from typing import List, Dict, Any

class VocabularyQuery:
    def __init__(self, vocab_file: str = 'sat_vocabulary_categorized.json'):
        with open(vocab_file, 'r', encoding='utf-8') as f:
            self.vocabulary = json.load(f)
    
    def search_by_difficulty(self, difficulty: str) -> List[Dict]:
        """Get all words of a specific difficulty level."""
        return [word for word in self.vocabulary if word['difficulty'] == difficulty.lower()]
    
    def search_by_category(self, category: str) -> List[Dict]:
        """Get all words in a specific category."""
        return [word for word in self.vocabulary if category.lower() in [c.lower() for c in word['categories']]]
    
    def search_by_word_length(self, min_length: int = 0, max_length: int = 100) -> List[Dict]:
        """Get words within a specific length range."""
        return [word for word in self.vocabulary 
                if min_length <= word['word_length'] <= max_length]
    
    def search_by_syllables(self, syllable_count: int) -> List[Dict]:
        """Get words with specific syllable count."""
        return [word for word in self.vocabulary if word['syllable_count'] == syllable_count]
    
    def search_by_part_of_speech(self, pos: str) -> List[Dict]:
        """Get words of a specific part of speech."""
        return [word for word in self.vocabulary if word['part_of_speech'] == pos]
    
    def search_word(self, word: str) -> Dict:
        """Find a specific word."""
        for entry in self.vocabulary:
            if entry['word'].lower() == word.lower():
                return entry
        return None
    
    def random_words(self, count: int = 10, difficulty: str = None, category: str = None) -> List[Dict]:
        """Get random words with optional filters."""
        import random
        
        filtered_words = self.vocabulary
        
        if difficulty:
            filtered_words = [w for w in filtered_words if w['difficulty'] == difficulty.lower()]
        
        if category:
            filtered_words = [w for w in filtered_words 
                            if category.lower() in [c.lower() for c in w['categories']]]
        
        return random.sample(filtered_words, min(count, len(filtered_words)))
    
    def get_statistics(self) -> Dict[str, Any]:
        """Get comprehensive statistics about the vocabulary."""
        total_words = len(self.vocabulary)
        
        difficulty_counts = {}
        category_counts = {}
        pos_counts = {}
        
        for word in self.vocabulary:
            # Difficulty stats
            difficulty = word['difficulty']
            difficulty_counts[difficulty] = difficulty_counts.get(difficulty, 0) + 1
            
            # Category stats
            for category in word['categories']:
                category_counts[category] = category_counts.get(category, 0) + 1
            
            # Part of speech stats
            pos = word['part_of_speech']
            pos_counts[pos] = pos_counts.get(pos, 0) + 1
        
        return {
            'total_words': total_words,
            'difficulty_distribution': difficulty_counts,
            'category_distribution': category_counts,
            'part_of_speech_distribution': pos_counts,
            'average_word_length': sum(w['word_length'] for w in self.vocabulary) / total_words,
            'average_syllables': sum(w['syllable_count'] for w in self.vocabulary) / total_words
        }

def main():
    """Interactive command-line interface for vocabulary queries."""
    try:
        vq = VocabularyQuery()
        print("SAT Vocabulary Query Tool")
        print("=" * 40)
        print("Available commands:")
        print("  difficulty <easy|medium|hard> - Show words by difficulty")
        print("  category <category_name> - Show words by category")
        print("  length <min> <max> - Show words by length range")
        print("  syllables <count> - Show words with specific syllable count")
        print("  pos <part_of_speech> - Show words by part of speech")
        print("  word <word> - Look up specific word")
        print("  random [count] [difficulty] [category] - Get random words")
        print("  stats - Show vocabulary statistics")
        print("  categories - List all categories")
        print("  quit - Exit")
        print()
        
        while True:
            try:
                command = input("Enter command: ").strip().split()
                if not command:
                    continue
                
                cmd = command[0].lower()
                
                if cmd == 'quit':
                    break
                
                elif cmd == 'difficulty':
                    if len(command) < 2:
                        print("Usage: difficulty <easy|medium|hard>")
                        continue
                    
                    words = vq.search_by_difficulty(command[1])
                    print(f"\n{len(words)} {command[1]} words:")
                    for word in words[:20]:  # Show first 20
                        print(f"  {word['word']} ({word['part_of_speech']}) - {word['definition'][:50]}...")
                    if len(words) > 20:
                        print(f"  ... and {len(words) - 20} more")
                
                elif cmd == 'category':
                    if len(command) < 2:
                        print("Usage: category <category_name>")
                        continue
                    
                    words = vq.search_by_category(command[1])
                    print(f"\n{len(words)} words in '{command[1]}' category:")
                    for word in words[:15]:  # Show first 15
                        print(f"  {word['word']} ({word['difficulty']}) - {word['definition'][:40]}...")
                    if len(words) > 15:
                        print(f"  ... and {len(words) - 15} more")
                
                elif cmd == 'length':
                    if len(command) < 3:
                        print("Usage: length <min> <max>")
                        continue
                    
                    try:
                        min_len, max_len = int(command[1]), int(command[2])
                        words = vq.search_by_word_length(min_len, max_len)
                        print(f"\n{len(words)} words with length {min_len}-{max_len}:")
                        for word in words[:15]:
                            print(f"  {word['word']} ({word['word_length']} chars, {word['difficulty']})")
                        if len(words) > 15:
                            print(f"  ... and {len(words) - 15} more")
                    except ValueError:
                        print("Please enter valid numbers for min and max length.")
                
                elif cmd == 'syllables':
                    if len(command) < 2:
                        print("Usage: syllables <count>")
                        continue
                    
                    try:
                        count = int(command[1])
                        words = vq.search_by_syllables(count)
                        print(f"\n{len(words)} words with {count} syllables:")
                        for word in words[:15]:
                            print(f"  {word['word']} ({word['difficulty']}) - {word['definition'][:40]}...")
                        if len(words) > 15:
                            print(f"  ... and {len(words) - 15} more")
                    except ValueError:
                        print("Please enter a valid number for syllable count.")
                
                elif cmd == 'pos':
                    if len(command) < 2:
                        print("Usage: pos <part_of_speech> (e.g., 'n.', 'v.', 'adj.')")
                        continue
                    
                    words = vq.search_by_part_of_speech(command[1])
                    print(f"\n{len(words)} {command[1]} words:")
                    for word in words[:15]:
                        print(f"  {word['word']} ({word['difficulty']}) - {word['definition'][:40]}...")
                    if len(words) > 15:
                        print(f"  ... and {len(words) - 15} more")
                
                elif cmd == 'word':
                    if len(command) < 2:
                        print("Usage: word <word_to_lookup>")
                        continue
                    
                    word_data = vq.search_word(command[1])
                    if word_data:
                        print(f"\nWord: {word_data['word']}")
                        print(f"Part of Speech: {word_data['part_of_speech']}")
                        print(f"Definition: {word_data['definition']}")
                        print(f"Example: {word_data['example']}")
                        print(f"Difficulty: {word_data['difficulty']}")
                        print(f"Categories: {', '.join(word_data['categories'])}")
                        print(f"Syllables: {word_data['syllable_count']}")
                        print(f"Length: {word_data['word_length']} characters")
                    else:
                        print(f"Word '{command[1]}' not found.")
                
                elif cmd == 'random':
                    count = 10
                    difficulty = None
                    category = None
                    
                    if len(command) > 1:
                        try:
                            count = int(command[1])
                        except ValueError:
                            pass
                    
                    if len(command) > 2:
                        difficulty = command[2]
                    
                    if len(command) > 3:
                        category = command[3]
                    
                    words = vq.random_words(count, difficulty, category)
                    print(f"\n{len(words)} random words:")
                    for word in words:
                        print(f"  {word['word']} ({word['difficulty']}) - {word['definition'][:50]}...")
                
                elif cmd == 'stats':
                    stats = vq.get_statistics()
                    print(f"\nVocabulary Statistics:")
                    print(f"Total words: {stats['total_words']}")
                    print(f"Average word length: {stats['average_word_length']:.2f}")
                    print(f"Average syllables: {stats['average_syllables']:.2f}")
                    
                    print(f"\nDifficulty distribution:")
                    for diff, count in stats['difficulty_distribution'].items():
                        pct = (count / stats['total_words']) * 100
                        print(f"  {diff}: {count} ({pct:.1f}%)")
                    
                    print(f"\nTop 5 categories:")
                    sorted_cats = sorted(stats['category_distribution'].items(), 
                                       key=lambda x: x[1], reverse=True)
                    for cat, count in sorted_cats[:5]:
                        pct = (count / stats['total_words']) * 100
                        print(f"  {cat}: {count} ({pct:.1f}%)")
                
                elif cmd == 'categories':
                    stats = vq.get_statistics()
                    print(f"\nAll categories:")
                    sorted_cats = sorted(stats['category_distribution'].items(), 
                                       key=lambda x: x[1], reverse=True)
                    for cat, count in sorted_cats:
                        pct = (count / stats['total_words']) * 100
                        cat_formatted = cat.replace('_', ' ').title()
                        print(f"  {cat_formatted}: {count} words ({pct:.1f}%)")
                
                else:
                    print("Unknown command. Type 'quit' to exit.")
                
                print()  # Empty line for readability
                
            except KeyboardInterrupt:
                print("\nGoodbye!")
                break
            except Exception as e:
                print(f"Error: {e}")
    
    except FileNotFoundError:
        print("Error: sat_vocabulary_categorized.json not found.")
        print("Please run vocab_categorizer.py first to generate the categorized vocabulary.")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main()
