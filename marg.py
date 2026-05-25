import os
import json
import re

def build_index():
    print("Building Archive Index from TGCA...")
    archive_dir = "TGCA"
    metadata_index = []
    data_dir = "data" 

    if not os.path.exists(archive_dir):
        print(f"Error: Directory '{archive_dir}' not found. Skipping indexing.")
        return

    os.makedirs(data_dir, exist_ok=True)

    # Walk through the directories
    for root, dirs, files in os.walk(archive_dir):
        
        # EXCLUSION RULE: Dynamically ignore the '2000' folder if it exists
        if '2000' in dirs:
            dirs.remove('2000') # This stops Python from even looking inside it

        for file in files:
            if file.endswith('.md') and re.match(r'\d{4}-\d{2}-\d{2}\.md', file):
                date = file[:10]
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # 1. Grab the Title
                title_match = re.search(r'#+ (.*)', content)
                title = title_match.group(1).strip() if title_match else f"Archive: {date}"
                
                # 2. SMART EXTRACTION: Skip the boilerplate header
                # We split the document at the first "## " (which is usually Section 1)
                content_parts = re.split(r'\n## ', content, maxsplit=1)
                if len(content_parts) > 1:
                    core_text = "## " + content_parts[1] # This is just the actual news
                else:
                    core_text = content # Fallback if no subheaders exist
                
                # 3. Compress the text into a single line for the search engine
                search_blob = re.sub(r'\s+', ' ', core_text).strip()
                
                # Now index.json contains the FULL news text for Fuse.js to search!
                metadata_index.append({
                    "id": date,
                    "title": title,
                    "date": date,
                    "search_blob": search_blob 
                })

                # 4. Generate the structured Heavy Data for the UI "Deep Scan"
                sections = re.split(r'\n(## .+?)\n', content)
                day_data = []
                
                if len(sections) > 1:
                    for i in range(1, len(sections), 2):
                        header = sections[i].strip()
                        text = sections[i+1].strip() if i+1 < len(sections) else ""
                        if text: day_data.append({"section": header, "content": text})
                else:
                    day_data.append({"section": "Daily Briefing", "content": content.strip()})

                with open(os.path.join(data_dir, f"{date}.json"), 'w', encoding='utf-8') as df:
                    json.dump(day_data, df)

    # Sort chronologically (newest first)
    metadata_index.sort(key=lambda x: x['date'], reverse=True)
    
    # Save the powerful metadata file
    with open('index.json', 'w', encoding='utf-8') as f:
        json.dump(metadata_index, f)

    print(f"Index built successfully. Excluded 2000/. Generated lightweight index and {len(metadata_index)} heavy data files.")

if __name__ == "__main__":
    build_index()
