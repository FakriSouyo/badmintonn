import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Login from './Login';
import Signup from './Signup';
import toast from 'react-hot-toast';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode);
  const { login, signup, user, loading } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user && !loading && isOpen) {
      onClose();
      if (user.is_admin) {
        navigate('/admin');
      } else {
        navigate('/'); // or to a user dashboard if you have one
      }
    }
  }, [user, loading, isOpen, onClose, navigate]);

  const handleLogin = async (email, password) => {
    setIsProcessing(true);
    try {
      await login(email, password);
      toast.success('Login successful');
      // Navigation will be handled by the useEffect above
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSignup = async (email, password, name, phoneNumber) => {
    setIsProcessing(true);
    try {
      await signup(email, password, { full_name: name, phone_number: phoneNumber });
      toast.success('Signup successful. Please check your email for verification.');
      setMode('login');
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Signup failed');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">{mode === 'login' ? 'Login' : 'Sign Up'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <FiX size={24} />
            </button>
          </div>
          {loading || isProcessing ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2">Processing...</p>
            </div>
          ) : mode === 'login' ? (
            <Login onLogin={handleLogin} onSwitchToSignup={() => setMode('signup')} />
          ) : (
            <Signup onSignup={handleSignup} onSwitchToLogin={() => setMode('login')} />
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AuthModal;