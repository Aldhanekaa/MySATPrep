import json

def merge_vocabularies(dataset_path, categorized_path, output_path):
    # Load the dataset
    with open(dataset_path, 'r') as f:
        dataset_data = json.load(f)
    
    # The dataset has meta, summary, words
    dataset_words = dataset_data['words']
    
    # Create a dict for quick lookup by word
    dataset_dict = {word['word']: word for word in dataset_words}
    
    # Load the categorized data
    with open(categorized_path, 'r') as f:
        categorized_list = json.load(f)
    
    merged_words = []
    
    for item in categorized_list:
        word = item.get('word')
        if word and word in dataset_dict:
            # Merge: start with dataset entry
            merged = dataset_dict[word].copy()
            # Add or update from categorized
            merged['page'] = item.get('page')
            merged['categories'] = item.get('categories', [])
            # Update syllable_count and word_length if present
            if 'syllable_count' in item:
                merged['syllable_count'] = item['syllable_count']
            if 'word_length' in item:
                merged['word_length'] = item['word_length']
            merged_words.append(merged)
    
    # Create new structure similar to dataset
    new_data = {
        'meta': dataset_data['meta'],
        'summary': dataset_data['summary'],
        'words': merged_words
    }
    
    # Update summary if needed
    new_data['summary']['word_count'] = len(merged_words)
    
    # Write to output
    with open(output_path, 'w') as f:
        json.dump(new_data, f, indent=2)
    
    print(f"Merged {len(merged_words)} words into {output_path}")

if __name__ == "__main__":
    dataset_path = 'sat_vocabulary_dataset.json'
    categorized_path = 'sat_vocabulary_categorized.json'
    output_path = 'merged_sat_vocabulary.json'
    merge_vocabularies(dataset_path, categorized_path, output_path)
