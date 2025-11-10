from flask import Flask, request, jsonify
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, db
from models.network_analyzer import NetworkAnalyzer
from utils.data_processor import DataProcessor
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize Firebase Admin SDK
cred = credentials.Certificate(os.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
firebase_admin.initialize_app(cred, {
    'databaseURL': os.getenv('FIREBASE_DATABASE_URL')
})

analyzer = NetworkAnalyzer()
processor = DataProcessor()

@app.route('/api/analyze/traffic-trend', methods=['POST'])
def analyze_traffic_trend():
    """
    Analyzes traffic trends and predicts future patterns
    """
    try:
        data = request.json
        traffic_data = data.get('trafficData', [])
        time_range = data.get('timeRange', '1h')  # 1h, 6h, 24h
        
        if not traffic_data:
            return jsonify({'error': 'No traffic data provided'}), 400
        
        # Process and analyze data
        processed_data = processor.process_traffic_data(traffic_data)
        analysis = analyzer.analyze_trend(processed_data, time_range)
        
        return jsonify({
            'success': True,
            'analysis': analysis,
            'timestamp': processor.get_current_timestamp()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/anomaly-detection', methods=['POST'])
def detect_anomalies():
    """
    Detects anomalies in network traffic using ML
    """
    try:
        data = request.json
        traffic_data = data.get('trafficData', [])
        sensitivity = data.get('sensitivity', 'medium')  # low, medium, high
        
        if not traffic_data:
            return jsonify({'error': 'No traffic data provided'}), 400
        
        # Detect anomalies
        processed_data = processor.process_traffic_data(traffic_data)
        anomalies = analyzer.detect_anomalies(processed_data, sensitivity)
        
        return jsonify({
            'success': True,
            'anomalies': anomalies,
            'anomaly_count': len(anomalies),
            'timestamp': processor.get_current_timestamp()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/threat-assessment', methods=['POST'])
def assess_threats():
    """
    Assesses overall threat level based on alerts and traffic
    """
    try:
        data = request.json
        alerts = data.get('alerts', [])
        traffic_data = data.get('trafficData', [])
        blocked_attempts = data.get('blockedAttempts', [])
        
        # Perform threat assessment
        assessment = analyzer.assess_threat_level(
            alerts, traffic_data, blocked_attempts
        )
        
        return jsonify({
            'success': True,
            'assessment': assessment,
            'timestamp': processor.get_current_timestamp()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/recommendations', methods=['POST'])
def get_recommendations():
    """
    Provides AI-generated security recommendations
    """
    try:
        data = request.json
        system_stats = data.get('systemStats', {})
        alerts = data.get('alerts', [])
        traffic_patterns = data.get('trafficData', [])
        
        # Generate recommendations
        recommendations = analyzer.generate_recommendations(
            system_stats, alerts, traffic_patterns
        )
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'priority_actions': recommendations['priority'],
            'timestamp': processor.get_current_timestamp()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/analyze/predict-attack', methods=['POST'])
def predict_attack():
    """
    Predicts potential attack patterns based on historical data
    """
    try:
        data = request.json
        historical_data = data.get('historicalData', [])
        current_patterns = data.get('currentPatterns', [])
        
        # Predict attack likelihood
        prediction = analyzer.predict_attack_likelihood(
            historical_data, current_patterns
        )
        
        return jsonify({
            'success': True,
            'prediction': prediction,
            'timestamp': processor.get_current_timestamp()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'AI Network Analysis Agent',
        'version': '1.0.0'
    })

@app.route('/')
def home():
    return "✅ Flask is running successfully!"

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)