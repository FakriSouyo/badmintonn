import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO, addDays, startOfWeek, addHours, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/services/supabaseClient';
import { toast } from 'react-toastify';

export const AdminSchedule = () => {
  const [courts, setCourts] = useState([]);
  const [selectedCourt, setSelectedCourt] = useState(null);
  const [schedules, setSchedules] = useState({});
  const [currentWeekStart, setCurrentWeekStart] = useState(startOfWeek(new Date()));

    useEffect(() => {
    fetchCourts();
    const schedulesSubscription = supabase
      .channel('public:schedules')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedules' }, handleScheduleChange)
      .subscribe();

    return () => {
      supabase.removeChannel(schedulesSubscription);
    };
  }, []);

  useEffect(() => {
    if (selectedCourt) {
      fetchSchedules();
    }
  }, [selectedCourt, currentWeekStart]);

  const handleScheduleChange = useCallback((payload) => {
    console.log('Schedule change received:', payload);
    setSchedules(prevSchedules => {
      const newSchedule = payload.new;
      const key = `${newSchedule.court_id}-${newSchedule.date}-${newSchedule.start_time}`;
      return { ...prevSchedules, [key]: newSchedule };
    });
  }, []);

  const fetchCourts = async () => {
    const { data, error } = await supabase.from('courts').select('*');
    if (error) {
      console.error('Error fetching courts:', error);
      toast.error('Gagal mengambil data lapangan');
    } else {
      setCourts(data);
      if (data.length > 0 && !selectedCourt) {
        setSelectedCourt(data[0].id);
      }
    }
  };

  const fetchSchedules = async () => {
    if (!selectedCourt) return;

    const weekEnd = addDays(currentWeekStart, 6);
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('court_id', selectedCourt)
      .gte('date', format(currentWeekStart, 'yyyy-MM-dd'))
      .lte('date', format(weekEnd, 'yyyy-MM-dd'));

    if (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Gagal mengambil data jadwal');
    } else {
      const schedulesMap = {};
      data.forEach(schedule => {
        const key = `${schedule.court_id}-${schedule.date}-${schedule.start_time}`;
        schedulesMap[key] = schedule;
      });
      setSchedules(schedulesMap);
    }
  };

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

      console.log('Schedule updated in database:', data[0]);
      const key = `${courtId}-${date}-${startTime}`;
      setSchedules(prevSchedules => ({
        ...prevSchedules,
        [key]: data[0]
      }));
      toast.success('Jadwal berhasil diperbarui');
    } catch (error) {
      console.error('Error updating schedule status:', error);
      toast.error('Gagal memperbarui status jadwal');
    }
  };

  const renderTimeSlots = () => {
    const timeSlots = [];
    for (let i = 6; i < 22; i++) {
      timeSlots.push(`${i.toString().padStart(2, '0')}:00`);
    }
    return timeSlots;
  };

  const renderWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(currentWeekStart, i);
      return (
        <th key={i} className="px-4 py-2 border">
          {format(day, 'EEE dd/MM')}
        </th>
      );
    });
  };

  const getScheduleForSlot = (date, time) => {
    const key = `${selectedCourt}-${format(date, 'yyyy-MM-dd')}-${time}`;
    return schedules[key] || { status: 'available' };
  };

  const renderScheduleGrid = () => {
    return renderTimeSlots().map((time) => (
      <tr key={time}>
        <td className="px-4 py-2 border font-semibold">{time}</td>
        {Array.from({ length: 7 }, (_, dayOffset) => {
          const date = addDays(currentWeekStart, dayOffset);
          const formattedDate = format(date, 'yyyy-MM-dd');
          const schedule = getScheduleForSlot(date, time);
          return (
            <td key={`${formattedDate}-${time}`} className="px-4 py-2 border">
              <Select
                value={schedule.status}
                onValueChange={(value) => updateScheduleStatus(selectedCourt, formattedDate, time, value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </td>
          );
        })}
      </tr>
    ));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Jadwal Lapangan</h2>
      <div className="mb-4">
        <Select value={selectedCourt} onValueChange={setSelectedCourt}>
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
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-2">
        <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, -7))} className="w-full sm:w-auto">
          Minggu Sebelumnya
        </Button>
        <span className="font-semibold text-center">
          {format(currentWeekStart, 'dd/MM/yyyy')} - {format(addDays(currentWeekStart, 6), 'dd/MM/yyyy')}
        </span>
        <Button onClick={() => setCurrentWeekStart(addDays(currentWeekStart, 7))} className="w-full sm:w-auto">
          Minggu Selanjutnya
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Waktu</th>
              {renderWeekDays()}
            </tr>
          </thead>
          <tbody>
            {renderScheduleGrid()}
          </tbody>
        </table>
      </div>
    </div>
  );
};