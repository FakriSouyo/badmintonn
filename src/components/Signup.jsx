import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone } from 'react-icons/fi';
import { Input } from './ui/input';
import { Button } from './ui/button';

const Signup = ({ onSignup, onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSignup(formData.email, formData.password, formData.name, formData.phoneNumber);
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
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter your name"
              required
            />
          </div>
        </div>
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
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
            Phone Number
          </label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              className="pl-10"
              placeholder="Enter your phone number"
              required
            />
          </div>
        </div>
        <Button type="submit" className="w-full">Sign Up</Button>
      </form>
      <p className="mt-4 text-sm text-center text-gray-600">
        Already have an account?{' '}
        <button onClick={onSwitchToLogin} className="text-blue-600 hover:underline">
          Log in
        </button>
      </p>
    </motion.div>
  );
};

export default Signup;