import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import { Input } from './ui/input';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

const ProfileModal = ({ isOpen, onClose, user }) => {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setLoading(true);
        try {
          // Modifikasi query untuk menggunakan .match() daripada .eq()
          const { data, error } = await supabase
            .from('profiles')
            .select('full_name, phone_number')
            .match({ id: user.id })
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            // Jika profil tidak ditemukan, kita akan membuat profil baru
            if (error.code === 'PGRST116') {
              await createProfile();
            } else {
              throw error;
            }
          } else if (data) {
            setFullName(data.full_name || '');
            setPhoneNumber(data.phone_number || '');
          }
        } catch (error) {
          console.error('Error mengambil data profil:', error);
          toast.error('Gagal mengambil data profil');
        } finally {
          setLoading(false);
        }
      }
    };

    const createProfile = async () => {
      try {
        const { error } = await supabase
          .from('profiles')
          .insert({ id: user.id, full_name: '', phone_number: '' });

        if (error) throw error;

        console.log('Profil baru dibuat');
      } catch (error) {
        console.error('Error membuat profil baru:', error);
        toast.error('Gagal membuat profil baru');
      }
    };

    fetchUserData();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: user.id, full_name: fullName, phone_number: phoneNumber });

      if (error) throw error;

      toast.success('Profil berhasil diperbarui');
      onClose();
    } catch (error) {
      console.error('Error memperbarui profil:', error);
      toast.error('Gagal memperbarui profil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
              <h2 className="text-2xl font-bold text-gray-800">Profil Anda</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            {loading ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2">Memuat data...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Lengkap
                  </label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                    Nomor Telepon
                  </label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Masukkan nomor telepon Anda"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Memperbarui...' : 'Perbarui Profil'}
                </Button>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProfileModal;