import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Extract session_id from URL fragment
        const hash = window.location.hash;
        const sessionId = new URLSearchParams(hash.slice(1)).get('session_id');

        if (!sessionId) {
          navigate('/admin');
          return;
        }

        // Exchange session_id for session_token
        const response = await axios.get(`${API}/auth/session`, {
          params: { session_id: sessionId },
          withCredentials: true
        });

        setUser(response.data);
        
        // Navigate to admin with user data
        navigate('/admin', { state: { user: response.data }, replace: true });
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/admin');
      }
    };

    processAuth();
  }, [navigate, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F2F0]">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-[#5C5552]">Authenticating...</p>
      </div>
    </div>
  );
}
