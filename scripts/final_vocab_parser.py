#!/usr/bin/env python3

import json
import re
from collections import defaultdict

def parse_sat_vocabulary():
    """Parse SAT vocabulary from extracted PDF text."""
    
    # Load extracted text
    with open('extracted_text.json', 'r', encoding='utf-8') as f:
        text_data = json.load(f)
    
    # Combine all text
    full_text = ""
    for page in text_data:
        full_text += page['text'] + "\n"
    
    # Split into lines and clean
    lines = [line.strip() for line in full_text.split('\n') if line.strip()]
    
    # Parse vocabulary entries
    entries = []
    current_word = None
    current_pos = None
    current_definition = None
    current_example = None
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Skip headers and single letters
        if ('SAT Vocabulary' in line or 
            line in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' or 
            len(line) <= 2):
            i += 1
            continue
        
        # Check if this is a word entry (single word, lowercase)
        if (re.match(r'^[a-z]+(?:\s[a-z]+)*$', line) and 
            len(line.split()) <= 2 and 
            len(line) >= 3):
            
            # Save previous entry if complete
            if current_word and current_definition:
                entries.append({
                    'word': current_word,
                    'part_of_speech': normalize_pos(current_pos or 'unknown'),
                    'definition': clean_definition(current_definition),
                    'example': clean_example(current_example or ''),
                    'difficulty': assess_difficulty(current_word, current_definition or ''),
                    'category': categorize_word(current_word, current_definition or ''),
                    'word_length': len(current_word),
                    'syllable_count': count_syllables(current_word),
                    'etymology': guess_etymology(current_word),
                    'memory_aid': create_memory_aid(current_word),
                    'learning_tips': generate_learning_tips(current_word, current_definition or '')
                })
            
            # Start new entry
            current_word = line.lower().strip()
            current_pos = None
            current_definition = None
            current_example = None
            
        # Check for part of speech and definition
        elif current_word:
            pos_match = re.search(r'\(([nvadj.]+)\)', line)
            if pos_match:
                current_pos = pos_match.group(1)
                # Extract definition from the same line
                definition_part = re.sub(r'\([nvadj.]+\)', '', line).strip()
                if definition_part:
                    current_definition = definition_part
            
            # Check for example in parentheses (long enough to be meaningful)
            elif line.startswith('(') and line.endswith(')') and len(line) > 20:
                current_example = line[1:-1]  # Remove parentheses
            
            # If no definition yet and this looks like one
            elif not current_definition and len(line) > 10 and not line.startswith('('):
                current_definition = line
        
        i += 1
    
    # Don't forget the last entry
    if current_word and current_definition:
        entries.append({
            'word': current_word,
            'part_of_speech': normalize_pos(current_pos or 'unknown'),
            'definition': clean_definition(current_definition),
            'example': clean_example(current_example or ''),
            'difficulty': assess_difficulty(current_word, current_definition or ''),
            'category': categorize_word(current_word, current_definition or ''),
            'word_length': len(current_word),
            'syllable_count': count_syllables(current_word),
            'etymology': guess_etymology(current_word),
            'memory_aid': create_memory_aid(current_word),
            'learning_tips': generate_learning_tips(current_word, current_definition or '')
        })
    
    return entries

def clean_definition(definition):
    """Clean up definition text."""
    if not definition:
        return ""
    
    # Remove extra whitespace and artifacts
    definition = re.sub(r'\s+', ' ', definition)
    definition = definition.strip()
    
    # Remove any remaining part of speech markers
    definition = re.sub(r'\([nvadj.]+\)', '', definition).strip()
    
    return definition

def clean_example(example):
    """Clean up example text."""
    if not example:
        return ""
    
    # Remove extra whitespace
    example = re.sub(r'\s+', ' ', example)
    return example.strip()

def normalize_pos(pos_str):
    """Normalize part of speech abbreviation."""
    pos_mapping = {
        'v.': 'verb',
        'n.': 'noun',
        'adj.': 'adjective', 
        'adv.': 'adverb'
    }
    return pos_mapping.get(pos_str.lower(), pos_str)

