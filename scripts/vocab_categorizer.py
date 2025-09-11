#!/usr/bin/env python3
"""
SAT Vocabulary Categorizer and Difficulty Assessor

This script analyzes SAT vocabulary words and assigns:
1. Categories based on semantic meaning and context
2. Difficulty levels (easy, medium, hard) based on various factors
"""

import json
import re
from typing import List, Dict, Any, Set
from collections import defaultdict

class VocabularyCategorizer:
    def __init__(self):
        # Define semantic categories based on common SAT vocabulary themes
        self.categories = {
            'emotions_feelings': {
                'keywords': ['love', 'hate', 'feel', 'emotion', 'mood', 'temperament', 'passion', 'desire', 'fear', 'anger', 'joy', 'sad', 'happy', 'melancholy', 'euphoric', 'despondent', 'elated'],
                'patterns': ['feeling', 'emotional', 'affection', 'sentiment', 'ardor', 'anguish', 'bliss', 'wrath', 'ire'],
                'description': 'Words related to emotions, feelings, and psychological states'
            },
            'behavior_personality': {
                'keywords': ['behavior', 'character', 'personality', 'trait', 'manner', 'conduct', 'attitude', 'disposition', 'temperament', 'bold', 'shy', 'aggressive', 'passive', 'arrogant', 'humble'],
                'patterns': ['behav', 'conduct', 'manner', 'attitude', 'disposition'],
                'description': 'Words describing behavior, personality traits, and character'
            },
            'communication_speech': {
                'keywords': ['speak', 'say', 'tell', 'talk', 'voice', 'word', 'language', 'conversation', 'dialogue', 'rhetoric', 'eloquent', 'articulate', 'verbose', 'taciturn'],
                'patterns': ['speak', 'verbal', 'oral', 'vocal', 'rhetoric', 'eloqu', 'articul'],
                'description': 'Words related to communication, speech, and language'
            },
            'physical_appearance': {
                'keywords': ['look', 'appear', 'beautiful', 'ugly', 'attractive', 'size', 'shape', 'color', 'tall', 'short', 'thin', 'fat', 'elegant', 'graceful', 'clumsy'],
                'patterns': ['visual', 'aesthetic', 'beautiful', 'appearance', 'physical'],
                'description': 'Words describing physical appearance and visual qualities'
            },
            'intellectual_mental': {
                'keywords': ['smart', 'intelligent', 'wise', 'clever', 'stupid', 'ignorant', 'knowledge', 'learn', 'think', 'understand', 'comprehend', 'analyze', 'reason', 'logic'],
                'patterns': ['intellect', 'mental', 'cognitive', 'rational', 'logical', 'wise', 'clever'],
                'description': 'Words related to intelligence, thinking, and mental processes'
            },
            'social_relationships': {
                'keywords': ['friend', 'enemy', 'family', 'social', 'community', 'group', 'society', 'relationship', 'marriage', 'friendship', 'alliance', 'rivalry'],
                'patterns': ['social', 'relationship', 'interpersonal', 'community'],
                'description': 'Words related to social interactions and relationships'
            },
            'power_authority': {
                'keywords': ['power', 'authority', 'control', 'rule', 'govern', 'command', 'dominate', 'submit', 'obey', 'leader', 'follower', 'king', 'president', 'boss'],
                'patterns': ['authority', 'power', 'control', 'dominat', 'subordinat'],
                'description': 'Words related to power, authority, and hierarchy'
            },
            'conflict_struggle': {
                'keywords': ['fight', 'battle', 'war', 'conflict', 'struggle', 'argue', 'dispute', 'disagree', 'oppose', 'resist', 'attack', 'defend'],
                'patterns': ['conflict', 'battle', 'struggle', 'combat', 'opposition'],
                'description': 'Words related to conflict, struggle, and opposition'
            },
            'morality_ethics': {
                'keywords': ['good', 'bad', 'right', 'wrong', 'moral', 'immoral', 'ethical', 'virtue', 'vice', 'honest', 'dishonest', 'noble', 'corrupt'],
                'patterns': ['moral', 'ethical', 'virtue', 'righteous', 'corrupt'],
                'description': 'Words related to morality, ethics, and values'
            },
            'time_change': {
                'keywords': ['time', 'past', 'present', 'future', 'old', 'new', 'ancient', 'modern', 'change', 'transform', 'evolve', 'progress', 'decay'],
                'patterns': ['temporal', 'chronological', 'ancient', 'modern', 'transform'],
                'description': 'Words related to time, change, and temporal concepts'
            },
            'science_nature': {
                'keywords': ['nature', 'natural', 'science', 'biology', 'chemistry', 'physics', 'environment', 'earth', 'water', 'air', 'fire', 'plant', 'animal'],
                'patterns': ['natural', 'scientific', 'biological', 'environmental'],
                'description': 'Words related to science, nature, and natural phenomena'
            },
            'art_culture': {
                'keywords': ['art', 'culture', 'music', 'painting', 'literature', 'poetry', 'creative', 'aesthetic', 'beautiful', 'artistic', 'cultural'],
                'patterns': ['artistic', 'cultural', 'aesthetic', 'creative'],
                'description': 'Words related to art, culture, and creative expression'
            },
            'business_economics': {
                'keywords': ['money', 'business', 'trade', 'commerce', 'economy', 'profit', 'loss', 'wealth', 'poor', 'rich', 'market', 'sell', 'buy'],
                'patterns': ['economic', 'commercial', 'financial', 'monetary'],
                'description': 'Words related to business, economics, and finance'
            },
            'movement_action': {
                'keywords': ['move', 'go', 'come', 'walk', 'run', 'jump', 'dance', 'travel', 'journey', 'motion', 'speed', 'fast', 'slow'],
                'patterns': ['motion', 'movement', 'locomotion', 'kinetic'],
                'description': 'Words related to movement, action, and physical motion'
            },
            'abstract_concepts': {
                'keywords': ['concept', 'idea', 'theory', 'principle', 'philosophy', 'abstract', 'metaphysical', 'existence', 'reality', 'truth', 'meaning'],
                'patterns': ['abstract', 'conceptual', 'theoretical', 'philosophical'],
                'description': 'Words related to abstract concepts and philosophical ideas'
            }
        }
        
        # Common English words for difficulty assessment
        self.common_words = {
            'easy': [
                'make', 'take', 'give', 'come', 'go', 'see', 'know', 'get', 'say', 'think',
                'look', 'want', 'use', 'find', 'work', 'call', 'try', 'ask', 'need', 'feel',
                'become', 'leave', 'put', 'help', 'show', 'play', 'move', 'live', 'believe',
                'bring', 'happen', 'write', 'provide', 'sit', 'stand', 'lose', 'pay', 'meet',
                'include', 'continue', 'set', 'learn', 'change', 'lead', 'understand', 'watch'
            ]
        }
        
        # Syllable patterns for difficulty assessment
        self.prefixes = ['un', 're', 'in', 'dis', 'en', 'non', 'over', 'mis', 'sub', 'pre', 'inter', 'fore', 'de', 'trans', 'super', 'semi', 'anti', 'mid', 'under']
        self.suffixes = ['ing', 'ed', 'er', 'est', 'ly', 'ion', 'tion', 'ation', 'ness', 'ment', 'ful', 'less', 'able', 'ible', 'ous', 'ious', 'al', 'ial', 'ic', 'ive', 'ity', 'ty']

    def count_syllables(self, word: str) -> int:
        """Estimate syllable count for difficulty assessment."""
        word = word.lower().strip()
        vowels = 'aeiouy'
        syllable_count = 0
        prev_was_vowel = False
        
        for char in word:
            if char in vowels:
                if not prev_was_vowel:
                    syllable_count += 1
                prev_was_vowel = True
            else:
                prev_was_vowel = False
        
        # Adjust for silent 'e'
        if word.endswith('e') and syllable_count > 1:
            syllable_count -= 1
        
        # Minimum of 1 syllable
        return max(1, syllable_count)

    def has_complex_morphology(self, word: str) -> bool:
        """Check if word has complex morphological structure."""
        word_lower = word.lower()
        
        # Check for multiple prefixes/suffixes
        prefix_count = sum(1 for prefix in self.prefixes if word_lower.startswith(prefix))
        suffix_count = sum(1 for suffix in self.suffixes if word_lower.endswith(suffix))
        
        return prefix_count >= 2 or suffix_count >= 2 or (prefix_count >= 1 and suffix_count >= 1)

    def assess_definition_complexity(self, definition: str) -> str:
        """Assess complexity based on definition characteristics."""
        words_in_def = definition.lower().split()
        
        # Check for complex vocabulary in definition
        complex_indicators = [
            'characterized by', 'pertaining to', 'in accordance with', 'with respect to',
            'philosophical', 'metaphysical', 'theoretical', 'conceptual', 'abstract',
            'extremely', 'excessively', 'profoundly', 'inherently', 'fundamentally'
        ]
        
        definition_lower = definition.lower()
        has_complex_language = any(indicator in definition_lower for indicator in complex_indicators)
        
        # Length and structure analysis
        avg_word_length = sum(len(word) for word in words_in_def) / len(words_in_def) if words_in_def else 0
        
        if has_complex_language or avg_word_length > 6:
            return 'complex'
        elif avg_word_length > 4.5:
            return 'moderate'
        else:
            return 'simple'

    def categorize_word(self, word: str, definition: str, example: str) -> List[str]:
        """Categorize a word based on its definition and example."""
        categories = []
        text_to_analyze = f"{word} {definition} {example}".lower()
        
        for category_name, category_data in self.categories.items():
            score = 0
            
            # Check keywords
            for keyword in category_data['keywords']:
                if keyword in text_to_analyze:
                    score += 2
            
            # Check patterns
            for pattern in category_data['patterns']:
                if pattern in text_to_analyze:
                    score += 3
            
            # Add category if score is high enough
            if score >= 3:
                categories.append(category_name)
        
        # Default category if no matches
        if not categories:
            categories = ['general']
        
        return categories

    def assess_difficulty(self, word: str, definition: str, part_of_speech: str) -> str:
        """Assess difficulty level of a vocabulary word."""
        difficulty_score = 0
        
        # Factor 1: Word length
        word_length = len(word)
        if word_length <= 4:
            difficulty_score += 0
        elif word_length <= 7:
            difficulty_score += 1
        else:
            difficulty_score += 2
        
        # Factor 2: Syllable count
        syllables = self.count_syllables(word)
        if syllables <= 2:
            difficulty_score += 0
        elif syllables <= 3:
            difficulty_score += 1
        else:
            difficulty_score += 2
        
        # Factor 3: Morphological complexity
        if self.has_complex_morphology(word):
            difficulty_score += 2
        
        # Factor 4: Definition complexity
        def_complexity = self.assess_definition_complexity(definition)
        if def_complexity == 'simple':
            difficulty_score += 0
        elif def_complexity == 'moderate':
            difficulty_score += 1
        else:
            difficulty_score += 2
        
        # Factor 5: Part of speech complexity
        if part_of_speech in ['n.', 'v.', 'adj.']:
            difficulty_score += 0
        else:  # adverbs, complex forms
            difficulty_score += 1
        
        # Factor 6: Etymology/origin indicators
        word_lower = word.lower()
        latin_greek_indicators = ['ph', 'ch', 'th', 'qu', 'x', 'z']
        if any(indicator in word_lower for indicator in latin_greek_indicators):
            if len(word) > 6:  # Only for longer words
                difficulty_score += 1
        
        # Factor 7: Common usage (reverse scoring - common words are easier)
        if word_lower in self.common_words['easy']:
            difficulty_score -= 2
        
        # Convert score to difficulty level
        if difficulty_score <= 2:
            return 'easy'
        elif difficulty_score <= 5:
            return 'medium'
        else:
            return 'hard'

    def process_vocabulary(self, vocab_data: List[Dict]) -> List[Dict]:
        """Process vocabulary data and add categories and difficulty."""
        processed_vocab = []
        category_stats = defaultdict(int)
        difficulty_stats = defaultdict(int)
        
        for entry in vocab_data:
            word = entry.get('word', '')
            definition = entry.get('definition', '')
            example = entry.get('example', '')
            part_of_speech = entry.get('part_of_speech', '')
            
            # Categorize word
            categories = self.categorize_word(word, definition, example)
            
            # Assess difficulty
            difficulty = self.assess_difficulty(word, definition, part_of_speech)
            
            # Create enhanced entry
            enhanced_entry = entry.copy()
            enhanced_entry['categories'] = categories
            enhanced_entry['difficulty'] = difficulty
            enhanced_entry['syllable_count'] = self.count_syllables(word)
            enhanced_entry['word_length'] = len(word)
            
            processed_vocab.append(enhanced_entry)
            
            # Update statistics
            for category in categories:
                category_stats[category] += 1
            difficulty_stats[difficulty] += 1
        
        return processed_vocab, dict(category_stats), dict(difficulty_stats)

