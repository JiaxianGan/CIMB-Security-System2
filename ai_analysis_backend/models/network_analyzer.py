import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler
from datetime import datetime, timedelta

class NetworkAnalyzer:
    def __init__(self):
        self.scaler = StandardScaler()
        self.anomaly_detector = IsolationForest(
            contamination=0.1,
            random_state=42
        )
        
    def analyze_trend(self, data, time_range):
        """
        Analyze traffic trends and provide insights
        """
        df = pd.DataFrame(data)
        
        # Calculate statistics
        inbound_avg = df['inbound'].mean()
        outbound_avg = df['outbound'].mean()
        threats_total = df['threats'].sum()
        
        # Detect trend direction
        recent_inbound = df['inbound'].tail(5).mean()
        older_inbound = df['inbound'].head(5).mean()
        trend = 'increasing' if recent_inbound > older_inbound else 'decreasing'
        
        # Calculate change percentage
        change_pct = ((recent_inbound - older_inbound) / older_inbound * 100) if older_inbound > 0 else 0
        
        return {
            'summary': f'Traffic is {trend} by {abs(change_pct):.2f}%',
            'average_inbound': round(inbound_avg, 2),
            'average_outbound': round(outbound_avg, 2),
            'total_threats': int(threats_total),
            'trend_direction': trend,
            'change_percentage': round(change_pct, 2),
            'peak_traffic_time': self._find_peak_time(df),
            'insights': self._generate_insights(df, trend, change_pct)
        }
    
    def detect_anomalies(self, data, sensitivity='medium'):
        """
        Detect anomalies using Isolation Forest
        """
        df = pd.DataFrame(data)
        
        # Select features for anomaly detection
        features = ['inbound', 'outbound', 'threats', 'cpu_usage', 'memory_usage']
        X = df[features].values
        
        # Adjust contamination based on sensitivity
        contamination_map = {'low': 0.05, 'medium': 0.1, 'high': 0.15}
        self.anomaly_detector.contamination = contamination_map.get(sensitivity, 0.1)
        
        # Fit and predict
        predictions = self.anomaly_detector.fit_predict(X)
        
        # Get anomalous records
        anomalies = []
        for idx, pred in enumerate(predictions):
            if pred == -1:  # Anomaly detected
                anomaly_data = df.iloc[idx].to_dict()
                anomaly_data['anomaly_score'] = self._calculate_anomaly_score(anomaly_data)
                anomaly_data['reason'] = self._determine_anomaly_reason(anomaly_data)
                anomalies.append(anomaly_data)
        
        return anomalies
    
    def assess_threat_level(self, alerts, traffic_data, blocked_attempts):
        """
        Assess overall threat level
        """
        # Calculate threat scores
        high_severity_alerts = len([a for a in alerts if a.get('severity') == 'high'])
        medium_severity_alerts = len([a for a in alerts if a.get('severity') == 'medium'])
        low_severity_alerts = len([a for a in alerts if a.get('severity') == 'low'])
        
        # Weighted threat score
        threat_score = (
            high_severity_alerts * 10 +
            medium_severity_alerts * 5 +
            low_severity_alerts * 2 +
            len(blocked_attempts) * 3
        )
        
        # Determine threat level
        if threat_score > 100:
            level = 'Critical'
            color = 'red'
        elif threat_score > 50:
            level = 'High'
            color = 'orange'
        elif threat_score > 20:
            level = 'Medium'
            color = 'yellow'
        else:
            level = 'Low'
            color = 'green'
        
        return {
            'level': level,
            'score': threat_score,
            'color': color,
            'high_severity_count': high_severity_alerts,
            'medium_severity_count': medium_severity_alerts,
            'low_severity_count': low_severity_alerts,
            'blocked_attempts_count': len(blocked_attempts),
            'recommendation': self._get_threat_recommendation(level)
        }
    
    def generate_recommendations(self, system_stats, alerts, traffic_patterns):
        """
        Generate AI-powered security recommendations
        """
        recommendations = {
            'priority': [],
            'general': [],
            'preventive': []
        }
        
        # Analyze active connections
        if system_stats.get('activeConnections', 0) > 100:
            recommendations['priority'].append({
                'title': 'High Connection Load',
                'description': 'Active connections exceed normal thresholds',
                'action': 'Consider implementing connection rate limiting'
            })
        
        # Analyze alerts
        recent_alerts = alerts[:10]
        high_severity_recent = len([a for a in recent_alerts if a.get('severity') == 'high'])
        
        if high_severity_recent > 3:
            recommendations['priority'].append({
                'title': 'Multiple High-Severity Alerts',
                'description': f'{high_severity_recent} high-severity alerts in recent activity',
                'action': 'Immediate investigation required'
            })
        
        # Traffic pattern analysis
        if traffic_patterns:
            df = pd.DataFrame(traffic_patterns)
            avg_threats = df['threats'].mean()
            
            if avg_threats > 5:
                recommendations['general'].append({
                    'title': 'Elevated Threat Detection',
                    'description': f'Average {avg_threats:.1f} threats per interval',
                    'action': 'Review firewall rules and update threat signatures'
                })
        
        # Preventive recommendations
        recommendations['preventive'].extend([
            {
                'title': 'Regular Security Audits',
                'description': 'Schedule periodic security assessments',
                'action': 'Implement monthly security audit protocol'
            },
            {
                'title': 'User Training',
                'description': 'Enhance security awareness',
                'action': 'Conduct quarterly security training sessions'
            }
        ])
        
        return recommendations
    
    def predict_attack_likelihood(self, historical_data, current_patterns):
        """
        Predict likelihood of attacks based on patterns
        """
        # Simple prediction based on pattern matching
        df_current = pd.DataFrame(current_patterns)
        
        # Calculate risk indicators
        avg_threats = df_current['threats'].mean()
        threat_spike = df_current['threats'].max() > df_current['threats'].mean() * 2
        
        # Determine likelihood
        if avg_threats > 10 or threat_spike:
            likelihood = 'High'
            probability = 0.75
        elif avg_threats > 5:
            likelihood = 'Medium'
            probability = 0.45
        else:
            likelihood = 'Low'
            probability = 0.15
        
        return {
            'likelihood': likelihood,
            'probability': probability,
            'confidence': 0.85,
            'indicators': {
                'average_threats': round(avg_threats, 2),
                'threat_spike_detected': threat_spike,
                'pattern_analysis': 'Analyzing current network behavior patterns'
            },
            'recommendation': self._get_attack_recommendation(likelihood)
        }
    
    # Helper methods
    def _find_peak_time(self, df):
        """Find time with highest traffic"""
        if 'time' in df.columns and 'inbound' in df.columns:
            peak_idx = df['inbound'].idxmax()
            return df.loc[peak_idx, 'time']
        return 'N/A'
    
    def _generate_insights(self, df, trend, change_pct):
        """Generate human-readable insights"""
        insights = []
        
        if abs(change_pct) > 50:
            insights.append(f'Significant {trend} trend detected - requires attention')
        
        avg_threats = df['threats'].mean()
        if avg_threats > 5:
            insights.append(f'Elevated threat level: {avg_threats:.1f} threats per interval')
        
        if len(insights) == 0:
            insights.append('Network traffic within normal parameters')
        
        return insights
    
    def _calculate_anomaly_score(self, data):
        """Calculate anomaly severity score"""
        score = 0
        score += data.get('threats', 0) * 10
        score += (data.get('inbound', 0) / 100) * 5
        score += (data.get('cpu_usage', 0) / 100) * 3
        return min(round(score, 2), 100)
    
    def _determine_anomaly_reason(self, data):
        """Determine why data point is anomalous"""
        reasons = []
        
        if data.get('threats', 0) > 10:
            reasons.append('High threat count')
        if data.get('inbound', 0) > 300:
            reasons.append('Unusual inbound traffic')
        if data.get('cpu_usage', 0) > 90:
            reasons.append('High CPU usage')
        
        return ', '.join(reasons) if reasons else 'Pattern deviation detected'
    
    def _get_threat_recommendation(self, level):
        """Get recommendation based on threat level"""
        recommendations = {
            'Critical': 'Immediate action required. Activate incident response team.',
            'High': 'Closely monitor systems and investigate high-severity alerts.',
            'Medium': 'Review recent alerts and maintain vigilant monitoring.',
            'Low': 'Continue normal operations with standard monitoring.'
        }
        return recommendations.get(level, 'Monitor systems regularly.')
    
    def _get_attack_recommendation(self, likelihood):
        """Get recommendation based on attack likelihood"""
        recommendations = {
            'High': 'Increase monitoring frequency and prepare incident response',
            'Medium': 'Maintain heightened awareness and review security measures',
            'Low': 'Continue standard security protocols'
        }
        return recommendations.get(likelihood, 'Monitor regularly')