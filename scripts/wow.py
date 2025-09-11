#!/usr/bin/env python3
"""
Random Key Press Script for Mac
Repeatedly presses a random key at regular intervals.
Press Ctrl+C to stop the script.
"""

import time
import sys
import random
from pynput import keyboard
from pynput.keyboard import Key, Listener
import threading

class RandomKeyPresser:
    def __init__(self):
        self.controller = keyboard.Controller()
        self.running = False
        self.stop_event = threading.Event()
        
    def press_random_key(self, key_list, interval=1.0):
        """
        Press a random key from the list repeatedly at specified interval
        
        Args:
            key_list: List of keys to choose from (strings or Key objects)
            interval: Time between key presses in seconds
        """
        print(f"Starting to press random keys every {interval} seconds...")
        print("Press Ctrl+C to stop")
        
        self.running = True
        
        try:
            while self.running and not self.stop_event.is_set():
                # Select random key
                key = random.choice(key_list)
                # Press and release the key
                self.controller.press(key)
                self.controller.release(key)
                print(f"Pressed '{key}'")
                
                # Wait for the specified interval
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\nStopping key presser...")
            self.running = False
    
    def stop(self):
        """Stop the key pressing"""
        self.running = False
        self.stop_event.set()

def main():
    presser = RandomKeyPresser()
    
    # Configuration - Change these values as needed
    INTERVAL = 2.0        # Time between presses in seconds
    KEY_TYPE = 'all'      # Options: 'all', 'letters', 'numbers', 'special', 'arrows'
    
    print("Random Key Presser for Mac")
    print("=" * 35)
    print(f"Key type: {KEY_TYPE}")
    print(f"Interval: {INTERVAL} seconds")
    print()
    
    # Key type options:
    # 'all' - letters and numbers
    # 'letters' - only a-z
    # 'numbers' - only 0-9
    # 'special' - space, tab, enter
    # 'arrows' - arrow keys
    
    # Define key lists
    letters = list('abcdefghijklmnopqrstuvwxyz')
    numbers = list('0123456789')
    special = [Key.space, Key.tab, Key.enter]
    arrows = [Key.left, Key.right, Key.up, Key.down]
    
    if KEY_TYPE == 'all':
        key_list = letters + numbers
    elif KEY_TYPE == 'letters':
        key_list = letters
    elif KEY_TYPE == 'numbers':
        key_list = numbers
    elif KEY_TYPE == 'special':
        key_list = special
    elif KEY_TYPE == 'arrows':
        key_list = arrows
    else:
        print(f"Invalid KEY_TYPE: {KEY_TYPE}")
        return
    
    try:
        presser.press_random_key(key_list, INTERVAL)
    except KeyboardInterrupt:
        print("\nProgram terminated by user")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        presser.stop()

if __name__ == "__main__":
    # Check if pynput is installed
    try:
        import pynput
    except ImportError:
        print("Error: pynput library not found!")
        print("Install it using: pip install pynput")
        print("You may also need to grant accessibility permissions to Terminal/Python in System Preferences > Security & Privacy > Privacy > Accessibility")
        sys.exit(1)
    
    main()
#7