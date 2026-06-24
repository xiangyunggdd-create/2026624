from flask import Flask, render_template, jsonify
import threading
import time
import requests
import database
import arduino_handler  # Changed from mock_arduino

app = Flask(__name__)

import os
BASE_URL = os.environ.get("BASE_URL", "http://127.0.0.1:5000")

# Config
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1448667702976712724/OeTzK9cgazW43BCmGKGTV6LQkCnJdnfLSfP0xjqo0uOYnb85sJTfGnkrBBxu4pe1VJiW"
CHECK_INTERVAL = 10  # Check sensors every 10 seconds for notifications

# Global state for alert throttling
last_alert_time = 0
ALERT_COOLDOWN = 60  # Minimum 60 seconds between alerts

def send_discord_alert(message, target_url=None, title="植物警報"):
    if target_url is None:
        target_url = f"{BASE_URL}/"
    try:
        data = {
            "content": f"🚨 **{title}**: {message}\n👉 [點擊進入情境模擬]({target_url})"
        }
        requests.post(DISCORD_WEBHOOK_URL, json=data)
        print("Discord notification sent.")
    except Exception as e:
        print(f"Failed to send Discord notification: {e}")

def monitor_plant_health():
    global last_alert_time
    print("Health Monitor Started...")
    while True:
        data = database.get_latest_data()
        if data:
            current_time = time.time()
            if current_time - last_alert_time > ALERT_COOLDOWN:
                # Logic for alerts
                hum = data['humidity']
                light = data['light']
                alert_msg = ""
                alert_url = f"{BASE_URL}/simulation"
                alert_title = "植物警報"

                if hum < 30:
                    alert_title = "缺水警報"
                    alert_msg = f"土壤太乾了！目前濕度僅 {hum:.1f}%，請澆水！"
                    alert_url = f"{BASE_URL}/simulation?scenario=hydration"
                elif hum > 90:
                    alert_title = "水分過多警報"
                    alert_msg = f"土壤太濕了！目前濕度 {hum:.1f}%，請注意排水！"
                    alert_url = f"{BASE_URL}/simulation?scenario=hydration"
                elif light < 100:
                    alert_title = "光線不足警報"
                    alert_msg = f"光線不足！目前亮度僅 {light:.1f} lux，請移到亮處！"
                    alert_url = f"{BASE_URL}/simulation?scenario=lowlight"

                if alert_msg:
                    send_discord_alert(alert_msg, alert_url, alert_title)
                    last_alert_time = current_time
        
        time.sleep(CHECK_INTERVAL)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/simulation')
def simulation():
    return render_template('simulation.html')

@app.route('/intro')
def intro():
    return render_template('intro.html')

@app.route('/api/current')
def api_current():
    data = database.get_latest_data()
    return jsonify(data if data else {})

@app.route('/api/history')
def api_history():
    data = database.get_history_data(limit=20) # Get last 20 records for charts
    return jsonify(data)

from flask import request

@app.route('/api/test_alert')
def test_alert():
    alert_type = request.args.get('type', 'test')
    title = "植物警報"
    
    if alert_type == 'water_low':
        title = "缺水警報"
        msg = "測試：土壤太乾了！目前濕度僅 20.0%，請澆水！"
        url = f"{BASE_URL}/simulation?scenario=hydration"
    elif alert_type == 'light_low':
        title = "光線不足警報"
        msg = "測試：光線不足！目前亮度僅 50.0 lux，請移到亮處！"
        url = f"{BASE_URL}/simulation?scenario=lowlight"
    elif alert_type == 'water_high':
        title = "水分過多警報"
        msg = "測試：土壤過濕！目前濕度 95%！植物根部需要呼吸！"
        url = f"{BASE_URL}/simulation?scenario=hydration"
    else:
        title = "系統測試"
        msg = "這是一則測試訊息！點擊連結應進入「早上起床」情境。"
        url = f"{BASE_URL}/simulation?scenario=morning"

    send_discord_alert(msg, url, title)
    return jsonify({"status": "success", "message": f"Sent {alert_type} alert"})

def start_background_tasks():
    # Initialize DB
    database.init_db()

    # Start Arduino Handler
    if not arduino_handler.arduino.running:
        arduino_handler.arduino.start()

    # Start Health Monitor
    monitor_thread = threading.Thread(target=monitor_plant_health)
    monitor_thread.daemon = True
    monitor_thread.start()

if __name__ == '__main__':
    start_background_tasks()
    # host='0.0.0.0' allows other devices on the same network to access the server
    app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
