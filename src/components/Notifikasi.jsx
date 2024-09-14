import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import toast from 'react-hot-toast';

const Notifikasi = ({ isOpen, onClose, user }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
      const subscription = subscribeToNotifications();
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user, isOpen]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
  
      if (error) throw error;
  
      setNotifications(data);
      
      // Tandai semua notifikasi sebagai telah dibaca
      if (data.length > 0) {
        const unreadNotifications = data.filter(notif => !notif.is_read);
        if (unreadNotifications.length > 0) {
          await markAllAsRead(unreadNotifications.map(notif => notif.id));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Gagal mengambil notifikasi');
    }
  };

  const subscribeToNotifications = () => {
    const subscription = supabase
      .channel(`public:notifications:user_id=eq.${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, handleNewNotification)
      .subscribe();
  
    return subscription;
  };

  const handleNewNotification = (payload) => {
    setNotifications(prevNotifications => [payload.new, ...prevNotifications]);
    toast.success('Anda memiliki notifikasi baru');
  };

  const markAllAsRead = async (notificationIds) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', notificationIds);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.map(notif =>
          notificationIds.includes(notif.id) ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notifications as read:', error);
      toast.error('Gagal menandai notifikasi sebagai telah dibaca');
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
            className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Notifikasi</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <FiX size={24} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-64px)]">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Tidak ada notifikasi</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`p-3 rounded-md transition-colors ${notif.is_read ? 'bg-gray-100' : 'bg-blue-50'}`}
                    >
                      <p className="text-sm text-gray-800 mb-1">{notif.message}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(notif.created_at).toLocaleString('id-ID', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notifikasi;