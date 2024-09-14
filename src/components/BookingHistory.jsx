import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';

const BookingHistory = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && isOpen) {
      fetchBookings();
    }
  }, [user, isOpen]);

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (
            name,
            hourly_rate
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const bookingsWithOrder = data.map((booking, index) => ({
        ...booking,
        orderNumber: data.length - index,
        payment_status: booking.payment_status || 'pending'
      }));
      
      setBookings(bookingsWithOrder);
      console.log('Fetched bookings:', bookingsWithOrder);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal memuat riwayat pemesanan');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      console.log('Mencoba membatalkan pemesanan:', bookingId);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', payment_status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      const { data: updatedBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedBooking) {
        throw new Error('Gagal mengambil pemesanan yang diperbarui');
      }

      console.log('Pemesanan diperbarui:', updatedBooking);

      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? { ...booking, ...updatedBooking } : booking
        )
      );
      
      toast.success('Pemesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error membatalkan pemesanan:', error);
      toast.error(error.message || 'Gagal membatalkan pemesanan');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'paid':
      case 'confirmed':
        return 'text-green-600';
      case 'cancelled':
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
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
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Riwayat Pemesanan</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            {loading ? (
              <p className="text-center text-gray-600">Memuat pemesanan...</p>
            ) : bookings.length === 0 ? (
              <p className="text-center text-gray-600">Tidak ada pemesanan ditemukan.</p>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <motion.div
                    key={booking.id}
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold">Pemesanan #{booking.orderNumber}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Lapangan:</span> {booking.courts.name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Tanggal:</span> {new Date(booking.booking_date).toLocaleDateString()}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Waktu:</span> {booking.start_time} - {booking.end_time}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Status Pemesanan:</span> 
                      <span className={`ml-1 ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Status Pembayaran:</span> 
                      <span className={`ml-1 ${getStatusColor(booking.payment_status)}`}>
                        {booking.payment_status}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total Harga:</span> Rp {booking.total_price.toLocaleString()}
                    </div>
                    {booking.status === 'pending' && (
                      <Button 
                        onClick={() => cancelBooking(booking.id)} 
                        variant="outline" 
                        className="mt-2"
                      >
                        Batalkan Pemesanan
                      </Button>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingHistory;