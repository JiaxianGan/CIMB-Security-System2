import os

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    FIREBASE_DATABASE_URL = os.getenv('https://cimb-monitoring-system.asia-southeast1.firebasedatabase.app/')
    DEBUG = os.getenv('FLASK_ENV') == 'development'