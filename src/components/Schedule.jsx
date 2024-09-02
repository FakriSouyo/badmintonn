import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { format, addDays, parseISO, addHours } from 'date-fns';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const Schedule = ({ onBookingInitiated, openAuthModal }) => {
  const { user } = useAuth();
  const [courts, setCourts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];
  
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
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, payload => {
        console.log('Real-time update received:', payload);
        setSchedules(currentSchedules => {
          const updatedSchedules = [...currentSchedules];
          const index = updatedSchedules.findIndex(s => s.id === payload.new.id);
          if (index !== -1) {
            updatedSchedules[index] = payload.new;
          } else {
            updatedSchedules.push(payload.new);
          }
          return updatedSchedules;
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleSubscription);
    };
  }, []);

  const isSlotBooked = (courtId, date, time) => {
    return schedules.some(schedule => 
      schedule.court_id === courtId &&
      schedule.date === date &&
      schedule.start_time === time &&
      (schedule.status === 'booked' || schedule.status === 'pending')
    );
  };

  const handleSlotClick = async (courtId, day, startTime) => {
    if (isSlotBooked(courtId, day.date, startTime)) {
      toast.error('Maaf, slot ini sudah dipesan. Silakan pilih slot lain.');
      return;
    }

    if (user) {
      try {
        // Calculate end_time (assuming 1 hour duration)
        const startDateTime = parseISO(`${day.date}T${startTime}`);
        const endDateTime = addHours(startDateTime, 1);
        const endTime = format(endDateTime, 'HH:mm');

        const bookingData = {
          courtId: courtId,
          date: day.date,
          startTime: startTime,
          endTime: endTime,
        };

        // Initiate booking process
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

  const renderScheduleModal = (court) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button onClick={() => setSelectedCourt(court)} className="w-full sm:w-auto">View Schedule</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Schedule for Court {court.name}</DialogTitle>
          <DialogDescription>Select an available slot to book</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg text-sm sm:text-base">
            <thead className="sticky top-0 bg-gray-200 z-10">
              <tr>
                <th className="p-2 sm:p-3 text-left">Time</th>
                {days.map(day => (
                  <th key={day.name} className="p-2 sm:p-3 text-left">
                    <div>{day.name.slice(0, 3)}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{day.displayDate}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, index) => (
                <tr 
                  key={time}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="p-2 sm:p-3 font-medium sticky left-0 bg-inherit">{time}</td>
                  {days.map(day => {
                    const isBooked = isSlotBooked(court.id, day.date, time);
                    return (
                      <td key={`${day.name}-${time}`} className="p-1 sm:p-2">
                        <DialogClose asChild>
                          <Button 
                            variant={isBooked ? "secondary" : "outline"}
                            size="sm" 
                            className={`w-full text-xs sm:text-sm ${
                              isBooked ? 'bg-red-500 text-white cursor-not-allowed' : 
                              'hover:bg-green-100'
                            }`}
                            onClick={() => !isBooked && handleSlotClick(court.id, day, time)}
                            disabled={isBooked}
                          >
                            {isBooked ? 'Dipesan' : 'Tersedia'}
                          </Button>
                        </DialogClose>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );

  const fetchSchedules = async () => {
    try {
      const startDate = format(today, 'yyyy-MM-dd');
      const endDate = format(addDays(today, 6), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
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
      setCourts(data|| []);
    } catch (error) {
      console.error('Error fetching courts:', error);
      throw new Error('Failed to fetch courts data');
    }
  };

  const renderCourtCard = (court) => {
    const imageUrl = court.court_img 
      ? `${supabase.storage.from('imgcourt').getPublicUrl(court.court_img).data.publicUrl}`
      : "/api/placeholder/400/300";

    return (
      <Card key={court.id} className="w-full max-w-sm mx-auto">
        <CardHeader>
          <CardTitle>{court.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <img src={imageUrl} alt={`Court ${court.name}`} className="w-full h-48 object-cover rounded-md mb-4" />
          <p className="text-lg font-semibold">Harga: Rp {court.hourly_rate.toLocaleString('id-ID')}/jam</p>
          <p className="mt-2 text-sm">{court.description}</p>
        </CardContent>
        <CardFooter>
          {renderScheduleModal(court)}
        </CardFooter>
      </Card>
    );
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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-6 sm:mb-8 text-gray-900">Our Courts</h2>
          {courts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {courts.map(court => renderCourtCard(court))}
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