def count_syllables(word):
    """Count syllables in a word."""
    word = word.lower().replace(' ', '')
    
    # Count vowel groups
    vowel_pattern = re.findall(r'[aeiouy]+', word)
    syllable_count = len(vowel_pattern)
    
    # Adjust for silent e
    if word.endswith('e') and syllable_count > 1:
        syllable_count -= 1
    
    # Adjust for -le ending
    if word.endswith('le') and len(word) > 2 and word[-3] not in 'aeiouy':
        syllable_count += 1
    
    return max(1, syllable_count)

def assess_difficulty(word, definition):
    """Assess difficulty level based on multiple factors."""
    score = 0
    
    # Word length factor
    length = len(word)
    if length >= 12:
        score += 4
    elif length >= 9:
        score += 3
    elif length >= 7:
        score += 2
    elif length >= 5:
        score += 1
    
    # Syllable count factor
    syllables = count_syllables(word)
    if syllables >= 5:
        score += 3
    elif syllables >= 4:
        score += 2
    elif syllables >= 3:
        score += 1
    
    # Complex morphology
    complex_suffixes = [
        'tion', 'sion', 'ous', 'ious', 'eous', 'ance', 'ence', 
        'ment', 'ity', 'acy', 'ism', 'ist', 'ary', 'ery', 'ory'
    ]
    
    if any(word.endswith(suffix) for suffix in complex_suffixes):
        score += 2
    
    # Complex prefixes
    complex_prefixes = [
        'circum', 'contra', 'extra', 'inter', 'intra', 
        'super', 'trans', 'ultra', 'anti'
    ]
    
    if any(word.startswith(prefix) for prefix in complex_prefixes):
        score += 1
    
    # Definition analysis
    if definition:
        text = (word + ' ' + definition).lower()
        
        # Difficulty indicators in definition
        hard_indicators = [
            'complex', 'intricate', 'sophisticated', 'elaborate', 'profound',
            'abstruse', 'arcane', 'esoteric', 'recondite', 'obscure',
            'abstract', 'philosophical', 'theoretical', 'metaphysical'
        ]
        
        easy_indicators = [
            'simple', 'basic', 'common', 'everyday', 'ordinary', 
            'plain', 'clear', 'obvious', 'straightforward'
        ]
        
        for indicator in hard_indicators:
            if indicator in text:
                score += 2
        
        for indicator in easy_indicators:
            if indicator in text:
                score -= 2
    
    # Common SAT words are generally easier
    high_frequency_sat_words = [
        'analyze', 'approach', 'assess', 'assume', 'compare', 'conclude',
        'contrast', 'define', 'demonstrate', 'describe', 'determine',
        'evaluate', 'examine', 'explain', 'identify', 'illustrate',
        'indicate', 'interpret', 'support', 'suggest', 'summarize'
    ]
    
    if word in high_frequency_sat_words:
        score -= 2
    
    # Return difficulty level
    if score >= 8:
        return 'hard'
    elif score >= 4:
        return 'medium'
    else:
        return 'easy'

