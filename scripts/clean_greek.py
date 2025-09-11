import json
import re

def remove_greek_letters(text):
    # Greek letters range: \u0370 to \u03FF and \u1F00 to \u1FFF for extended
    greek_pattern = re.compile(r'[\u0370-\u03FF\u1F00-\u1FFF]')
    return greek_pattern.sub('', text)

def clean_vocab_file(input_path, output_path):
    with open(input_path, 'r') as f:
        data = json.load(f)
    
    # Clean the words
    for word in data['words']:
        if 'definition' in word:
            word['definition'] = remove_greek_letters(word['definition'])
        if 'example' in word:
            word['example'] = remove_greek_letters(word['example'])
        # Add other fields if needed, like etymology
        if 'etymology' in word:
            word['etymology'] = remove_greek_letters(word['etymology'])
    
    # Also clean meta description if any
    if 'meta' in data and 'description' in data['meta']:
        data['meta']['description'] = remove_greek_letters(data['meta']['description'])
    
    with open(output_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"Cleaned Greek letters from {input_path} and saved to {output_path}")

if __name__ == "__main__":
    input_path = 'merged_sat_vocabulary.json'
    output_path = 'cleaned_sat_vocabulary.json'
    clean_vocab_file(input_path, output_path)
