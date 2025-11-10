# backend/scapy_simulator.py
# Requires: pip install scapy firebase-admin
# Run as root (or give python capability: setcap cap_net_raw+ep $(which python3))

import os
import time
import random
import socket
from datetime import datetime
from scapy.all import IP, ICMP, UDP, TCP, sr1, send, sniff, conf
import firebase_admin
from firebase_admin import credentials, db
from dotenv import load_dotenv

load_dotenv()

# ---------------------------
# Firebase init (Admin SDK)
# ---------------------------
# Create a Firebase service account and download JSON key.
# Set env FIREBASE_CRED to path, or hardcode path (not recommended).
# Initialize Firebase Admin SDK
cred = credentials.Certificate(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

# RTDB refs (match frontend names)
active_traffic_ref = db.reference('active_traffic')
alerts_ref = db.reference('alerts')
network_usage_ref = db.reference('network_usage')
user_latencies_ref = db.reference('user_latencies')

# ---------------------------
# Scapy / probing helpers
# ---------------------------

def icmp_rtt(dst, timeout=1):
    """Send ICMP echo and measure RTT in ms. Returns rtt or None."""
    pkt = IP(dst=dst)/ICMP()
    start = time.time()
    ans = sr1(pkt, timeout=timeout, verbose=False)
    if ans is None:
        return None
    return (time.time() - start) * 1000.0

def udp_probe(dst, dport=5060, timeout=1):
    """Send UDP packet; returns True if any reply captured (not guaranteed)."""
    pkt = IP(dst=dst)/UDP(dport=dport)/("probe")
    send(pkt, verbose=False)
    # optionally sniff for a short time for a response (not always present)
    # We'll use a 0.2s sniff window
    def _filter(x):
        return x.haslayer(IP) and x[IP].src == dst
    pkts = sniff(filter=f"host {dst}", timeout=0.2, count=1)
    return len(pkts) > 0

def tcp_syn_synack(dst, dport=80, timeout=1):
    """Send SYN and check for SYN-ACK (rudimentary)."""
    sport = random.randint(20000, 40000)
    syn = IP(dst=dst)/TCP(sport=sport, dport=dport, flags='S', seq=random.randint(1,10000))
    ans = sr1(syn, timeout=timeout, verbose=False)
    if ans and ans.haslayer(TCP) and (ans[TCP].flags & 0x12):  # SYN-ACK
        return True
    return False

# ---------------------------
# High-level synth function
# ---------------------------
def generate_and_push_point(target_ips):
    now = datetime.utcnow()
    ts = int(now.timestamp() * 1000)

    # choose a random target to probe (you can probe multiple)
    dst = random.choice(target_ips)

    # Simple measurements
    rtt = icmp_rtt(dst, timeout=1)           # ms or None
    udp_ok = udp_probe(dst, dport=5060)      # boolean
    tcp_ok = tcp_syn_synack(dst, dport=80)   # boolean

    # synth fields similar to frontend newTrafficPoint
    inbound = random.randint(20, 200) if rtt is not None else random.randint(10, 80)
    outbound = random.randint(10, 150)
    has_spike = random.random() < 0.05
    threats = random.randint(0, 5) + (5 if has_spike else 0)

    newTrafficPoint = {
        'time': now.strftime("%H:%M:%S"),
        'timestamp': ts,
        'inbound': inbound,
        'outbound': outbound,
        'threats': threats,
        'dns_blocked': random.randint(0,5),
        'cpu_usage': random.randint(10, 80),
        'memory_usage': random.randint(20, 70),
        'network_latency': round(rtt if rtt is not None else random.uniform(10, 100), 2),
        'packet_loss': round(random.uniform(0.0, 3.0), 2),
        'bandwidth_usage': random.randint(20, 400),
    }

    # Push to Firebase
    try:
        active_traffic_ref.push(newTrafficPoint)
        # also update a lightweight network usage object
        network_usage_ref.push({
            'time': newTrafficPoint['time'],
            'timestamp': ts,
            'totalUsage': newTrafficPoint['bandwidth_usage'],
            'activeUsers': random.randint(1, 200),
            'uploadSpeed': round(random.uniform(5, 100), 2),
            'downloadSpeed': round(random.uniform(20, 300), 2),
            'packetsPerSecond': random.randint(100, 5000),
            'bytesTransferred': random.randint(1024, 10_485_760),
        })
        # optionally set a per-user-latency snapshot (example)
        uid = f"user_{random.randint(1,100)}"
        user_lat = {
            'userId': uid,
            'username': uid,
            'role': 'User',
            'latency': newTrafficPoint['network_latency'],
            'status': 'Excellent' if newTrafficPoint['network_latency']<80 else 'Poor',
            'quality': 'low' if newTrafficPoint['network_latency']<80 else 'high',
            'jitter': random.randint(1,10),
            'packetLoss': newTrafficPoint['packet_loss'],
            'timestamp': ts,
            'location': dst,
        }
        user_latencies_ref.child(uid).set(user_lat)

        # Occasionally push a synthetic alert
        if random.random() < 0.1:
            alert = {
                'type': 'Simulated Alert',
                'message': 'Automated simulated suspicious activity detected',
                'time': newTrafficPoint['time'],
                'severity': 'medium',
                'timestamp': ts,
                'source_ip': dst,
            }
            alerts_ref.push(alert)

        print(f"[{newTrafficPoint['time']}] pushed traffic point for {dst}")
    except Exception as e:
        print("Firebase write error:", e)

# ---------------------------
# Main loop
# ---------------------------

if __name__ == "__main__":
    # List of IPs your simulator will probe / represent (use lab IPs or localhost)
    TARGET_IPS = os.environ.get("SIM_TARGETS", "127.0.0.1").split(",")
    INTERVAL = float(os.environ.get("SIM_INTERVAL", "5"))  # seconds

    print("Scapy simulator starting. Targets:", TARGET_IPS)
    # make sure scapy uses correct iface if needed: conf.iface = "eth0"

    try:
        while True:
            generate_and_push_point(TARGET_IPS)
            time.sleep(INTERVAL)
    except KeyboardInterrupt:
        print("Stopping simulator.")
