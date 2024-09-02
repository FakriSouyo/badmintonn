import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiMail, FiLock } from 'react-icons/fi';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Login = ({ onLogin, onSwitchToSignup }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Login form submitted with:', formData); // Debug log
    onLogin(formData.email, formData.password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter your password"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full">Login</Button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-600">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="text-blue-600 hover:underline">
          Sign up
        </button>
      </p>
    </motion.div>
  );
};

export default Login;