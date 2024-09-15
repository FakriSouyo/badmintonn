import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { supabase } from '@/services/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext'; // Sesuaikan path impor
import { format, addDays, parseISO, addHours, isWithinInterval } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const AdminSchedule = () => {
  const { user } = useAuth();
  const [courts, setCourts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);

  const today = new Date();
  const days = [...Array(7)].map((_, index) => {
    const date = addDays(today, index);
    return {
      name: format(date, 'EEEE'),
      date: format(date, 'yyyy-MM-dd'),
      displayDate: format(date, 'd MMM')
    };
  });

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const fetchData = useCallback(async (retryCount = 0) => {
    console.log('Mengambil data...');
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCourts(), fetchSchedules()]);
    } catch (error) {
      console.error('Kesalahan saat mengambil data:', error);
      if (retryCount < 3) {
        console.log(`Mencoba kembali... Percobaan ke-${retryCount + 1}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return fetchData(retryCount + 1);
      }
      setError(error.message || 'Terjadi kesalahan saat mengambil data');
      toast.error('Gagal memuat data jadwal. Silakan periksa koneksi internet Anda dan coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    const scheduleSubscription = supabase
      .channel('public:schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, handleScheduleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleSubscription);
    };
  }, [fetchData]);

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

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase.from('courts').select('*');
      if (error) throw error;
      console.log('Courts fetched:', data);
      setCourts(data || []);
      if (data.length > 0) setSelectedCourt(data[0].id);
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

  const isSlotBooked = useCallback((courtId, date, time) => {
    const startDateTime = parseISO(`${date}T${time}`);
    const endDateTime = addHours(startDateTime, 1);
    
    return schedules.some(schedule => 
      schedule.court_id === courtId &&
      schedule.date === date &&
      (schedule.status === 'booked' || schedule.status === 'confirmed') &&
      isWithinInterval(startDateTime, {
        start: parseISO(`${schedule.date}T${schedule.start_time}`),
        end: parseISO(`${schedule.date}T${schedule.end_time}`)
      })
    );
  }, [schedules]);

  const updateScheduleStatus = async (courtId, date, time, newStatus) => {
    try {
      const startTime = time;
      const endTime = format(addHours(parseISO(`${date}T${time}`), 1), 'HH:mm');
      const { data, error } = await supabase
        .from('schedules')
        .upsert({
          court_id: courtId,
          date: date,
          start_time: startTime,
          end_time: endTime,
          status: newStatus,
        }, { onConflict: ['court_id', 'date', 'start_time'] })
        .select();
      if (error) throw error;
      console.log('Schedule updated successfully:', data);
      toast.success('Jadwal berhasil diperbarui');
      fetchSchedules(); // Refresh schedules after update
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast.error('Gagal memperbarui status jadwal');
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
    <section id="admin-schedule" className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="container px-4 sm:px-6 py-8 sm:py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter text-center mb-6 sm:mb-8 text-gray-900">Kelola Jadwal Lapangan</h2>
          <div className="mb-4">
            <Select 
              value={selectedCourt} 
              onValueChange={setSelectedCourt}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Pilih Lapangan" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>
                    {court.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedCourt && (
            <Dialog>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto mb-4">Lihat dan Kelola Jadwal</Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] overflow-auto">
                <DialogHeader>
                  <DialogTitle>Jadwal Lapangan {courts.find(c => c.id === selectedCourt)?.name}</DialogTitle>
                  <DialogDescription>Kelola status slot waktu</DialogDescription>
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
                            const isBooked = isSlotBooked(selectedCourt, day.date, time);
                            return (
                              <td key={`${day.name}-${time}`} className="p-1 sm:p-2">
                                <Select
                                  value={isBooked ? 'booked' : 'available'}
                                  onValueChange={(value) => updateScheduleStatus(selectedCourt, day.date, time, value)}
                                >
                                  <SelectTrigger className={`w-full text-xs sm:text-sm ${
                                    isBooked ? 'bg-red-500 text-white' : 'bg-green-100'
                                  }`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Tersedia</SelectItem>
                                    <SelectItem value="booked">Dipesan</SelectItem>
                                    <SelectItem value="maintenance">Pemeliharaan</SelectItem>
                                  </SelectContent>
                                </Select>
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
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default AdminSchedule;