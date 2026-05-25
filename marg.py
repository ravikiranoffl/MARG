import urllib.request
import json
import csv
import os

# Fetches the secure URL from GitHub Secrets
GAS_URL = os.getenv('GAS_WEB_APP_URL') + "?action=pop"

def append_to_csv(filename, data):
    if not data:
        return
        
    # Check if file exists to determine if we need to write headers
    file_exists = os.path.isfile(filename)
    
    with open(filename, 'a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        
        # Write headers if it's a brand new file
        if not file_exists:
            if "login" in filename:
                writer.writerow(["Datetime_IST", "Agent_Hash", "Name"])
            else:
                writer.writerow(["Datetime_IST", "Agent_Hash", "Name", "Query"])
                
        # Append the new rows
        for row in data:
            writer.writerow(row)
            
    print(f"Appended {len(data)} records to {filename}")

def sync_telemetry():
    print("Requesting telemetry data from Google Vault...")
    req = urllib.request.Request(GAS_URL)
    
    try:
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            # The Google Apps Script returns a dictionary with 'searches' and 'logins' arrays
            searches = data.get('searches', [])
            logins = data.get('logins', [])

            if searches:
                append_to_csv('history.csv', searches)
            else:
                print("No new searches to sync.")

            if logins:
                append_to_csv('login_history.csv', logins)
            else:
                print("No new logins to sync.")
                
    except Exception as e:
        print(f"Failed to fetch telemetry data: {e}")

if __name__ == "__main__":
    sync_telemetry()
