import time
import random
import json
import threading
from database import insert_data

# Mock mode: True if no real Arduino is connected
MOCK_MODE = True

class ArduinoHandler:
    def __init__(self):
        self.running = False
        self.latest_data = {"temperature": 25.0, "humidity": 60.0, "light": 500}

    def start(self):
        self.running = True
        thread = threading.Thread(target=self._loop)
        thread.daemon = True
        thread.start()

    def _loop(self):
        print("Arduino Handler Started (Mock Mode)")
        while self.running:
            # Simulate sensor data changes
            self.latest_data["temperature"] += random.uniform(-0.5, 0.5)
            self.latest_data["humidity"] += random.uniform(-1, 1)
            self.latest_data["light"] += random.uniform(-20, 20)

            # Clamp values
            self.latest_data["temperature"] = max(10, min(40, self.latest_data["temperature"]))
            self.latest_data["humidity"] = max(0, min(100, self.latest_data["humidity"]))
            self.latest_data["light"] = max(0, min(1000, self.latest_data["light"]))

            # Save to DB
            insert_data(
                self.latest_data["temperature"],
                self.latest_data["humidity"],
                self.latest_data["light"]
            )

            # Print for debug
            # print(f"Read: {self.latest_data}")

            time.sleep(2) # Read every 2 seconds

arduino = ArduinoHandler()
