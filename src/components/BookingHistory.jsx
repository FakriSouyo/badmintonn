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
        orderNumber: data.length - index
      }));
      
      setBookings(bookingsWithOrder);
      console.log('Fetched bookings:', bookingsWithOrder);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      console.log('Attempting to cancel booking:', bookingId);

      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Fetch the updated booking
      const { data: updatedBooking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedBooking) {
        throw new Error('Failed to fetch updated booking');
      }

      console.log('Updated booking:', updatedBooking);

      // Update the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId ? { ...booking, ...updatedBooking } : booking
        )
      );
      
      toast.success('Booking cancelled successfully');
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error(error.message || 'Failed to cancel booking');
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
              <h2 className="text-2xl font-bold text-gray-800">Booking History</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            {loading ? (
              <p className="text-center text-gray-600">Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="text-center text-gray-600">No bookings found.</p>
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
                      <span className="font-semibold">Booking #{booking.orderNumber}</span>
                      <span className="text-sm text-gray-500">
                        {new Date(booking.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Court:</span> {booking.courts.name}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Date:</span> {new Date(booking.booking_date).toLocaleDateString()}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Time:</span> {booking.start_time} - {booking.end_time}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Status:</span> {booking.status}
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Total Price:</span> Rp {booking.total_price.toLocaleString()}
                    </div>
                    {booking.status === 'pending' && (
                      <Button 
                        onClick={() => cancelBooking(booking.id)} 
                        variant="outline" 
                        className="mt-2"
                      >
                        Cancel Booking
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