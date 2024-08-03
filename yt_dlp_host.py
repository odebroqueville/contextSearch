#!/usr/bin/env python3

import os
import sys
import json
import subprocess


def get_message():
    raw_length = sys.stdin.read(4)
    if len(raw_length) == 0:
        sys.exit(0)
    message_length = int.from_bytes(raw_length.encode('utf-8'), 'little')
    print(f"Message length: {message_length}")  # Debugging print
    message = sys.stdin.read(message_length)
    print(f"Raw message: {message}")  # Debugging print
    return json.loads(message)

def send_message(message):
    encoded_message = json.dumps(message).encode('utf-8')
    length_bytes = len(encoded_message).to_bytes(4, byteorder='little')
    print(f"Sending length bytes: {length_bytes}")  # Debugging print
    print(f"Sending message bytes: {encoded_message}")  # Debugging print
    sys.stdout.buffer.write(length_bytes)
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

# Example usage
# response = {'status': 'success', 'message': 'Video downloaded successfully'}
# send_message(response)

while True:

    received_message = get_message()

    url = received_message['url']
    send_message(f"URL: {url}")

    if url:
        try:
            # Use yt-dlp to download the video using h.264 or h.265 video codec in 720p at least with the highest quality audio and video, and save it to the '~/Movies/Video Downloads' directory
            result = subprocess.run(['/usr/local/bin/yt-dlp', '--ffmpeg-location', '/usr/local/bin/ffmpeg', '-f', "(bv*[vcodec~='^((he|a)vc|h26[45])'][height>=720]+ba[ext=m4a]) / (bv*+ba/b)", '-P', '~/Movies/Video Downloads', url], capture_output=True, 
            text=True, 
            check=True)
            
            send_message({'output': result.stdout, 'error': result.stderr})
        except subprocess.CalledProcessError as e:
            send_message({'error': f"yt-dlp command failed: {e.stderr}"})
        except FileNotFoundError:
            send_message({'error': "yt-dlp command not found. Please ensure it's installed and in your PATH."})
        except Exception as e:
            send_message({'error': f"An unexpected error occurred: {str(e)}"})
    else:
        send_message({'error': 'No URL provided'})
