import time
import random
import json
import threading
import serial
import serial.tools.list_ports
from database import insert_data

# Set this to False to try connecting to real Arduino
USE_MOCK_DATA = True 

class ArduinoHandler:
    def __init__(self):
        self.running = False
        self.ser = None
        self.latest_data = {"temperature": 0.0, "humidity": 0.0, "light": 0}

    def start(self):
        self.running = True
        thread = threading.Thread(target=self._loop)
        thread.daemon = True
        thread.start()

    def _loop(self):
        print(f"Arduino Handler Started. Mock Mode: {USE_MOCK_DATA}")
        
        # Try to connect if not mocking
        if not USE_MOCK_DATA:
            self._connect_serial()

        while self.running:
            if USE_MOCK_DATA or not self.ser:
                self._generate_mock_data()
                time.sleep(2)
            else:
                try:
                    if self.ser.in_waiting > 0:
                        line = self.ser.readline().decode('utf-8').strip()
                        if line.startswith('{'):
                            data = json.loads(line)
                            self.latest_data.update(data)
                            self._save_to_db()
                            # print(f"Real Data: {self.latest_data}")
                except Exception as e:
                    print(f"Serial Error: {e}")
                    self.ser.close()
                    self.ser = None
                    time.sleep(2) # Wait before retry

    def _connect_serial(self):
        try:
            # Auto-detect Arduino (Logic might need adjustment based on OS)
            ports = list(serial.tools.list_ports.comports())
            for p in ports:
                if "Arduino" in p.description or "CH340" in p.description or "USB" in p.description:
                    print(f"Found Device: {p.device}")
                    self.ser = serial.Serial(p.device, 9600, timeout=1)
                    time.sleep(2) # Wait for connection
                    print(f"Connected to {p.device}")
                    return
            print("No Arduino found. Switching to Mock Mode temporary.")
        except Exception as e:
            print(f"Connection Failed: {e}")

    def _generate_mock_data(self):
        # Simulate sensor data changes
        self.latest_data["temperature"] = round(25.0 + random.uniform(-2, 2), 1)
        self.latest_data["humidity"] = round(60.0 + random.uniform(-10, 10), 1)
        self.latest_data["light"] = int(500 + random.uniform(-100, 100))
        
        # Clamp
        self.latest_data["humidity"] = max(0, min(100, self.latest_data["humidity"]))
        
        self._save_to_db()

    def _save_to_db(self):
        insert_data(
            self.latest_data["temperature"],
            self.latest_data["humidity"],
            self.latest_data["light"]
        )

arduino = ArduinoHandler()
