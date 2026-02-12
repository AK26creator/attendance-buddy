import requests
import re
import time
import datetime
import sys
from requests.auth import HTTPDigestAuth
import threading

# --- Configuration ---
DEVICE_IP = '192.168.1.17'
DEVICE_PORT = '80'
DEVICE_USER = 'admin'
DEVICE_PASS = 'Myvidyon!2026'

# Google Apps Script Web App URL
APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnXwjE-ollwBngGrbChB421R2BPIik6k7mlzeeyy6h42PTMaVkx6ZmR4S_e-1HUlaBug/exec'

def send_to_google_sheets(name, employee_no):
    """Sends attendance data to the Google Apps Script Web App."""
    if APPS_SCRIPT_URL == 'PASTE_YOUR_APPS_SCRIPT_URL_HERE':
        print("Warning: APPS_SCRIPT_URL not set.")
        return False

    payload = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "name": name,
        "employee_no": employee_no,
        "status": "Present"
    }

    def _send():
        try:
            # Send in background thread to avoid lag
            requests.post(APPS_SCRIPT_URL, json=payload, timeout=10)
            print(f" -> Logged to Sheets: {name}")
        except Exception as e:
            print(f" -> Error logging to Sheets: {e}")

    threading.Thread(target=_send).start()

def parse_and_process(data_chunk):
    """Parses JSON data from the chunk text."""
    # Look for eventType and name using Regex for speed
    # Pattern: "eventType": 38
    # Pattern: "name": "Name"
    
    # Iterate over all JSON-like structures that seem to contain eventType
    # We use a broad search since chunks might cut off
    
    # Find all eventType occurrences
    event_iter = re.finditer(r'"eventType":\s*(\d+)', data_chunk)
    
    found_any = False
    for match in event_iter:
        found_any = True
        event_type = match.group(1)
        print(f"DEBUG: Found eventType {event_type}")
        
        # eventType 38 is "Face Match" / "Attendance"
        if event_type == '38':
            # Look for name in the vicinity (up to next eventType or reasonable length)
            start_pos = match.start()
            end_search = start_pos + 1000 # Limit search window
            snippet = data_chunk[start_pos:end_search]
            
            name_match = re.search(r'"name":\s*"([^"]+)"', snippet)
            if name_match:
                name = name_match.group(1)
                
                # Try to find ID
                id_match = re.search(r'"employeeNoString":\s*"([^"]+)"', snippet)
                employee_no = id_match.group(1) if id_match else "N/A"
                
                print(f"✅ FACE RECOGNIZED: {name} (ID: {employee_no})")
                send_to_google_sheets(name, employee_no)

def listen_to_hikvision():
    """Listens to Hikvision alert stream using requests."""
    url = f'http://{DEVICE_IP}:{DEVICE_PORT}/ISAPI/Event/notification/alertStream'
    print(f"Connecting to {url}...")
    
    auth = HTTPDigestAuth(DEVICE_USER, DEVICE_PASS)

    try:
        response = requests.get(url, auth=auth, stream=True, timeout=60)

        if response.status_code != 200:
            print(f"Failed to connect. Status: {response.status_code}")
            return

        print("Connected! Waiting for face recognition events...")
        print("Tip: Keep this window open.")
        
        buffer = ""
        boundary = "--MIME_boundary"

        for chunk in response.iter_content(chunk_size=1024):
            if chunk:
                print(f"DEBUG: Read {len(chunk)} bytes.")
                try:
                    text = chunk.decode('utf-8', errors='ignore')
                except:
                    continue
                
                buffer += text
                
                # Process buffer by splitting based on boundary
                if boundary in buffer:
                    print(f"DEBUG: Boundary found! Buffer length: {len(buffer)}")
                    parts = buffer.split(boundary)
                    
                    # The last part is incomplete, keep it in buffer
                    buffer = parts[-1] 
                    
                    # Process all complete parts
                    for part in parts[:-1]:
                        if len(part.strip()) > 0:
                            print(f"DEBUG: Processing part of size {len(part)}")
                            parse_and_process(part)
                            
                # Safety: If buffer grows too large without boundary, clear it (orphan data)
                if len(buffer) > 50000:
                   buffer = ""

    except requests.exceptions.Timeout:
        print("Connection timed out. Reconnecting...")
        time.sleep(2)
    except requests.exceptions.ConnectionError:
        print("Device unreachable. Reconnecting...")
        time.sleep(5)
    except KeyboardInterrupt:
        print("\nStopping...")
        sys.exit(0)
    except Exception as e:
        print(f"Error: {e}")
        time.sleep(5)

if __name__ == "__main__":
    while True:
        listen_to_hikvision()
        time.sleep(1)
