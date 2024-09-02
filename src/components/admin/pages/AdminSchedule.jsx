import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/services/supabaseClient';
import { format, addDays, parseISO, addHours } from 'date-fns';
import toast from 'react-hot-toast';

export const AdminSchedule = () => {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookings, setBookings] = useState([]);

  const VALID_STATUSES = ['booked', 'available']; // Sesuaikan dengan constraint di database Anda

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
  ];

  useEffect(() => {
    fetchCourts();

    // Set up realtime subscription
    const subscription = supabase
      .channel('schedule-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, handleRealtimeUpdate)
      .subscribe();

    // Clean up subscription on component unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      fetchSchedulesAndBookings();
    }
  }, [selectedCourt, selectedDate]);

  const handleRealtimeUpdate = (payload) => {
    console.log('Realtime update received:', payload);
    // Refresh schedules when there's an update
    fetchSchedulesAndBookings();
  };

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('courts').select('*');
      if (error) throw error;
      console.log('Courts fetched:', data);
      setCourts(data);
      if (data.length > 0) setSelectedCourt(data[0].id);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setError('Failed to fetch courts');
      toast.error('Gagal mengambil data lapangan');
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedulesAndBookings = async () => {
    try {
      setLoading(true);
      const startDate = format(selectedDate, 'yyyy-MM-dd');
      const endDate = format(addDays(selectedDate, 6), 'yyyy-MM-dd');

      console.log('Fetching schedules and bookings with params:', { selectedCourt, startDate, endDate });

      const [schedulesResponse, bookingsResponse] = await Promise.all([
        supabase
          .from('schedules')
          .select('*')
          .eq('court_id', selectedCourt)
          .gte('date', startDate)
          .lte('date', endDate),
        supabase
          .from('bookings')
          .select('*')
          .eq('court_id', selectedCourt)
          .gte('booking_date', startDate)
          .lte('booking_date', endDate)
      ]);

      if (schedulesResponse.error) throw schedulesResponse.error;
      if (bookingsResponse.error) throw bookingsResponse.error;

      console.log('Schedules fetched:', schedulesResponse.data);
      console.log('Bookings fetched:', bookingsResponse.data);
      setSchedules(schedulesResponse.data);
      setBookings(bookingsResponse.data);
    } catch (error) {
      console.error('Error fetching schedules and bookings:', error);
      setError('Failed to fetch schedules and bookings');
      toast.error('Gagal mengambil data jadwal dan pemesanan');
    } finally {
      setLoading(false);
    }
  };

  const getSlotStatus = (date, time) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const schedule = schedules.find(s => s.date === formattedDate && s.start_time === time);
    if (schedule) return schedule.status;
    return 'available';
  };

  const days = [...Array(7)].map((_, index) => {
    const date = addDays(selectedDate, index);
    return {
      date: date,
      displayDate: format(date, 'd MMM'),
      dayName: format(date, 'EEEE')
    };
  });

  const updateSlotStatus = async (date, time, currentStatus) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const endTime = format(addHours(parseISO(`${formattedDate}T${time}`), 1), 'HH:mm');

    try {
      const newStatus = currentStatus === 'booked' ? 'available' : 'booked';

      const { data, error } = await supabase
        .from('schedules')
        .upsert({
          court_id: selectedCourt,
          date: formattedDate,
          start_time: time,
          end_time: endTime,
          status: newStatus
        }, { onConflict: ['court_id', 'date', 'start_time'] });

      if (error) throw error;

      // Update local state immediately
      setSchedules(prevSchedules => {
        const updatedSchedules = [...prevSchedules];
        const index = updatedSchedules.findIndex(s => 
          s.court_id === selectedCourt && s.date === formattedDate && s.start_time === time
        );
        if (index !== -1) {
          updatedSchedules[index].status = newStatus;
        } else {
          updatedSchedules.push({
            court_id: selectedCourt,
            date: formattedDate,
            start_time: time,
            end_time: endTime,
            status: newStatus
          });
        }
        return updatedSchedules;
      });

      toast.success(`Status slot diperbarui menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating slot status:', error);
      toast.error(`Gagal memperbarui status slot: ${error.message}`);
    }
  };

  const handleSlotClick = (date, time, status) => {
    setSelectedSlot({ date, time, status });
  };

  const SlotStatusDialog = () => (
    <Dialog open={!!selectedSlot} onOpenChange={() => setSelectedSlot(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Perbarui Status Slot</DialogTitle>
          <DialogDescription>
            Ubah status slot waktu ini.
          </DialogDescription>
        </DialogHeader>
        {selectedSlot && (
          <div>
            <p>Tanggal: {format(selectedSlot.date, 'dd/MM/yyyy')}</p>
            <p>Waktu: {selectedSlot.time}</p>
            <p>Status Saat Ini: {selectedSlot.status}</p>
            {selectedSlot.status === 'booked' && (
              <p className="text-red-500">Peringatan: Mengubah status slot yang sudah dipesan akan membatalkan pemesanan yang ada.</p>
            )}
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => {
            if (selectedSlot) {
              updateSlotStatus(selectedSlot.date, selectedSlot.time, selectedSlot.status);
              setSelectedSlot(null);
            }
          }} className="mt-4">
            Ubah Status
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manajemen Jadwal Lapangan</h2>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <strong className="font-bold">Error:</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}
      {loading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4">Loading...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <Select onValueChange={(value) => setSelectedCourt(value)} value={selectedCourt}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Pilih lapangan" />
              </SelectTrigger>
              <SelectContent>
                {courts.map((court) => (
                  <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex space-x-2">
              <Button onClick={() => setSelectedDate(addDays(selectedDate, -7))} className="flex-1">Minggu Sebelumnya</Button>
              <Button onClick={() => setSelectedDate(addDays(selectedDate, 7))} className="flex-1">Minggu Selanjutnya</Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="sticky left-0 bg-white z-10">Waktu</TableHead>
                  {days.map((day) => (
                    <TableHead key={day.date.toISOString()} className="min-w-[100px]">
                      <div className="text-sm">{day.dayName}</div>
                      <div>{day.displayDate}</div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSlots.map((time) => (
                  <TableRow key={time}>
                    <TableCell className="sticky left-0 bg-white z-10">{time}</TableCell>
                    {days.map((day) => {
                      const status = getSlotStatus(day.date, time);
                      return (
                        <TableCell
                          key={`${day.date.toISOString()}-${time}`}
                          className={`cursor-pointer ${
                            status === 'booked' ? 'bg-red-100' : 'bg-green-100'
                          }`}
                          onClick={() => handleSlotClick(day.date, time, status)}
                        >
                          {status === 'booked' ? 'Dipesan' : 'Tersedia'}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
      <SlotStatusDialog />
    </div>
  );
};