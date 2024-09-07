import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h1 className="text-6xl font-bold text-black mb-4">404</h1>
        <h2 className="text-3xl font-semibold text-gray-800 mb-6">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-600 mb-8">Maaf, halaman yang Anda cari tidak ada.</p>
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link 
            to="/" 
            className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition duration-300"
          >
            Kembali ke Beranda
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default NotFound;