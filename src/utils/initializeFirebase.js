import { ref, set } from 'firebase/database';
import { rtdb } from '../firebase';

export const initializeFirebaseData = async () => {
  try {
    // Initialize static data structure to match your database
    const staticData = {
      user_behavior: [
        { hour: '00-06', normal: 15, suspicious: 2 },
        { hour: '06-12', normal: 45, suspicious: 5 },
        { hour: '12-18', normal: 65, suspicious: 8 },
        { hour: '18-24', normal: 35, suspicious: 3 },
      ],
      dns_filtering: [
        { category: 'Malware', blocked: 142 },
        { category: 'Phishing', blocked: 89 },
        { category: 'Adult', blocked: 234 },
        { category: 'Social', blocked: 67 },
        { category: 'Ads', blocked: 156 },
      ],
      system_stats: {
        totalUsers: 1247,
        activeConnections: 89,
        blockedAttempts: 0,
        alertsToday: 0,
      }
    };

    // Set initial data using your flat structure
    await set(ref(rtdb, 'user_behavior'), staticData.user_behavior);
    await set(ref(rtdb, 'dns_filtering'), staticData.dns_filtering);
    await set(ref(rtdb, 'system_stats'), staticData.system_stats);
    
    console.log('Firebase initialized with your database structure');
    return true;
  } catch (error) {
    console.error('Error initializing Firebase:', error);
    return false;
  }
};