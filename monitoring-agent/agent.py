import time
import socket
import psutil
import requests
import random
import os

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000")
SERVER_ID = socket.gethostname()
SERVICE_NAME = "monitoring-agent"

print(f"Starting Monitoring Agent for server: {SERVER_ID}")
print(f"Target backend: {BACKEND_URL}")

last_net_io = psutil.net_io_counters()
last_net_time = time.time()

def send_metric():
    global last_net_io, last_net_time
    try:
        cpu = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory().percent
        disk = psutil.disk_usage('/').percent
        
        curr_net_io = psutil.net_io_counters()
        curr_net_time = time.time()
        
        elapsed = curr_net_time - last_net_time
        if elapsed > 0:
            bytes_sent = curr_net_io.bytes_sent - last_net_io.bytes_sent
            bytes_recv = curr_net_io.bytes_recv - last_net_io.bytes_recv
            # Convert bytes to KB, divide by seconds to get KB/s
            network_kb_s = ((bytes_sent + bytes_recv) / 1024) / elapsed
        else:
            network_kb_s = 0.0
            
        last_net_io = curr_net_io
        last_net_time = curr_net_time
        
        network_usage = round(network_kb_s, 2)
        
        payload = {
            "serverId": SERVER_ID,
            "cpuUsage": cpu,
            "memoryUsage": mem,
            "diskUsage": disk,
            "networkUsage": network_usage
        }
        
        res = requests.post(f"{BACKEND_URL}/api/metrics", json=payload, timeout=5)
        if res.status_code == 201:
            print(f"[METRIC] Sent: CPU {cpu}%, MEM {mem}%, DISK {disk}%, NET {network_usage} KB/s")
        else:
            print(f"[METRIC] Failed to send metric. Status: {res.status_code}, {res.text}")
            
    except Exception as e:
        print(f"[METRIC] Error sending metric: {e}")

def send_log(severity, message):
    try:
        payload = {
            "serviceName": SERVICE_NAME,
            "severity": severity,
            "message": message,
            "serverId": SERVER_ID
        }
        res = requests.post(f"{BACKEND_URL}/api/logs", json=payload, timeout=5)
        if res.status_code == 201:
            print(f"[LOG] Sent {severity}: {message}")
        else:
            print(f"[LOG] Failed to send log. Status: {res.status_code}, {res.text}")
    except Exception as e:
        print(f"[LOG] Error sending log: {e}")


if __name__ == "__main__":
    send_log("INFO", f"Monitoring agent started on {SERVER_ID}")
    
    while True:
        send_metric()
        
        # Simulate occasional random logs for testing
        if random.random() < 0.1: # 10% chance each tick
            severities = ["INFO", "WARNING", "ERROR"]
            messages = [
                "Connection timeout to upstream service",
                "Cache miss rate increased",
                "Memory usage spiked temporarily",
                "Background sync job completed successfully",
                "Network latency detected on secondary interface"
            ]
            send_log(random.choice(severities), random.choice(messages))
            
        time.sleep(5)
