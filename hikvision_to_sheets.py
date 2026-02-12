import requests
import xml.etree.ElementTree as ET
from requests.auth import HTTPDigestAuth
import time
import datetime
import os
import sys

# --- Configuration ---
# 1. Hikvision Device Settings
DEVICE_IP = '192.168.1.17'
DEVICE_PORT = '80'
DEVICE_USER = 'admin'
DEVICE_PASS = 'Myvidyon!2026'

# 2. Google Apps Script Web App URL
# PASTE YOUR DEPLOYED WEB APP URL HERE
APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxnXwjE-ollwBngGrbChB421R2BPIik6k7mlzeeyy6h42PTMaVkx6ZmR4S_e-1HUlaBug/exec'

def send_to_google_sheets(name, employee_no):
    """Sends attendance data to the Google Apps Script Web App."""
    if APPS_SCRIPT_URL == 'https://script.google.com/macros/s/AKfycbxnXwjE-ollwBngGrbChB421R2BPIik6k7mlzeeyy6h42PTMaVkx6ZmR4S_e-1HUlaBug/exec':
        print("Warning: APPS_SCRIPT_URL not set. Please deploy your Google Apps Script and paste the URL.")
        return False

    payload = {
        "timestamp": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "name": name,
        "employee_no": employee_no,
        "status": "Present"
    }

    try:
        # Use allow_redirects=True because Google Apps Script Web Apps always redirect
        response = requests.post(APPS_SCRIPT_URL, json=payload, timeout=10)
        if response.status_code == 200:
            print(f" -> Successfully logged to Google Sheets: {name}")
            return True
        else:
            print(f" -> Failed to log. Status: {response.status_code}, Response: {response.text}")
            return False
    except Exception as e:
        print(f" -> Error sending to Google Sheets: {e}")
        return False

def find_element_text(root, tag_name):
    """Helper to find an element's text by tag name, ignoring namespaces."""
    for elem in root.iter():
        if elem.tag.endswith('}' + tag_name) or elem.tag == tag_name:
            return elem.text
    return None

def process_event(xml_content):
    """Parses the XML event and sends to Google Sheets if it's a face match."""
    try:
        root = ET.fromstring(xml_content)
        event_type = find_element_text(root, 'eventType')
        
        if event_type == 'AccessControlEvent':
             minor_event_type = find_element_text(root, 'minorEventType')
             
             # minorEventType 75 is typically "Face verification passed"
             if minor_event_type == '75': 
                 name = find_element_text(root, 'name') or "Unknown"
                 employee_no = find_element_text(root, 'employeeNoString') or find_element_text(root, 'activeHostId') or "N/A"
                 
                 print(f"Face Recognized: {name} (ID: {employee_no})")
                 send_to_google_sheets(name, employee_no)

    except ET.ParseError:
        pass # Ignore partial or malformed XML during stream

def listen_to_hikvision():
    """Listens to Hikvision alert stream and redirects faces to Google Sheets."""
    url = f'http://{DEVICE_IP}:{DEVICE_PORT}/ISAPI/Event/notification/alertStream'
    print(f"Connecting to Hikvision device at {url}...")
    
    auth = HTTPDigestAuth(DEVICE_USER, DEVICE_PASS)

    try:
        # stream=True is crucial for the continuous event stream
        response = requests.get(url, auth=auth, stream=True, timeout=60)

        if response.status_code != 200:
            print(f"Failed to connect. Status: {response.status_code}.")
            if response.status_code == 401:
                print(" -> Authentication Failed. Check DEVICE_USER and DEVICE_PASS.")
            elif response.status_code == 404:
                print(" -> URL not found. The device might not support ISAPI or the path is wrong.")
                print(" -> Check if 'CGI' or 'ISAPI' is enabled in the device settings (Network -> Advanced Settings -> Integration Protocol).")
            else:
                print(f" -> Response: {response.text}")
            return


        print("Connected! Waiting for face recognition events...")
        print("Tip: Keep this window open to record attendance lively.")

        xml_buffer = ""
        for chunk in response.iter_content(chunk_size=2048):
            if chunk:
                chunk_str = chunk.decode('utf-8', errors='ignore')
                print(f"DEBUG: Received chunk of size {len(chunk)}. Content start: {chunk_str[:100]}") # DEBUG LINE
                xml_buffer += chunk_str
                
                while '</EventNotificationAlert>' in xml_buffer:
                    start_tag = '<EventNotificationAlert'
                    end_tag = '</EventNotificationAlert>'
                    
                    start_index = xml_buffer.find(start_tag)
                    end_index = xml_buffer.find(end_tag)
                    
                    if start_index != -1 and end_index != -1:
                        full_event_xml = xml_buffer[start_index:end_index + len(end_tag)]
                        process_event(full_event_xml)
                        xml_buffer = xml_buffer[end_index + len(end_tag):]
                    else:
                        break

    except requests.exceptions.Timeout:
        print("Connection timed out on Port 8000. Trying Port 80...")
        try:
             url_80 = f'http://{DEVICE_IP}:80/ISAPI/Event/notification/alertStream'
             print(f"Connecting to {url_80}...")
             requests.get(url_80, auth=auth, stream=True, timeout=5)
             print(" -> Port 80 works! Please update DEVICE_PORT to '80' in the script.")
        except:
             print(" -> Port 80 also failed.")
        print("Reconnecting...")
    except requests.exceptions.ConnectionError:
        print("Device unreachable on Port 8000. Trying Port 80...")
        try:
             url_80 = f'http://{DEVICE_IP}:80/ISAPI/Event/notification/alertStream'
             print(f"Connecting to {url_80}...")
             requests.get(url_80, auth=auth, stream=True, timeout=5)
             print(" -> Port 80 works! Please update DEVICE_PORT to '80' in the script.")
        except:
             print(" -> Port 80 also reachable (or auth failed there too).")
        print("Check connection.")
    except KeyboardInterrupt:
        print("\nStopping...")
        sys.exit(0)
    except Exception as e:
        print(f"Unexpected error: {e}")

if __name__ == "__main__":
    print("--- Hikvision to Google Sheets Redirector ---")
    if APPS_SCRIPT_URL == 'PASTE_YOUR_APPS_SCRIPT_URL_HERE':
        print("\n!!! ACTION REQUIRED !!!")
        print("Please paste your Google Apps Script Web App URL into this script file.")
        print("-------------------------------------------\n")
    
    while True:
        try:
            listen_to_hikvision()
            time.sleep(5)
        except KeyboardInterrupt:
            break