def categorize_word(word, definition):
    """Categorize word by semantic field."""
    if not definition:
        return 'general'
    
    text = (word + ' ' + definition).lower()
    
    # Semantic categories with keywords
    categories = {
        'emotions_psychology': [
            'emotion', 'feeling', 'mood', 'sentiment', 'passion', 'desire',
            'joy', 'happiness', 'sadness', 'anger', 'fear', 'anxiety', 'worry',
            'love', 'hate', 'disgust', 'surprise', 'excitement', 'calm',
            'melancholy', 'euphoria', 'despair', 'bliss', 'rage', 'terror',
            'affection', 'anguish', 'delight', 'misery', 'ecstasy', 'sorrow',
            'psychological', 'mental', 'temperament'
        ],
        'cognition_intellect': [
            'think', 'thought', 'mind', 'mental', 'cognitive', 'intellect',
            'intelligence', 'reason', 'reasoning', 'logic', 'logical',
            'analysis', 'understand', 'comprehend', 'perceive', 'conceive',
            'contemplate', 'ponder', 'reflect', 'consider', 'deliberate',
            'rational', 'wisdom', 'insight', 'intuition', 'consciousness',
            'awareness', 'knowledge', 'learning', 'study'
        ],
        'communication_speech': [
            'speak', 'speaking', 'say', 'saying', 'tell', 'telling', 'talk',
            'talking', 'communicate', 'communication', 'language', 'word',
            'speech', 'voice', 'conversation', 'dialogue', 'discourse',
            'rhetoric', 'eloquent', 'articulate', 'verbose', 'taciturn',
            'loquacious', 'narrative', 'story', 'express', 'pronounce'
        ],
        'social_relationships': [
            'social', 'society', 'community', 'people', 'person', 'group',
            'friend', 'friendship', 'family', 'relationship', 'culture',
            'cultural', 'tradition', 'custom', 'cooperation', 'collaboration',
            'conflict', 'harmony', 'discord', 'unity', 'division', 'together'
        ],
        'morality_ethics': [
            'moral', 'morality', 'ethical', 'ethics', 'virtue', 'virtuous',
            'vice', 'good', 'goodness', 'evil', 'right', 'wrong', 'justice',
            'injustice', 'fair', 'unfair', 'honest', 'honesty', 'dishonest',
            'integrity', 'corruption', 'noble', 'ignoble', 'righteous',
            'wicked', 'principled', 'unprincipled'
        ],
        'authority_power': [
            'power', 'powerful', 'authority', 'control', 'dominance', 'dominate',
            'submission', 'submit', 'rule', 'ruler', 'govern', 'government',
            'command', 'obey', 'leader', 'leadership', 'follower', 'hierarchy',
            'rank', 'status', 'privilege', 'oppression', 'freedom', 'liberty',
            'tyranny', 'democracy', 'political', 'politics'
        ],
        'appearance_aesthetics': [
            'beautiful', 'beauty', 'ugly', 'appearance', 'look', 'looking',
            'attractive', 'unattractive', 'elegant', 'elegance', 'graceful',
            'clumsy', 'aesthetic', 'artistic', 'art', 'ornate', 'plain',
            'fancy', 'gorgeous', 'hideous', 'charming', 'repulsive', 'pretty'
        ],
        'size_quantity': [
            'big', 'large', 'huge', 'enormous', 'gigantic', 'vast', 'immense',
            'small', 'tiny', 'minute', 'diminutive', 'massive', 'abundant',
            'scarce', 'plentiful', 'copious', 'meager', 'substantial',
            'negligible', 'minuscule', 'size', 'quantity', 'amount'
        ],
        'time_temporality': [
            'time', 'temporal', 'permanent', 'temporary', 'eternal', 'momentary',
            'chronic', 'acute', 'ancient', 'old', 'modern', 'contemporary',
            'current', 'archaic', 'obsolete', 'future', 'past', 'present',
            'brief', 'long', 'lasting', 'enduring', 'fleeting'
        ],
        'movement_action': [
            'move', 'movement', 'motion', 'go', 'going', 'come', 'coming',
            'run', 'running', 'walk', 'walking', 'travel', 'journey',
            'proceed', 'advance', 'retreat', 'approach', 'depart', 'arrive',
            'action', 'act', 'activity', 'perform', 'execute'
        ]
    }
    
    # Parse entries
    for i, line in enumerate(lines):
        # Skip headers
        if ('SAT Vocabulary' in line or 
            line in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' or 
            len(line) <= 2):
            continue
        
        # Check if this is a new vocabulary word
        if (re.match(r'^[a-z]+(?:\s[a-z]+)*$', line) and 
            len(line.split()) <= 2 and 
            len(line) >= 3):
            
            # Save previous entry
            if current_word and current_definition:
                
                # Determine category
                category = 'general'
                text = (current_word + ' ' + current_definition).lower()
                for cat_name, keywords in categories.items():
                    if any(keyword in text for keyword in keywords):
                        category = cat_name
                        break
                
                entries.append({
                    'word': current_word,
                    'part_of_speech': normalize_pos(current_pos or 'unknown'),
                    'definition': clean_definition(current_definition),
                    'example': clean_example(current_example or ''),
                    'difficulty': assess_difficulty(current_word, current_definition),
                    'category': category,
                    'word_length': len(current_word),
                    'syllable_count': count_syllables(current_word),
                    'etymology': guess_etymology(current_word),
                    'memory_aid': create_memory_aid(current_word),
                    'learning_tips': generate_learning_tips(current_word, current_definition)
                })
            
            # Start new word
            current_word = line.lower().strip()
            current_pos = None
            current_definition = None
            current_example = None
            
        # Look for part of speech and definition
        elif current_word:
            pos_match = re.search(r'\(([nvadj.]+)\)', line)
            if pos_match:
                current_pos = pos_match.group(1)
                # Get definition from same line
                def_part = re.sub(r'\([nvadj.]+\)', '', line).strip()
                if def_part:
                    current_definition = def_part
            
            # Look for example (parentheses with substantial content)
            elif line.startswith('(') and line.endswith(')') and len(line) > 20:
                current_example = line[1:-1]
            
            # Look for definition line
            elif not current_definition and len(line) > 15:
                current_definition = line
    
    # Add the final entry
    if current_word and current_definition:
        category = 'general'
        text = (current_word + ' ' + current_definition).lower()
        for cat_name, keywords in categories.items():
            if any(keyword in text for keyword in keywords):
                category = cat_name
                break
        
        entries.append({
            'word': current_word,
            'part_of_speech': normalize_pos(current_pos or 'unknown'),
            'definition': clean_definition(current_definition),
            'example': clean_example(current_example or ''),
            'difficulty': assess_difficulty(current_word, current_definition),
            'category': category,
            'word_length': len(current_word),
            'syllable_count': count_syllables(current_word),
            'etymology': guess_etymology(current_word),
            'memory_aid': create_memory_aid(current_word),
            'learning_tips': generate_learning_tips(current_word, current_definition)
        })
    
    return entries

