"""
NIVA Autonomous Zero-Click WhatsApp Dispatcher
Executes true hands-free automated dispatch on Windows.
User does NOT need to press Enter or click Send.
"""

import sys
import time
import urllib.parse
import subprocess
import os

try:
    import pyautogui
    import pyperclip
except ImportError:
    pyautogui = None
    pyperclip = None

def dispatch_whatsapp(recipient: str, message: str):
    print(f"[NIVA WA-Dispatcher] Initiating auto-send to: '{recipient}' | Message: '{message}'")

    # Clean digits
    clean_digits = ''.join(c for c in recipient if c.isdigit())
    has_phone = len(clean_digits) >= 10

    if has_phone:
        # Standardize Indian phone number if 10 digits
        if len(clean_digits) == 10:
            phone_num = '91' + clean_digits
        else:
            phone_num = clean_digits

        encoded_msg = urllib.parse.quote(message)

        # 1. Open WhatsApp desktop protocol or web
        try:
            cmd = f"Start-Process 'whatsapp://send?phone={phone_num}&text={encoded_msg}'"
            subprocess.run(["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", cmd], check=True)
        except Exception:
            cmd = f"Start-Process 'https://web.whatsapp.com/send?phone={phone_num}&text={encoded_msg}'"
            subprocess.run(["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", cmd])

        if pyautogui:
            # Wait for WhatsApp to open and load the chat with pre-filled text
            time.sleep(2.8)
            # Ensure window is in focus and press ENTER automatically
            pyautogui.press('enter')
            time.sleep(0.5)
            # Second press as fallback in case dialog prompt was focused
            pyautogui.press('enter')
            print("[NIVA WA-Dispatcher] ✅ Enter key automatically pressed! Message dispatched.")
    else:
        # Case B: Recipient is a contact name (e.g., 'Nishant', 'Rahul')
        # We bring WhatsApp to focus, search for the contact, select it, paste message, and hit ENTER!
        print(f"[NIVA WA-Dispatcher] Searching WhatsApp Desktop for contact: '{recipient}'")

        # Launch / Bring WhatsApp to foreground
        subprocess.run(["powershell", "-NoProfile", "-WindowStyle", "Hidden", "-Command", "Start-Process 'whatsapp:'"])
        time.sleep(1.8)

        if pyautogui:
            # 1. Shortcut to search chats in WhatsApp Desktop (Ctrl + F or Ctrl + E)
            pyautogui.hotkey('ctrl', 'f')
            time.sleep(0.5)

            # 2. Type recipient contact name
            if pyperclip:
                pyperclip.copy(recipient)
                pyautogui.hotkey('ctrl', 'v')
            else:
                pyautogui.write(recipient, interval=0.03)

            # Wait for WhatsApp search results to appear
            time.sleep(1.2)

            # 3. Hit Down arrow and Enter to open the top contact match
            pyautogui.press('down')
            time.sleep(0.3)
            pyautogui.press('enter')
            time.sleep(0.8)

            # 4. Paste message into the chat input
            if pyperclip:
                pyperclip.copy(message)
                pyautogui.hotkey('ctrl', 'v')
            else:
                pyautogui.write(message, interval=0.02)

            time.sleep(0.4)

            # 5. Press ENTER to send!
            pyautogui.press('enter')
            print(f"[NIVA WA-Dispatcher] ✅ Message auto-typed and sent to contact '{recipient}'!")

if __name__ == '__main__':
    if len(sys.argv) < 3:
        print("Usage: python wa_auto_dispatcher.py <recipient> <message>")
        sys.exit(1)

    recip = sys.argv[1]
    msg = sys.argv[2]
    dispatch_whatsapp(recip, msg)
