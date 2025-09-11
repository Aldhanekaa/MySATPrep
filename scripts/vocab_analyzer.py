#!/usr/bin/env python3
"""
Vocabulary Analysis and Insights Generator

This script analyzes the categorized vocabulary data and provides detailed insights.
"""

import json
from collections import defaultdict, Counter
from typing import Dict, List, Any

def analyze_vocabulary_data(vocab_data: List[Dict]) -> Dict[str, Any]:
    """Analyze categorized vocabulary data and generate insights."""
    
    analysis = {
        'total_words': len(vocab_data),
        'difficulty_analysis': defaultdict(list),
        'category_analysis': defaultdict(list),
        'complexity_metrics': {},
        'category_difficulty_matrix': defaultdict(lambda: defaultdict(int)),
        'part_of_speech_analysis': defaultdict(list),
        'word_length_distribution': defaultdict(int),
        'syllable_distribution': defaultdict(int)
    }
    
    # Collect data for analysis
    for entry in vocab_data:
        word = entry['word']
        difficulty = entry['difficulty']
        categories = entry['categories']
        pos = entry['part_of_speech']
        word_length = entry['word_length']
        syllable_count = entry['syllable_count']
        
        # Difficulty analysis
        analysis['difficulty_analysis'][difficulty].append(word)
        
        # Category analysis
        for category in categories:
            analysis['category_analysis'][category].append(word)
            analysis['category_difficulty_matrix'][category][difficulty] += 1
        
        # Part of speech analysis
        analysis['part_of_speech_analysis'][pos].append(word)
        
        # Length and syllable distributions
        analysis['word_length_distribution'][word_length] += 1
        analysis['syllable_distribution'][syllable_count] += 1
    
    # Calculate complexity metrics
    total_words = len(vocab_data)
    avg_word_length = sum(entry['word_length'] for entry in vocab_data) / total_words
    avg_syllables = sum(entry['syllable_count'] for entry in vocab_data) / total_words
    
    analysis['complexity_metrics'] = {
        'average_word_length': round(avg_word_length, 2),
        'average_syllables': round(avg_syllables, 2),
        'longest_words': sorted(vocab_data, key=lambda x: x['word_length'], reverse=True)[:10],
        'most_syllables': sorted(vocab_data, key=lambda x: x['syllable_count'], reverse=True)[:10]
    }
    
    return analysis

def generate_difficulty_recommendations(analysis: Dict[str, Any]) -> Dict[str, List[str]]:
    """Generate study recommendations based on difficulty levels."""
    
    recommendations = {
        'easy': [
            "Start with these foundational vocabulary words",
            "Use these for warm-up exercises",
            "Perfect for building confidence",
            "Good for daily review sessions"
        ],
        'medium': [
            "Core SAT vocabulary - focus your main study time here",
            "Practice using these in context",
            "Create flashcards for regular review",
            "Most common on actual SAT tests"
        ],
        'hard': [
            "Advanced vocabulary for high scores",
            "Study these after mastering easy/medium words",
            "Focus on etymology and word roots",
            "Practice with challenging reading passages"
        ]
    }
    
    return recommendations

