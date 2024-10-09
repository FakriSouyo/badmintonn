import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays, parseISO, addHours, isWithinInterval, isSameHour } from 'date-fns';
import ScheduleModal from './ScheduleModal';
import CourtCard from './CourtCard';

const Schedule = ({ onBookingInitiated, openAuthModal }) => {
  const { user } = useAuth();
  const [courts, setCourts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();
  const days = [...Array(7)].map((_, index) => {
    const date = addDays(today, index);
    return {
      name: format(date, 'EEEE'),
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'd MMM')
    };
  });

  useEffect(() => {
    fetchData();

    const scheduleSubscription = supabase
      .channel('public:schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, handleScheduleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleSubscription);
    };
  }, []);

  const handleScheduleChange = (payload) => {
    console.log('Real-time update received:', payload);
    setSchedules(currentSchedules => {
      const updatedSchedules = currentSchedules.map(s => 
        s.id === payload.new.id ? { ...s, ...payload.new } : s
      );
      if (!updatedSchedules.some(s => s.id === payload.new.id)) {
        updatedSchedules.push(payload.new);
      }
      return updatedSchedules;
    });
  };

  const fetchData = async (retryCount = 0) => {
    console.log('Fetching data...');
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCourts(), fetchSchedules()]);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (retryCount < 3) {
        console.log(`Retrying... Attempt ${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchData(retryCount + 1);
      }
      setError(error.message || 'An error occurred while fetching data');
      toast.error('Failed to load schedule data. Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase.from('courts').select('*');
      if (error) throw error;
      console.log('Courts fetched:', data);
      setCourts(data || []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      throw new Error('Failed to fetch courts data');
    }
  };

  const fetchSchedules = async () => {
    try {
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          user:users(full_name, email)
        `)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      console.log('Schedules fetched:', data);
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      throw new Error('Failed to fetch schedules data');
    }
  };

  const isSlotBooked = useCallback((courtId, date, time) => {
    const slotDateTime = parseISO(`${date}T${time}`);
    
    return schedules.some(schedule => 
      schedule.court_id === courtId &&
      schedule.date === date &&
      (schedule.status === 'booked' || schedule.status === 'confirmed' || schedule.status === 'holiday' || schedule.status === 'maintenance') &&
      isSameHour(slotDateTime, parseISO(`${schedule.date}T${schedule.start_time}`))
    );
  }, [schedules]);

  const getSlotStatus = useCallback((courtId, date, time) => {
    const slotDateTime = parseISO(`${date}T${time}`);
    
    const schedule = schedules.find(schedule => 
      schedule.court_id === courtId &&
      schedule.date === date &&
      isSameHour(slotDateTime, parseISO(`${schedule.date}T${schedule.start_time}`))
    );

    if (!schedule) return { status: 'available', userName: null };
    
    return {
      status: schedule.status,
      userName: schedule.user?.full_name || schedule.user?.email || null
    };
  }, [schedules]);

  const handleSlotClick = async (courtId, day, startTime) => {
    const status = getSlotStatus(courtId, day.date, startTime);
    if (status.status !== 'available') {
      let message;
      switch (status.status) {
        case 'booked':
        case 'confirmed':
          message = 'Maaf, slot ini sudah dipesan.';
          break;
        case 'holiday':
          message = 'Maaf, slot ini tidak tersedia karena hari libur.';
          break;
        case 'maintenance':
          message = 'Maaf, slot ini tidak tersedia karena sedang dalam pemeliharaan.';
          break;
        default:
          message = 'Maaf, slot ini tidak tersedia.';
      }
      toast.error(message);
      return;
    }

    if (user) {
      try {
        const startDateTime = parseISO(`${day.date}T${startTime}`);
        const endDateTime = addHours(startDateTime, 1);
        const endTime = format(endDateTime, 'HH:mm');

        const bookingData = {
          courtId: courtId,
          date: day.date,
          startTime: startTime,
          endTime: endTime,
        };

        onBookingInitiated(bookingData);
        
        toast.success('Proses pemesanan dimulai. Silakan lanjutkan ke pembayaran.');
      } catch (error) {
        console.error('Error initiating booking:', error);
        toast.error(`Gagal memulai pemesanan: ${error.message || 'Unknown error'}`);
      }
    } else {
      openAuthModal();
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="animate-spin rounded-full h-16 w-16 sm:h-32 sm:w-32 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-sm sm:text-base">Loading schedule...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500 px-4">
        <p className="text-lg sm:text-xl font-bold mb-4">Error loading schedule</p>
        <p className="mb-4 text-sm sm:text-base">{error}</p>
        <Button onClick={() => fetchData()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section id="schedule" className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="container px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-6 sm:mb-8 text-gray-900">Lapangan</h2>
          {courts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {courts.map(court => (
                <CourtCard
                  key={court.id}
                  court={court}
                  schedules={schedules}
                  days={days}
                  user={user}
                  onBookingInitiated={onBookingInitiated}
                  openAuthModal={openAuthModal}
                  setSchedules={setSchedules}
                  isSlotBooked={isSlotBooked}
                  getSlotStatus={getSlotStatus}
                  handleSlotClick={handleSlotClick}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-lg sm:text-xl mb-4">No courts available</p>
              <Button onClick={() => fetchData()} className="mt-4">
                Refresh
              </Button>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default Schedule;