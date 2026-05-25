import os
import json
import re

# This points to the folder where GitHub Actions will temporarily download your TGCA repo
archive_dir = "TGCA" 
index = []

# Walk through all directories looking for YYYY-MM-DD.md files
for root, dirs, files in os.walk(archive_dir):
    for file in files:
        if file.endswith('.md') and re.match(r'\d{4}-\d{2}-\d{2}\.md', file):
            date = file[:10]
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Split the markdown by subheadings (e.g., ## Section)
            sections = re.split(r'\n(## .+?)\n', content)
            
            if len(sections) > 1:
                for i in range(1, len(sections), 2):
                    header = sections[i].strip()
                    # Assign the paragraph following the header
                    text = sections[i+1].strip() if i+1 < len(sections) else ""
                    
                    if text: # Only add if there is content
                        index.append({
                            "date": date,
                            "section": header,
                            "content": text
                        })
            else:
                # Fallback if no subheaders exist
                index.append({
                    "date": date,
                    "section": "Daily Briefing",
                    "content": content.strip()
                })

# Sort chronologically, newest first
index.sort(key=lambda x: x['date'], reverse=True)

with open('index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f)

print(f"Index built successfully. Total sections indexed: {len(index)}")
