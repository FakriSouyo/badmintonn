import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import Refund from './Refund';
import { differenceInSeconds, parseISO, format } from 'date-fns';
import InvoiceDownload from './InvoiceDownload';


const BookingHistory = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchBookings();
    }
  }, [user, isOpen]);

  useEffect(() => {
    const timer = setInterval(() => {
      setBookings(prevBookings => 
        prevBookings.map(booking => ({
          ...booking,
          timeLeft: calculateTimeLeft(booking.created_at)
        }))
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const calculateTimeLeft = (createdAt) => {
    const diff = differenceInSeconds(new Date(), parseISO(createdAt));
    const secondsLeft = 1800 - diff;
    if (secondsLeft <= 0) return '00:00';
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const fetchBookings = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (name, hourly_rate),
          refunds (id, status)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const bookingsWithOrder = data.map((booking, index) => ({
        ...booking,
        orderNumber: data.length - index,
        payment_status: booking.payment_status || 'pending',
        timeLeft: calculateTimeLeft(booking.created_at),
        refund_status: booking.refunds.length > 0 ? booking.refunds[0].status : null
      }));
      
      setBookings(bookingsWithOrder);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal memuat riwayat pemesanan');
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled', payment_status: 'cancelled' })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled', payment_status: 'cancelled' } 
            : booking
        )
      );
      
      toast.success('Pemesanan berhasil dibatalkan');
    } catch (error) {
      console.error('Error membatalkan pemesanan:', error);
      toast.error(error.message || 'Gagal membatalkan pemesanan');
    }
  };

  const handleRefundClick = (booking) => {
    setSelectedBooking(booking);
    setShowRefundModal(true);
  };

  const handleRefundSubmitted = (refundData) => {
    setBookings(bookings.map(booking => 
      booking.id === refundData.booking_id 
        ? { ...booking, refund_status: 'pending' } 
        : booking
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600';
      case 'paid':
      case 'confirmed': return 'text-green-600';
      case 'cancelled':
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="booking-history-modal"
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
            className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">Riwayat Pemesanan</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
                <FiX size={28} />
              </button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
              </div>
            ) : bookings.length === 0 ? (
              <p className="text-center text-gray-600 text-lg">Tidak ada pemesanan ditemukan.</p>
            ) : (
              <div className="space-y-8">
                {bookings.map((booking) => (
                  <BookingCard 
                    key={booking.id}
                    booking={booking}
                    onCancel={cancelBooking}
                    onRefundClick={handleRefundClick}
                    getStatusColor={getStatusColor}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
      
      {showRefundModal && (
        <Refund
          key="refund-modal"
          booking={selectedBooking}
          onClose={() => setShowRefundModal(false)}
          onRefundSubmitted={handleRefundSubmitted}
        />
      )}
    </AnimatePresence>
  );
};

const BookingCard = ({ booking, onCancel, onRefundClick, getStatusColor }) => (
  <motion.div
    initial={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="bg-white border border-gray-200 rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow"
  >
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <BookingDetails booking={booking} />
      <BookingStatus booking={booking} getStatusColor={getStatusColor} />
    </div>
    <BookingActions 
      booking={booking} 
      onCancel={onCancel} 
      onRefundClick={onRefundClick} 
    />
  </motion.div>
);

const BookingDetails = ({ booking }) => (
  <div className="space-y-2">
    <h3 className="font-semibold text-xl mb-3">Pemesanan #{booking.orderNumber}</h3>
    <p className="text-sm text-gray-500">{format(new Date(booking.created_at), 'dd MMMM yyyy, HH:mm')}</p>
    <p><span className="font-medium">Lapangan:</span> {booking.courts.name}</p>
    <p><span className="font-medium">Tanggal:</span> {format(new Date(booking.booking_date), 'dd MMMM yyyy')}</p>
    <p><span className="font-medium">Waktu:</span> {booking.start_time} - {booking.end_time}</p>
  </div>
);

const BookingStatus = ({ booking, getStatusColor }) => (
  <div className="space-y-2">
    <StatusItem label="Status Pemesanan" value={booking.status} color={getStatusColor(booking.status)} />
    <StatusItem label="Status Pembayaran" value={booking.payment_status} color={getStatusColor(booking.payment_status)} />
    <p><span className="font-medium">Total Harga:</span> Rp {booking.total_price.toLocaleString()}</p>
    {booking.refund_status && (
      <StatusItem label="Status Refund" value={booking.refund_status} color={getStatusColor(booking.refund_status)} />
    )}
  </div>
);

const StatusItem = ({ label, value, color }) => (
  <p>
    <span className="font-medium">{label}:</span> 
    <span className={`ml-1 ${color} font-semibold`}>{value}</span>
  </p>
);

const BookingActions = ({ booking, onCancel, onRefundClick }) => (
  <div className="mt-6 flex justify-between items-center">
    {booking.status === 'pending' && booking.timeLeft !== '00:00' && (
      <>
        <Button 
          onClick={() => onCancel(booking.id)} 
          variant="outline" 
          className="bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
        >
          Batalkan Pemesanan
        </Button>
        <span className="text-sm font-medium text-gray-500">Sisa Waktu: {booking.timeLeft}</span>
      </>
    )}
    {booking.status === 'cancelled' && !booking.refund_status && (
      <Button 
        onClick={() => onRefundClick(booking)} 
        disabled={booking.refund_status !== null}
        className="bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200"
      >
        {booking.refund_status ? 'Refund Diajukan' : 'Ajukan Refund'}
      </Button>
    )}
    {booking.status === 'confirmed' && (
      <InvoiceDownload booking={booking} />
    )}
  </div>
);

export default BookingHistory;