import urllib.request
import json
import csv
import os
import re

# ==========================================
# ENGINE 1: TELEMETRY SYNC (Google Sheets)
# ==========================================
GAS_URL = os.getenv('GAS_WEB_APP_URL') + "?action=pop"

def append_to_csv(filename, data):
    if not data: return
    file_exists = os.path.isfile(filename)
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        if not file_exists:
            if "login" in filename:
                writer.writerow(["Datetime_IST", "Agent_Hash", "Name"])
            else:
                writer.writerow(["Datetime_IST", "Agent_Hash", "Name", "Query"])
        for row in data:
            writer.writerow(row)
    print(f"Appended {len(data)} records to {filename}")

def sync_telemetry():
    print("Requesting telemetry data from Google Vault...")
    try:
        req = urllib.request.Request(GAS_URL)
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            searches = data.get('searches', [])
            logins = data.get('logins', [])

            if searches: append_to_csv('history.csv', searches)
            else: print("No new searches to sync.")

            if logins: append_to_csv('login.csv', logins)
            else: print("No new logins to sync.")
    except Exception as e:
        print(f"Failed to fetch telemetry data: {e}")

# ==========================================
# ENGINE 2: ARCHIVE INDEXER (TGCA Markdown)
# ==========================================
def build_index():
    print("Building Archive Index from TGCA...")
    archive_dir = "TGCA"
    metadata_index = []
    data_dir = "data" 

    if not os.path.exists(archive_dir):
        print(f"Error: Directory '{archive_dir}' not found. Skipping indexing.")
        return

    os.makedirs(data_dir, exist_ok=True)

    for root, dirs, files in os.walk(archive_dir):
        for file in files:
            if file.endswith('.md') and re.match(r'\d{4}-\d{2}-\d{2}\.md', file):
                date = file[:10]
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                
                title_match = re.search(r'#+ (.*)', content)
                title = title_match.group(1).strip() if title_match else f"Archive: {date}"
                
                metadata_index.append({
                    "id": date,
                    "title": title,
                    "date": date,
                    "search_blob": content[:500] 
                })

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

    metadata_index.sort(key=lambda x: x['date'], reverse=True)
    with open('index.json', 'w', encoding='utf-8') as f:
        json.dump(metadata_index, f)

    print(f"Index built successfully. Generated lightweight index and {len(metadata_index)} heavy data files.")

# ==========================================
# MASTER EXECUTION
# ==========================================
if __name__ == "__main__":
    sync_telemetry()
    build_index()
