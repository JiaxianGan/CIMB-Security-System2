import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase'; // Adjust path as needed

// SVG Icons as components
const ShieldIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
    <polyline points="22,6 12,13 2,6"/>
  </svg>
);

const LockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <circle cx="12" cy="16" r="1"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const EyeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const AlertCircleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

// Background component
const AnimatedBackground = ({ children }) => (
  <div className="min-h-screen bg-gradient-main relative overflow-hidden">
    <div className="absolute inset-0 overflow-hidden">
      <div className="bg-element bg-element-1 animate-pulse"></div>
      <div className="bg-element bg-element-2 animate-pulse delay-1000"></div>
      <div className="bg-element bg-element-3 animate-pulse delay-500"></div>
      <div className="bg-element bg-element-4 animate-pulse delay-2000"></div>
      <div className="bg-element bg-element-5 animate-pulse delay-3000"></div>
    </div>
    
    {/* Floating Particles */}
    <div className="absolute inset-0 overflow-hidden">
      {Array.from({ length: 20 }, (_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}
        />
      ))}
    </div>
    
    <div className="relative z-10">
      {children}
    </div>
  </div>
);

const LoginPage = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
      const user = userCredential.user;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        onLogin({ uid: user.uid, email: user.email, username: userData.username, role: userData.role });
      } else {
        setError('User metadata not found');
      }
    } catch (err) {
      setError('Invalid email or password');
      console.error('Login error:', err);
    }
    setIsLoading(false);
  };

  const handleInputChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const demoCredentials = [
    { role: 'Administrator', email: 'admin@example.com', password: 'admin123', icon: '🔐' },
    { role: 'Manager', email: 'manager@example.com', password: 'manager123', icon: '👨‍💼' },
    { role: 'Security Analyst', email: 'security@example.com', password: 'security123', icon: '🛡️' }
  ];

  return (
    <AnimatedBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="glass-card-gradient p-6 text-center">
            {/* Logo and Title */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="stat-icon-bg bg-gradient-blue"></div>
                <div className="stat-icon bg-gradient-blue text-white">
                  <ShieldIcon />
                </div>
              </div>
            </div>
            
            <h2 className="text-3xl font-bold text-white mb-2">
              CIMB Security Portal
            </h2>
            <p className="text-white-60 text-sm mb-8">
              Advanced Threat Monitoring & Response Platform
            </p>

            {/* Error Message */}
            {error && (
              <div className="alert-high p-4 mb-6 flex items-center space-x-3 rounded-xl">
                <div className="text-red-400">
                  <AlertCircleIcon />
                </div>
                <p className="text-red-200 text-sm">{error}</p>
              </div>
            )}

            {/* Login Form */}
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white-80 mb-2 text-left">
                  Email Address
                </label>
                <div className="relative">
                  <div className="icon-left text-white-40">
                    <MailIcon />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="form-input form-input-icon"
                    placeholder="Enter your email"
                    value={credentials.email}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white-80 mb-2 text-left">
                  Password
                </label>
                <div className="relative">
                  <div className="icon-left text-white-40">
                    <LockIcon />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="form-input form-input-icon pr-12"
                    placeholder="Enter your password"
                    value={credentials.password}
                    onChange={handleInputChange}
                  />
                  <button
                    type="button"
                    className="icon-right text-white-40 hover:text-white-60"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div style={{
                      width: '1rem',
                      height: '1rem',
                      border: '2px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%'
                    }} className="animate-spin"></div>
                    <span>Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <p className="text-white-60 text-sm mb-4">Demo Credentials:</p>
              <div className="space-y-2">
                {demoCredentials.map((cred, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      transition: 'background 0.2s ease'
                    }}
                    onClick={() => setCredentials({ email: cred.email, password: cred.password })}
                    onMouseEnter={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    onMouseLeave={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.05)'}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{cred.icon}</span>
                      <div className="text-left">
                        <p className="text-white text-sm font-medium">{cred.role}</p>
                        <p className="text-white-60 text-xs">{cred.email}</p>
                      </div>
                    </div>
                    <div className="text-white-40 text-xs font-mono px-2 py-1 rounded"
                         style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                      {cred.password}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedBackground>
  );
};

export default LoginPage;