def clean_definition(definition):
    """Clean up definition text."""
    if not definition:
        return ""
    
    definition = re.sub(r'\s+', ' ', definition).strip()
    definition = re.sub(r'\([nvadj.]+\)', '', definition).strip()
    
    # Remove any leading/trailing punctuation artifacts
    definition = definition.strip('.,;:')
    
    return definition

def clean_example(example):
    """Clean up example text."""
    if not example:
        return ""
    return re.sub(r'\s+', ' ', example).strip()

def normalize_pos(pos_str):
    """Normalize part of speech."""
    mapping = {
        'v.': 'verb',
        'n.': 'noun',
        'adj.': 'adjective',
        'adv.': 'adverb'
    }
    return mapping.get(pos_str.lower(), 'unknown')

def count_syllables(word):
    """Count syllables in word."""
    word = word.lower().replace(' ', '')
    vowel_groups = len(re.findall(r'[aeiouy]+', word))
    
    # Adjust for silent e
    if word.endswith('e') and vowel_groups > 1:
        vowel_groups -= 1
    
    # Adjust for -le ending
    if (word.endswith('le') and len(word) > 2 and 
        word[-3] not in 'aeiouy'):
        vowel_groups += 1
    
    return max(1, vowel_groups)

def assess_difficulty(word, definition):
    """Assess difficulty level."""
    score = 0
    
    # Length scoring
    length = len(word)
    if length >= 12: score += 4
    elif length >= 9: score += 3  
    elif length >= 7: score += 2
    elif length >= 5: score += 1
    
    # Syllable scoring
    syllables = count_syllables(word)
    score += max(0, syllables - 2)
    
    # Morphological complexity
    complex_endings = ['tion', 'sion', 'ous', 'ious', 'eous', 'ance', 'ence', 'ment', 'ity']
    if any(word.endswith(ending) for ending in complex_endings):
        score += 2
        
    complex_prefixes = ['circum', 'contra', 'extra', 'inter', 'super', 'trans']
    if any(word.startswith(prefix) for prefix in complex_prefixes):
        score += 1
    
    # Definition complexity
    if definition:
        text = (word + ' ' + definition).lower()
        hard_words = ['complex', 'intricate', 'sophisticated', 'profound', 'arcane', 'esoteric']
        easy_words = ['simple', 'basic', 'common', 'clear', 'plain']
        
        score += sum(2 for hw in hard_words if hw in text)
        score -= sum(1 for ew in easy_words if ew in text)
    
    # Common SAT words are easier
    common_sat = ['analyze', 'assess', 'compare', 'contrast', 'define', 'evaluate', 'identify', 'interpret']
    if word in common_sat:
        score -= 2
    
    # Return difficulty
    if score >= 8: return 'hard'
    elif score >= 4: return 'medium'
    else: return 'easy'