def print_detailed_analysis(analysis: Dict[str, Any]):
    """Print comprehensive analysis of vocabulary data."""
    
    print("=" * 60)
    print("SAT VOCABULARY ANALYSIS REPORT")
    print("=" * 60)
    
    # Overview
    print(f"\n📊 OVERVIEW")
    print(f"Total vocabulary words: {analysis['total_words']}")
    print(f"Average word length: {analysis['complexity_metrics']['average_word_length']} characters")
    print(f"Average syllables: {analysis['complexity_metrics']['average_syllables']}")
    
    # Difficulty Distribution
    print(f"\n🎯 DIFFICULTY DISTRIBUTION")
    for difficulty in ['easy', 'medium', 'hard']:
        count = len(analysis['difficulty_analysis'][difficulty])
        percentage = (count / analysis['total_words']) * 100
        print(f"  {difficulty.capitalize()}: {count} words ({percentage:.1f}%)")
    
    # Category Analysis
    print(f"\n📚 CATEGORY BREAKDOWN")
    sorted_categories = sorted(analysis['category_analysis'].items(), 
                             key=lambda x: len(x[1]), reverse=True)
    
    for category, words in sorted_categories[:15]:  # Top 15 categories
        count = len(words)
        percentage = (count / analysis['total_words']) * 100
        category_name = category.replace('_', ' ').title()
        print(f"  {category_name}: {count} words ({percentage:.1f}%)")
    
    # Part of Speech Distribution
    print(f"\n🔤 PART OF SPEECH DISTRIBUTION")
    pos_counts = {pos: len(words) for pos, words in analysis['part_of_speech_analysis'].items()}
    sorted_pos = sorted(pos_counts.items(), key=lambda x: x[1], reverse=True)
    
    for pos, count in sorted_pos:
        percentage = (count / analysis['total_words']) * 100
        print(f"  {pos}: {count} words ({percentage:.1f}%)")
    
    # Complexity Insights
    print(f"\n🧠 COMPLEXITY INSIGHTS")
    print(f"Longest words:")
    for entry in analysis['complexity_metrics']['longest_words'][:5]:
        print(f"  • {entry['word']} ({entry['word_length']} characters) - {entry['difficulty']}")
    
    print(f"\nMost syllables:")
    for entry in analysis['complexity_metrics']['most_syllables'][:5]:
        print(f"  • {entry['word']} ({entry['syllable_count']} syllables) - {entry['difficulty']}")
    
    # Study Recommendations
    print(f"\n📖 STUDY RECOMMENDATIONS")
    recommendations = generate_difficulty_recommendations(analysis)
    
    for difficulty, tips in recommendations.items():
        word_count = len(analysis['difficulty_analysis'][difficulty])
        print(f"\n{difficulty.upper()} Words ({word_count} total):")
        for tip in tips:
            print(f"  • {tip}")
        
        # Show example words
        examples = analysis['difficulty_analysis'][difficulty][:8]
        print(f"  Examples: {', '.join(examples)}")
    
    # Category-Difficulty Matrix (interesting insights)
    print(f"\n🎨 CATEGORY INSIGHTS")
    print("Most challenging categories (highest % of hard words):")
    
    category_difficulty_ratios = []
    for category, difficulty_counts in analysis['category_difficulty_matrix'].items():
        total_in_category = sum(difficulty_counts.values())
        hard_ratio = difficulty_counts['hard'] / total_in_category if total_in_category > 0 else 0
        
        if total_in_category >= 10:  # Only categories with sufficient words
            category_difficulty_ratios.append((category, hard_ratio, total_in_category))
    
    category_difficulty_ratios.sort(key=lambda x: x[1], reverse=True)
    
    for category, ratio, total in category_difficulty_ratios[:5]:
        category_name = category.replace('_', ' ').title()
        percentage = ratio * 100
        print(f"  • {category_name}: {percentage:.1f}% hard words ({total} total)")

def main():
    """Main function to analyze categorized vocabulary."""
    input_file = 'sat_vocabulary_categorized.json'
    
    try:
        # Load categorized vocabulary data
        with open(input_file, 'r', encoding='utf-8') as f:
            vocab_data = json.load(f)
        
        # Analyze the data
        analysis = analyze_vocabulary_data(vocab_data)
        
        # Print detailed analysis
        print_detailed_analysis(analysis)
        
        # Save analysis to file
        analysis_output = {
            'metadata': {
                'total_words': analysis['total_words'],
                'complexity_metrics': analysis['complexity_metrics']
            },
            'difficulty_counts': {
                difficulty: len(words) for difficulty, words in analysis['difficulty_analysis'].items()
            },
            'category_counts': {
                category: len(words) for category, words in analysis['category_analysis'].items()
            },
            'recommendations': generate_difficulty_recommendations(analysis)
        }
        
        with open('vocabulary_analysis_report.json', 'w', encoding='utf-8') as f:
            json.dump(analysis_output, f, indent=2, ensure_ascii=False)
        
        print(f"\n💾 Detailed analysis saved to: vocabulary_analysis_report.json")
        
    except FileNotFoundError:
        print(f"Error: Could not find input file '{input_file}'")
        print("Please run vocab_categorizer.py first to generate the categorized vocabulary.")
    except json.JSONDecodeError:
        print(f"Error: Invalid JSON format in '{input_file}'")
    except Exception as e:
        print(f"Error: {str(e)}")

if __name__ == "__main__":
    main()
