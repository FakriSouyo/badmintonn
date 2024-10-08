import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCalendar } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar } from './ui/calendar';
import { format, isBefore, startOfToday, parseISO, addHours, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import Payment from './Payment';

const BookingModal = ({ isOpen, onClose, initialBookingData }) => {
  const { user } = useAuth();
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [startTime, setStartTime] = useState(null);
  const [endTime, setEndTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [currentStep, setCurrentStep] = useState('booking');
  const [bookingData, setBookingData] = useState(null);
  const [bookedSlots, setBookedSlots] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchCourts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialBookingData) {
      setSelectedCourt(initialBookingData.courtId);
      setSelectedDate(parseISO(initialBookingData.date));
      setStartTime(initialBookingData.startTime);
      setEndTime(format(addHours(parseISO(`2000-01-01T${initialBookingData.startTime}`), 1), 'HH:mm'));
    }
  }, [initialBookingData]);

  useEffect(() => {
    if (selectedCourt && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedCourt, selectedDate]);

  useEffect(() => {
    if (selectedCourt && startTime && endTime) {
      const court = courts.find(court => court.id === selectedCourt);
      if (court) {
        const duration = calculateDuration(startTime, endTime);
        setTotalPrice(court.hourly_rate * duration);
      }
    }
  }, [selectedCourt, startTime, endTime, courts]);

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase.from('courts').select('*');
      if (error) throw error;
      setCourts(data);
    } catch (error) {
      console.error('Error fetching courts:', error);
      toast.error('Failed to load courts');
    }
  };

  const fetchBookedSlots = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('court_id', selectedCourt)
        .eq('date', format(selectedDate, 'yyyy-MM-dd'))
        .in('status', ['booked', 'confirmed', 'maintenance', 'holiday']);

      if (error) throw error;
      setBookedSlots(data || []);
    } catch (error) {
      console.error('Error fetching booked slots:', error);
      toast.error('Failed to load booked slots');
    }
  };

  const handleBooking = async () => {
    if (!selectedCourt || !selectedDate || !startTime || !endTime) {
      toast.error('Silakan isi semua kolom');
      return;
    }

    setLoading(true);
    try {
      // Hanya menyimpan data pemesanan sementara, belum mengirim ke database
      const tempBookingData = {
        user_id: user.id,
        court_id: selectedCourt,
        booking_date: format(selectedDate, 'yyyy-MM-dd'),
        start_time: startTime,
        end_time: endTime,
        total_price: totalPrice,
        status: 'pending'
      };

      setBookingData(tempBookingData);
      setCurrentStep('payment');
    } catch (error) {
      console.error('Kesalahan pemesanan:', error);
      toast.error('Gagal membuat pemesanan');
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (start, end) => {
    const startDate = parseISO(`2000-01-01T${start}`);
    const endDate = parseISO(`2000-01-01T${end}`);
    return (endDate - startDate) / (1000 * 60 * 60); // Convert to hours
  };

  const formatPrice = (price) => {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    const hour = i + 6; // Start from 6 AM
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  const isSlotBooked = (time) => {
    return bookedSlots.some(slot => 
      (parseISO(`2000-01-01T${slot.start_time}`) <= parseISO(`2000-01-01T${time}`) &&
       parseISO(`2000-01-01T${time}`) < parseISO(`2000-01-01T${slot.end_time}`))
    );
  };

  const isOverlappingBooking = (start, end) => {
    return bookedSlots.some(slot => 
      (parseISO(`2000-01-01T${start}`) < parseISO(`2000-01-01T${slot.end_time}`) &&
       parseISO(`2000-01-01T${end}`) > parseISO(`2000-01-01T${slot.start_time}`))
    );
  };

  const handleStartTimeChange = (time) => {
    setStartTime(time);
    setEndTime(null); // Reset end time when start time changes
  };

  const handleEndTimeChange = (time) => {
    if (startTime && !isOverlappingBooking(startTime, time)) {
      setEndTime(time);
    } else {
      toast.error('Selected time slot overlaps with an existing booking');
    }
  };

  const handleClose = () => {
    setCurrentStep('booking');
    setSelectedCourt(null);
    setSelectedDate(null);
    setStartTime(null);
    setEndTime(null);
    setBookingData(null);
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        currentStep === 'booking' ? (
          <motion.div
            key="booking-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={handleClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">Pesan Lapangan</h2>
                <button onClick={handleClose} className="text-gray-500 hover:text-gray-700">
                  <FiX size={24} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Lapangan
                  </label>
                  <Select onValueChange={setSelectedCourt} value={selectedCourt}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a court" />
                    </SelectTrigger>
                    <SelectContent>
                      {courts.map((court) => (
                        <SelectItem key={court.id} value={court.id}>
                          {court.name} - Rp {formatPrice(court.hourly_rate)}/Jam
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pilih Tanggal
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => isBefore(date, startOfToday())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mulai Waktu
                  </label>
                  <Select onValueChange={handleStartTimeChange} value={startTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select start time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(0, -1).map((time) => (
                        <SelectItem 
                          key={time} 
                          value={time}
                          disabled={isSlotBooked(time)}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Selesai Waktu
                  </label>
                  <Select onValueChange={handleEndTimeChange} value={endTime}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select end time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.slice(1).map((time) => (
                        <SelectItem 
                          key={time} 
                          value={time} 
                          disabled={!startTime || time <= startTime || isOverlappingBooking(startTime, time)}
                        >
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedCourt && selectedDate && startTime && endTime && (
                  <div className="text-right text-sm text-gray-600">
                    Total Harga: Rp {formatPrice(totalPrice)}
                  </div>
                )}
                <Button
                  onClick={handleBooking}
                  className="w-full"
                  disabled={loading || !selectedCourt || !selectedDate || !startTime || !endTime}
                >
                  {loading ? 'Memproses...' : 'Lanjutkan ke Pembayaran'}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <Payment
            key="payment-modal"
            isOpen={true}
            onClose={handleClose}
            bookingData={bookingData}
            totalAmount={totalPrice}
          />
        )
      )}
    </AnimatePresence>
  );
};

export default BookingModal;