def categorize_word(word, definition):
    """Categorize by semantic meaning."""
    if not definition:
        return 'general'
    
    text = (word + ' ' + definition).lower()
    
    # Category keywords
    emotion_words = ['feel', 'emotion', 'mood', 'happy', 'sad', 'angry', 'fear', 'love', 'joy', 'passion', 'delight']
    thinking_words = ['think', 'mind', 'reason', 'logic', 'understand', 'analyze', 'consider', 'wisdom']
    social_words = ['social', 'people', 'friend', 'group', 'community', 'society', 'relationship']
    action_words = ['do', 'make', 'act', 'perform', 'create', 'build', 'move', 'go', 'come']
    appearance_words = ['beautiful', 'ugly', 'look', 'attractive', 'elegant', 'aesthetic', 'artistic']
    moral_words = ['good', 'evil', 'right', 'wrong', 'virtue', 'moral', 'ethical', 'honest']
    
    if any(word in text for word in emotion_words):
        return 'emotions_psychology'
    elif any(word in text for word in thinking_words):
        return 'cognition_intellect'
    elif any(word in text for word in social_words):
        return 'social_relationships'
    elif any(word in text for word in action_words):
        return 'actions_behavior'
    elif any(word in text for word in appearance_words):
        return 'appearance_aesthetics'
    elif any(word in text for word in moral_words):
        return 'morality_ethics'
    else:
        return 'general'

def guess_etymology(word):
    """Guess word etymology."""
    # Common patterns
    if any(word.endswith(suffix) for suffix in ['tion', 'sion', 'ous', 'ious', 'ic', 'ity', 'ate']):
        return 'Latin'
    elif any(pattern in word for pattern in ['graph', 'phon', 'log', 'psych', 'phil', 'soph']):
        return 'Greek'
    elif any(word.endswith(suffix) for suffix in ['ance', 'ence', 'ment', 'age']):
        return 'French'
    elif any(word.endswith(suffix) for suffix in ['ness', 'ful', 'less', 'ship']):
        return 'Germanic'
    else:
        return 'Mixed/Unknown'

def create_memory_aid(word):
    """Create memory aid for word."""
    # Basic prefix-based aids
    if word.startswith('ab'): return "AB- = away from"
    elif word.startswith('ad'): return "AD- = toward"  
    elif word.startswith('con'): return "CON- = together"
    elif word.startswith('de'): return "DE- = away/down"
    elif word.startswith('dis'): return "DIS- = not/opposite"
    elif word.startswith('ex'): return "EX- = out"
    elif word.startswith('in'): return "IN- = not/into"
    elif word.startswith('pre'): return "PRE- = before"
    elif word.startswith('pro'): return "PRO- = forward"
    elif word.startswith('re'): return "RE- = again/back"
    elif word.startswith('sub'): return "SUB- = under"
    elif word.startswith('trans'): return "TRANS- = across"
    else: return f"Break down '{word}' into parts"

