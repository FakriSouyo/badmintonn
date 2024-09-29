import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell, FiTrash2, FiCheck, FiList } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Checkbox } from './ui/checkbox';
import toast from 'react-hot-toast';

const Notifikasi = ({ isOpen, onClose, user }) => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotifications, setSelectedNotifications] = useState([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      fetchNotifications();
      deleteOldNotifications();
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
        .select('*, bookings(id)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
  
      if (error) throw error;
  
      const notificationsWithBookingCode = data.map((notif, index) => ({
        ...notif,
        orderNumber: data.length - index,
        bookingCode: notif.bookings ? `#${(data.length - index).toString().padStart(4, '0')}` : 'N/A'
      }));
  
      setNotifications(notificationsWithBookingCode);
      
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

  const deleteOldNotifications = async () => {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyMinutesAgo)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Old notifications deleted successfully');
    } catch (error) {
      console.error('Error deleting old notifications:', error);
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
    setNotifications(prevNotifications => {
      const newNotification = {
        ...payload.new,
        orderNumber: prevNotifications.length + 1,
        bookingCode: `#${(prevNotifications.length + 1).toString().padStart(4, '0')}`
      };
      return [newNotification, ...prevNotifications];
    });
    toast.success('Anda memiliki notifikasi baru');
  };

  const formatNotificationMessage = (message, bookingCode) => {
    // Ganti UUID atau nomor pemesanan lama dengan bookingCode baru
    return message.replace(/Pemesanan #[a-f0-9-]+|Pemesanan #\d+/gi, `Pemesanan ${bookingCode}`);
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

  const deleteSelectedNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', selectedNotifications);

      if (error) throw error;

      setNotifications(prevNotifications =>
        prevNotifications.filter(notif => !selectedNotifications.includes(notif.id))
      );
      setSelectedNotifications([]);
      setIsSelectionMode(false);
      toast.success('Notifikasi terpilih berhasil dihapus');
    } catch (error) {
      console.error('Error deleting selected notifications:', error);
      toast.error('Gagal menghapus notifikasi terpilih');
    }
  };

  const toggleNotificationSelection = (notifId) => {
    setSelectedNotifications(prevSelected =>
      prevSelected.includes(notifId)
        ? prevSelected.filter(id => id !== notifId)
        : [...prevSelected, notifId]
    );
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNotifications([]);
  };

  const toggleSelectAll = () => {
    if (selectedNotifications.length === notifications.length) {
      setSelectedNotifications([]);
    } else {
      setSelectedNotifications(notifications.map(notif => notif.id));
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
              <div className="flex items-center">
                <Button
                  onClick={toggleSelectionMode}
                  variant="ghost"
                  size="sm"
                  className="mr-2"
                  title={isSelectionMode ? "Batal Pilih" : "Pilih Notifikasi"}
                >
                  {isSelectionMode ? <FiX size={20} /> : <FiList size={20} />}
                </Button>
                {isSelectionMode && (
                  <>
                    <Button
                      onClick={toggleSelectAll}
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      title="Pilih Semua"
                    >
                      <FiCheck size={20} />
                    </Button>
                    <Button
                      onClick={deleteSelectedNotifications}
                      variant="ghost"
                      size="sm"
                      className="mr-2"
                      title="Hapus Notifikasi Terpilih"
                      disabled={selectedNotifications.length === 0}
                    >
                      <FiTrash2 size={20} />
                    </Button>
                  </>
                )}
                <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(80vh-64px)]">
              {notifications.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Tidak ada notifikasi</p>
              ) : (
                <ul className="space-y-3">
                  {notifications.map((notif) => (
                    <li
                      key={notif.id}
                      className={`p-3 rounded-md transition-colors ${notif.is_read ? 'bg-gray-100' : 'bg-blue-50'} flex items-center`}
                    >
                      {isSelectionMode && (
                        <Checkbox
                          checked={selectedNotifications.includes(notif.id)}
                          onCheckedChange={() => toggleNotificationSelection(notif.id)}
                          className="mr-3"
                        />
                      )}
                      <div className="flex-grow">
                        <p className="text-sm text-gray-800 mb-1">
                          {formatNotificationMessage(notif.message, notif.bookingCode)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(notif.created_at).toLocaleString('id-ID', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
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