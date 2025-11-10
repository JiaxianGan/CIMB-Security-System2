import pandas as pd
from datetime import datetime

class DataProcessor:
    def process_traffic_data(self, raw_data):
        """
        Process raw traffic data into usable format
        """
        if not raw_data:
            return []
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(raw_data)
        
        # Ensure required columns exist
        required_cols = ['inbound', 'outbound', 'threats']
        for col in required_cols:
            if col not in df.columns:
                df[col] = 0
        
        # Fill missing values
        df = df.fillna(0)
        
        # Convert to list of dictionaries
        return df.to_dict('records')
    
    def get_current_timestamp(self):
        """Get current timestamp in ISO format"""
        return datetime.now().isoformat()
    
    def aggregate_by_time(self, data, interval='5min'):
        """
        Aggregate data by time intervals
        """
        df = pd.DataFrame(data)
        
        if 'timestamp' in df.columns:
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')
            df = df.set_index('timestamp')
            
            # Resample based on interval
            aggregated = df.resample(interval).agg({
                'inbound': 'mean',
                'outbound': 'mean',
                'threats': 'sum'
            }).reset_index()
            
            return aggregated.to_dict('records')
        
        return data