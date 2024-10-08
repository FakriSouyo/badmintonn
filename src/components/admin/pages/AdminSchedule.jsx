import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { supabase } from '@/services/supabaseClient';
import toast from 'react-hot-toast';
import { useAuth } from '../../../contexts/AuthContext';
import { format, addDays, parseISO, addHours, isSameHour } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Eye } from 'lucide-react'; // Tambahkan impor ini
import BookingDetailModal from '../BookingDetailModal';

const AdminSchedule = () => {
  const { user } = useAuth();
  const [courts, setCourts] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [selectedSlots, setSelectedSlots] = useState({});
  const [isBulkModeActive, setIsBulkModeActive] = useState(false);
  const [bulkUpdateStatus, setBulkUpdateStatus] = useState('holiday');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedBookingInfo, setSelectedBookingInfo] = useState(null);
  const [selectedScheduleInfo, setSelectedScheduleInfo] = useState(null);

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

    const bookingSubscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, handleBookingChange)
      .subscribe();

    return () => {
      supabase.removeChannel(scheduleSubscription);
      supabase.removeChannel(bookingSubscription);
    };
  }, []);

  const handleBookingChange = async (payload) => {
    console.log('Real-time update received for bookings:', payload);
    if (payload.eventType === 'UPDATE') {
      const booking = payload.new;
      await updateScheduleWithBooking(booking);
    }
  };

  const handleScheduleChange = (payload) => {
    console.log('Real-time update received for schedules:', payload);
    fetchSchedules();
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
        .select(`
          *,
          users (
            id,
            email,
            full_name
          )
        `)
        .gte('date', startDate)
        .lte('date', endDate);
      if (error) throw error;
      console.log('Jadwal diambil:', data);
      setSchedules(data || []);
    } catch (error) {
      console.error('Kesalahan saat mengambil jadwal:', error);
      toast.error('Gagal mengambil data jadwal');
    }
  };

  const updateScheduleWithBooking = async (booking) => {
    try {
      const startTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
      const endTime = parseISO(`${booking.booking_date}T${booking.end_time}`);
      let currentTime = startTime;

      while (currentTime < endTime) {
        let scheduleStatus;
        let userName = null;

        if (booking.payment_status === 'paid' && booking.status === 'confirmed') {
          scheduleStatus = 'booked';
          userName = booking.users?.full_name || booking.users?.email;
        } else if (booking.payment_status === 'paid' && booking.status === 'pending') {
          scheduleStatus = 'pending';
          userName = booking.users?.full_name || booking.users?.email;
        } else if (booking.status === 'cancelled' || booking.status === 'finished') {
          scheduleStatus = 'available';
        } else {
          scheduleStatus = 'pending';
        }

        const { error } = await supabase
          .from('schedules')
          .upsert({
            court_id: booking.court_id,
            date: format(currentTime, 'yyyy-MM-dd'),
            start_time: format(currentTime, 'HH:mm'),
            end_time: format(addHours(currentTime, 1), 'HH:mm'),
            status: scheduleStatus,
            user_id: scheduleStatus === 'booked' || scheduleStatus === 'pending' ? booking.user_id : null,
            user_name: userName
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;
        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal berhasil diperbarui berdasarkan perubahan booking');
    } catch (error) {
      console.error('Error updating schedule with booking:', error);
      toast.error('Gagal memperbarui jadwal berdasarkan perubahan booking');
    }
  };

  const getSlotStatus = useCallback((courtId, date, time) => {
    const slotDateTime = parseISO(`${date}T${time}`);
    
    const schedule = schedules.find(schedule => 
      schedule.court_id === courtId &&
      schedule.date === date &&
      isSameHour(slotDateTime, parseISO(`${schedule.date}T${schedule.start_time}`))
    );

    if (!schedule) return { status: 'available', userName: null };
    
    let displayStatus = schedule.status;
    if (schedule.status === 'booked' || schedule.status === 'confirmed') {
      displayStatus = schedule.status;
    } else if (schedule.status === 'maintenance') {
      displayStatus = 'maintenance';
    }
    
    const userName = schedule.users?.full_name || schedule.users?.email || schedule.user_name || null;
    

    
    return {
      status: displayStatus,
      userName: userName
    };
  }, [schedules]);

  const updateScheduleStatus = async (courtId, date, time, newStatus) => {
    try {
      const startTime = time;
      const endTime = format(addHours(parseISO(`${date}T${time}`), 1), 'HH:mm');
      
      const { data: existingSchedule, error: fetchError } = await supabase
        .from('schedules')
        .select('*')
        .eq('court_id', courtId)
        .eq('date', date)
        .eq('start_time', startTime)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw fetchError;
      }

      let operation;
      if (existingSchedule) {
        operation = supabase
          .from('schedules')
          .update({ status: newStatus })
          .match({ id: existingSchedule.id });
      } else {
        operation = supabase
          .from('schedules')
          .insert({
            court_id: courtId,
            date: date,
            start_time: startTime,
            end_time: endTime,
            status: newStatus,
          });
      }

      const { data, error } = await operation;
      if (error) {
        if (error.code === '23505') {
          console.log('Schedule already exists. Attempting update...');
          const { data: updateData, error: updateError } = await supabase
            .from('schedules')
            .update({ status: newStatus })
            .match({ court_id: courtId, date: date, start_time: startTime });
          
          if (updateError) throw updateError;
          console.log('Schedule updated after conflict:', updateData);
        } else {
          throw error;
        }
      }
      
      console.log('Schedule updated successfully:', data);
      toast.success('Jadwal berhasil diperbarui');
      fetchSchedules();
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast.error(`Gagal memperbarui status jadwal: ${error.message || 'Unknown error'}`);
    }
  };

  const handleBulkModeChange = (checked) => {
    setIsBulkModeActive(checked);
    setSelectedSlots({});
  };

  const handleSlotSelect = (courtId, date, time) => {
    if (!isBulkModeActive) return;

    const slotKey = `${date}-${time}`;
    const { status } = getSlotStatus(courtId, date, time);

    if (status === 'available') {
      setSelectedSlots(prev => {
        const newSlots = { ...prev };
        if (newSlots[slotKey]) {
          delete newSlots[slotKey];
        } else {
          newSlots[slotKey] = { courtId, date, time };
        }
        return newSlots;
      });
    }
  };

  const handleBulkUpdate = async () => {
    try {
      const updates = Object.values(selectedSlots).map(({ courtId, date, time }) => ({
        court_id: courtId,
        date: date,
        start_time: time,
        end_time: format(addHours(parseISO(`${date}T${time}`), 1), 'HH:mm'),
        status: bulkUpdateStatus
      }));

      if (updates.length === 0) {
        throw new Error('Tidak ada slot yang dipilih');
      }

      const { data, error } = await supabase
        .from('schedules')
        .upsert(updates, { onConflict: ['court_id', 'date', 'start_time'] });

      if (error) throw error;

      console.log('Jadwal berhasil diperbarui:', data);
      toast.success(`Jadwal berhasil diperbarui ke status ${bulkUpdateStatus}`);
      fetchSchedules();
      setSelectedSlots({});
      setIsBulkModeActive(false);
      setIsUpdateModalOpen(false);
    } catch (error) {
      console.error('Error saat memperbarui jadwal:', error);
      toast.error(`Gagal memperbarui status jadwal: ${error.message}`);
    }
  };

  const BulkUpdateModal = () => (
    <Dialog open={isUpdateModalOpen} onOpenChange={setIsUpdateModalOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pilih Status untuk Pembaruan Massal</DialogTitle>
        </DialogHeader>
        <Select 
          value={bulkUpdateStatus} 
          onValueChange={setBulkUpdateStatus}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Pilih Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="holiday">Libur</SelectItem>
            <SelectItem value="booked">Dipesan</SelectItem>
            <SelectItem value="maintenance">Proses</SelectItem>
          </SelectContent>
        </Select>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsUpdateModalOpen(false)}>
            Batal
          </Button>
          <Button onClick={handleBulkUpdate}>
            Konfirmasi
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const handleBookingInfoClick = (courtId, date, time) => {
    setSelectedScheduleInfo({ courtId, date, time });
  };

  const getSlotContent = (status, userName, courtId, date, time) => {
    const slotText = getSlotText(status, userName);
    const eyeIcon = (status === 'booked' || status === 'confirmed' || status === 'pending') && (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleBookingInfoClick(courtId, date, time);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Lihat detail booking</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );

    return { slotText, eyeIcon };
  };

  const getSlotText = (status, userName) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
      case 'pending':
        return userName ? userName.split(' ')[0] : 'Dipesan';
      case 'holiday':
        return 'Libur';
      case 'maintenance':
        return 'Proses';
      default:
        return 'Tersedia';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <p className="text-xl font-bold mb-4 text-gray-800">Error loading schedule</p>
        <p className="mb-4 text-gray-600">{error}</p>
        <Button onClick={() => fetchData()} className="bg-gray-800 text-white hover:bg-gray-700">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="bg-white rounded-lg shadow-lg p-8"
        >
          <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">Kelola Jadwal Lapangan</h2>
          <div className="mb-6 flex justify-between items-center">
            <Select 
              value={selectedCourt} 
              onValueChange={setSelectedCourt}
            >
              <SelectTrigger className="w-64 bg-gray-50 border border-gray-300">
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id="bulk-mode"
                checked={isBulkModeActive}
                onCheckedChange={handleBulkModeChange}
              />
              <label
                htmlFor="bulk-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Pilih Status
              </label>
            </div>
          </div>
          {selectedCourt && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-semibold text-gray-600">Time</th>
                    {days.map(day => (
                      <th key={day.name} className="p-3 text-left font-semibold text-gray-600">
                        <div>{day.name.slice(0, 3)}</div>
                        <div className="text-xs text-gray-500">{day.displayDate}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timeSlots.map((time, index) => (
                    <tr key={time} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                      <td className="p-3 font-medium text-gray-800">{time}</td>
                      {days.map(day => {
                        const { status, userName } = getSlotStatus(selectedCourt, day.date, time);
                        const isSelected = !!selectedSlots[`${day.date}-${time}`];
                        const isAvailable = status === 'available';
                        const { slotText, eyeIcon } = getSlotContent(status, userName, selectedCourt, day.date, time);
                        
                        return (
                          <td key={`${day.name}-${time}`} className="p-2">
                            {isBulkModeActive ? (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => handleSlotSelect(selectedCourt, day.date, time)}
                                disabled={!isAvailable}
                                className={`mx-auto block ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                              />
                            ) : (
                              <div className="flex items-center justify-between">
                                <Select
                                  value={status}
                                  onValueChange={(value) => updateScheduleStatus(selectedCourt, day.date, time, value)}
                                >
                                  <SelectTrigger className={`w-full text-xs ${
                                    status === 'booked' ? 'bg-yellow-500 text-white' : 
                                    status === 'confirmed' ? 'bg-green-500 text-white' :
                                    status === 'maintenance' ? 'bg-red-500 text-white' :
                                    status === 'holiday' ? 'bg-blue-500 text-white' :
                                    status === 'pending' ? 'bg-orange-500 text-white' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    <SelectValue>
                                      {slotText}
                                    </SelectValue>
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="available">Tersedia</SelectItem>
                                    <SelectItem value="booked">Dipesan</SelectItem>
                                    <SelectItem value="confirmed">Terkonfirmasi</SelectItem>
                                    <SelectItem value="pending">Tertunda</SelectItem>
                                    <SelectItem value="maintenance">Proses</SelectItem>
                                    <SelectItem value="holiday">Libur</SelectItem>
                                  </SelectContent>
                                </Select>
                                {eyeIcon}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {isBulkModeActive && Object.keys(selectedSlots).length > 0 && (
            <div className="mt-4 flex justify-end">
              <Button onClick={() => setIsUpdateModalOpen(true)} className="bg-black text-white hover:bg-gray-700">
                Perbarui {Object.keys(selectedSlots).length} slot
              </Button>
            </div>
          )}
          <BulkUpdateModal />
          <BookingDetailModal
            isOpen={!!selectedScheduleInfo}
            onClose={() => setSelectedScheduleInfo(null)}
            scheduleInfo={selectedScheduleInfo}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default AdminSchedule;