def main():
    """Main function to run the vocabulary categorizer."""
    input_file = 'sat_vocabulary_parsed.json'
    output_file = 'sat_vocabulary_categorized.json'
    
    try:
        # Load vocabulary data
        with open(input_file, 'r', encoding='utf-8') as f:
            vocab_data = json.load(f)
        
        print(f"Processing {len(vocab_data)} vocabulary words...")
        
        # Initialize categorizer
        categorizer = VocabularyCategorizer()
        
        # Process vocabulary
        processed_vocab, category_stats, difficulty_stats = categorizer.process_vocabulary(vocab_data)
        
        # Save processed data
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(processed_vocab, f, indent=2, ensure_ascii=False)
        
        # Print statistics
        print(f"\nProcessing complete! Enhanced vocabulary saved to: {output_file}")
        print(f"\nDifficulty Distribution:")
        for difficulty, count in sorted(difficulty_stats.items()):
            percentage = (count / len(vocab_data)) * 100
            print(f"  {difficulty.capitalize()}: {count} words ({percentage:.1f}%)")
        
        print(f"\nTop 10 Categories:")
        sorted_categories = sorted(category_stats.items(), key=lambda x: x[1], reverse=True)
        for category, count in sorted_categories[:10]:
            percentage = (count / len(vocab_data)) * 100
            print(f"  {category.replace('_', ' ').title()}: {count} words ({percentage:.1f}%)")
        
        # Show examples for each difficulty level
        print(f"\nExample words by difficulty:")
        examples_by_difficulty = defaultdict(list)
        for entry in processed_vocab[:50]:  # First 50 for examples
            difficulty = entry['difficulty']
            if len(examples_by_difficulty[difficulty]) < 5:
                examples_by_difficulty[difficulty].append(entry['word'])
        
        for difficulty in ['easy', 'medium', 'hard']:
            if difficulty in examples_by_difficulty:
                print(f"  {difficulty.capitalize()}: {', '.join(examples_by_difficulty[difficulty])}")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
        print("Please make sure the file exists in the current directory.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_file}'")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
