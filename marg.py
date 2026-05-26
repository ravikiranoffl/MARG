import urllib.request
import json
import csv
import os
import re
import time

# ==========================================
# ENGINE 1: TELEMETRY SYNC (Google Sheets)
# ==========================================
GAS_URL = os.getenv('GAS_WEB_APP_URL')
if GAS_URL:
    GAS_URL += "?action=pop"

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
    if not GAS_URL:
        print("No GAS_WEB_APP_URL found. Skipping telemetry.")
        return
    
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
# ENGINE 2: SECURE AI SUMMARIZER
# ==========================================
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')

def get_ai_summary(text_payload):
    if not GEMINI_API_KEY:
        print("WARNING: No GEMINI_API_KEY found in environment. Skipping AI generation.")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={GEMINI_API_KEY}"
    headers = {'Content-Type': 'application/json'}
    
    # We ask Gemini for 3 strict bullet points
    prompt = "You are an elite intelligence analyst. Summarize this daily briefing in exactly 3 highly professional, concise bullet points focusing on geopolitics, tech, and economics. Do not use asterisks, just output the clean text:\n\n" + text_payload[:6000] 
    
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3}
    }
    
    try:
        req = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers, method='POST')
        with urllib.request.urlopen(req) as response:
            result = json.loads(response.read().decode('utf-8'))
            return result['candidates'][0]['content']['parts'][0]['text'].strip()
    except Exception as e:
        print(f"AI Generation Failed: {e}")
        return None

# ==========================================
# ENGINE 3: ARCHIVE INDEXER (TGCA Markdown)
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
        if '2000' in dirs:
            dirs.remove('2000')

        for file in files:
            if file.endswith('.md') and re.match(r'\d{4}-\d{2}-\d{2}\.md', file):
                date = file[:10]
                json_path = os.path.join(data_dir, f"{date}.json")
                
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                
                title_match = re.search(r'#+ (.*)', content)
                title = title_match.group(1).strip() if title_match else f"Archive: {date}"
                
                content_parts = re.split(r'\n## ', content, maxsplit=1)
                core_text = "## " + content_parts[1] if len(content_parts) > 1 else content
                search_blob = re.sub(r'\s+', ' ', core_text).strip()
                
                metadata_index.append({
                    "id": date,
                    "title": title,
                    "date": date,
                    "search_blob": search_blob 
                })

                sections = re.split(r'\n(## .+?)\n', content)
                day_data = []
                
                # Check if this file already has an AI summary to avoid wasting API calls
                needs_summary = True
                if os.path.exists(json_path):
                    try:
                        with open(json_path, 'r', encoding='utf-8') as existing_f:
                            existing_data = json.load(existing_f)
                            if any(sec.get("section") == "AI_SUMMARY" for sec in existing_data):
                                needs_summary = False
                    except:
                        pass # If file is corrupted, we rebuild it
                
                # Generate AI Summary only if it's a new or missing file
                if needs_summary:
                    print(f"Generating AI Summary for {date}...")
                    ai_text = get_ai_summary(core_text)
                    if ai_text:
                        day_data.append({"section": "AI_SUMMARY", "content": ai_text})
                        time.sleep(4) # Protect against Gemini's 15 requests/min rate limit

                # Parse the raw sections
                if len(sections) > 1:
                    for i in range(1, len(sections), 2):
                        header = sections[i].strip()
                        text = sections[i+1].strip() if i+1 < len(sections) else ""
                        if text: day_data.append({"section": header, "content": text})
                else:
                    day_data.append({"section": "Daily Briefing", "content": content.strip()})

                # Save the final JSON with the summary baked in
                with open(json_path, 'w', encoding='utf-8') as df:
                    json.dump(day_data, df)

    metadata_index.sort(key=lambda x: x['date'], reverse=True)
    with open('index.json', 'w', encoding='utf-8') as f:
        json.dump(metadata_index, f)

    print(f"Index built successfully. Excluded 2000/. Generated lightweight index and heavy data files.")

# ==========================================
# MASTER EXECUTION
# ==========================================
if __name__ == "__main__":
    sync_telemetry()
    build_index()