def generate_learning_tips(word, definition):
    """Generate learning tips."""
    tips = []
    
    # Syllable tip for long words
    if count_syllables(word) >= 4:
        tips.append(f"Break into syllables: {'-'.join(split_syllables(word))}")
    
    # Etymology tip
    etymology = guess_etymology(word)
    if etymology != 'Mixed/Unknown':
        tips.append(f"Has {etymology} origins")
    
    # Common confusion warning
    confusions = {
        'affect': 'effect', 'illicit': 'elicit', 'allusion': 'illusion',
        'compliment': 'complement', 'discrete': 'discreet'
    }
    if word in confusions:
        tips.append(f"Don't confuse with '{confusions[word]}'")
    
    return tips[:3]  # Max 3 tips

def split_syllables(word):
    """Basic syllable splitting for learning aid."""
    # Simple approach - split on vowel groups
    parts = re.split(r'([aeiouy]+)', word.lower())
    syllables = []
    current = ""
    
    for part in parts:
        current += part
        if re.search(r'[aeiouy]', part):  # If contains vowel
            syllables.append(current)
            current = ""
    
    if current:  # Add remaining
        if syllables:
            syllables[-1] += current
        else:
            syllables.append(current)
    
    return syllables if syllables else [word]

# Main execution
if __name__ == "__main__":
    print("Parsing SAT vocabulary from PDF...")
    
    entries = parse_sat_vocabulary()
    
    print(f"Successfully parsed {len(entries)} vocabulary entries")
    
    # Create comprehensive output
    difficulty_dist = defaultdict(int)
    category_dist = defaultdict(int)
    pos_dist = defaultdict(int)
    
    for entry in entries:
        difficulty_dist[entry['difficulty']] += 1
        category_dist[entry['category']] += 1
        pos_dist[entry['part_of_speech']] += 1
    
    # Final output structure
    final_output = {
        "metadata": {
            "title": "SAT Vocabulary - Complete Educational Dataset",
            "description": "Comprehensive SAT vocabulary list with difficulty assessment, categorization, and learning aids for educational platforms",
            "version": "1.0",
            "source": "SAT Vocabulary Full PDF - 1000 Most Common SAT Words",
            "total_entries": len(entries),
            "created_for": "Educational learning platform",
            "features_included": [
                "difficulty_assessment", "semantic_categorization", "etymology_analysis",
                "memory_aids", "learning_tips", "syllable_breakdown", "part_of_speech",
                "example_sentences", "word_length_analysis"
            ],
            "difficulty_system": {
                "easy": "Short words (≤6 chars), simple concepts, common usage",
                "medium": "Moderate length (7-9 chars), academic terms, some complexity", 
                "hard": "Long words (≥10 chars), complex concepts, specialized usage"
            }
        },
        "statistics": {
            "total_words": len(entries),
            "difficulty_distribution": dict(difficulty_dist),
            "category_distribution": dict(category_dist),
            "part_of_speech_distribution": dict(pos_dist),
            "average_word_length": round(sum(entry['word_length'] for entry in entries) / len(entries), 1),
            "average_syllable_count": round(sum(entry['syllable_count'] for entry in entries) / len(entries), 1)
        },
        "vocabulary": entries
    }
    
    # Save to JSON file
    with open('sat_vocabulary_educational.json', 'w', encoding='utf-8') as f:
        json.dump(final_output, f, indent=2, ensure_ascii=False)
    
    # Print summary
    print("\n" + "="*50)
    print("SAT VOCABULARY PROCESSING COMPLETE")
    print("="*50)
    print(f"📚 Total vocabulary entries: {len(entries)}")
    print(f"📊 Difficulty breakdown:")
    print(f"   • Easy: {difficulty_dist['easy']} words")
    print(f"   • Medium: {difficulty_dist['medium']} words") 
    print(f"   • Hard: {difficulty_dist['hard']} words")
    print(f"🏷️ Categories: {len(category_dist)} different semantic categories")
    print(f"📝 Parts of speech: {list(pos_dist.keys())}")
    print(f"📏 Average word length: {final_output['statistics']['average_word_length']} characters")
    print(f"🔤 Average syllables: {final_output['statistics']['average_syllable_count']}")
    print(f"\n💾 Saved as: sat_vocabulary_educational.json")
    print(f"🎯 Ready for your educational platform!")
