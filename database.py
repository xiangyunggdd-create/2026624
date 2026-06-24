import sqlite3
import datetime
import random

DB_NAME = 'plantmate.db'

def init_db():
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Create table for sensor data
    c.execute('''CREATE TABLE IF NOT EXISTS sensor_data (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    temperature REAL,
                    humidity REAL,
                    light REAL
                )''')
    conn.commit()
    conn.close()

def insert_data(temp, hum, light):
    conn = sqlite3.connect(DB_NAME)
    c = conn.cursor()
    # Explicitly use local system time to ensure chart shows correct time
    now_str = datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    c.execute("INSERT INTO sensor_data (timestamp, temperature, humidity, light) VALUES (?, ?, ?, ?)",
              (now_str, temp, hum, light))
    conn.commit()
    conn.close()

def get_latest_data():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM sensor_data ORDER BY id DESC LIMIT 1")
    row = c.fetchone()
    conn.close()
    if row:
        return dict(row)
    return None

def get_history_data(limit=50):
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    c.execute("SELECT * FROM sensor_data ORDER BY id DESC LIMIT ?", (limit,))
    rows = c.fetchall()
    conn.close()
    return [dict(row) for row in rows][::-1] # Reverse to get chronological order (oldest to newest)
