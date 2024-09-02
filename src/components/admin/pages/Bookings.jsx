import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiEye, FiTrash2 } from 'react-icons/fi';

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (name),
        users (email)
      `)
      .order('created_at', { ascending: true });
    if (error) console.error('Error fetching bookings:', error);
    else setBookings(data);
  };

  const VALID_STATUSES = ['available', 'booked', 'blocked'];

  const updateBookingStatus = async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (status === 'confirmed') {
        await updateSchedule(data);
      } else if (status === 'cancelled') {
        await freeUpSchedule(data);
      }

      fetchBookings();
      toast.success(`Booking ${status} successfully`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Failed to update booking status');
    }
  };

  const updateSchedule = async (booking) => {
    try {
      if (!VALID_STATUSES.includes('booked')) {
        throw new Error('Invalid status: booked is not allowed in schedules table');
      }

      const startTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
      const endTime = parseISO(`${booking.booking_date}T${booking.end_time}`);
      let currentTime = startTime;

      while (currentTime < endTime) {
        const { error } = await supabase
          .from('schedules')
          .upsert({
            court_id: booking.court_id,
            date: format(currentTime, 'yyyy-MM-dd'),
            start_time: format(currentTime, 'HH:mm'),
            end_time: format(addHours(currentTime, 1), 'HH:mm'),
            status: 'booked'
          }, { onConflict: ['court_id', 'date', 'start_time'], ignoreDuplicates: false });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Schedule updated successfully');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error(`Failed to update schedule: ${error.message}`);
    }
  };

  const freeUpSchedule = async (booking) => {
    try {
      const startTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
      const endTime = parseISO(`${booking.booking_date}T${booking.end_time}`);
      let currentTime = startTime;

      while (currentTime < endTime) {
        const { error } = await supabase
          .from('schedules')
          .upsert({
            court_id: booking.court_id,
            date: format(currentTime, 'yyyy-MM-dd'),
            start_time: format(currentTime, 'HH:mm'),
            end_time: format(addHours(currentTime, 1), 'HH:mm'),
            status: 'available'
          }, { onConflict: ['court_id', 'date', 'start_time'], ignoreDuplicates: false });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Schedule freed up successfully');
    } catch (error) {
      console.error('Error freeing up schedule:', error);
      toast.error(`Failed to free up schedule: ${error.message}`);
    }
  };

  const deleteBooking = async (id) => {
    if (window.confirm('Are you sure you want to delete this booking?')) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .delete()
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        await freeUpSchedule(data);
        fetchBookings();
        toast.success('Booking deleted successfully');
      } catch (error) {
        console.error('Error deleting booking:', error);
        toast.error('Failed to delete booking');
      }
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Manage Bookings</h2>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Time</TableHead>
              <TableHead>Court</TableHead>
              <TableHead className="hidden md:table-cell">User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id} className="flex flex-col md:table-row">
                <TableCell className="hidden md:table-cell">{format(new Date(booking.booking_date), 'dd/MM/yyyy')}</TableCell>
                <TableCell className="hidden md:table-cell">{`${booking.start_time} - ${booking.end_time}`}</TableCell>
                <TableCell>{booking.courts.name}</TableCell>
                <TableCell className="hidden md:table-cell">{booking.users.email}</TableCell>
                <TableCell>{booking.status}</TableCell>
                <TableCell className="flex flex-wrap gap-2">
                  {booking.status === 'pending' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => updateBookingStatus(booking.id, 'confirmed')}
                    >
                      <FiCheck className="h-4 w-4" />
                    </Button>
                  )}
                  {booking.status === 'confirmed' && (
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => updateBookingStatus(booking.id, 'cancelled')}
                    >
                      <FiX className="h-4 w-4" />
                    </Button>
                  )}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedBooking(booking)}
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-md">
                      <DialogHeader>
                        <DialogTitle>Booking Details</DialogTitle>
                      </DialogHeader>
                      {selectedBooking && (
                        <div className="space-y-2">
                          <p><strong>User:</strong> {selectedBooking.users.email}</p>
                          <p><strong>Court:</strong> {selectedBooking.courts.name}</p>
                          <p><strong>Date:</strong> {format(new Date(selectedBooking.booking_date), 'dd/MM/yyyy')}</p>
                          <p><strong>Time:</strong> {`${selectedBooking.start_time} - ${selectedBooking.end_time}`}</p>
                          <p><strong>Status:</strong> {selectedBooking.status}</p>
                          <p><strong>Total Price:</strong> Rp {selectedBooking.total_price.toLocaleString()}</p>
                          {selectedBooking.proof_of_payment_url && (
                            <div>
                              <p><strong>Proof of Booking:</strong></p>
                              <img 
                                src={selectedBooking.proof_of_payment_url} 
                                alt="Proof of Booking" 
                                className="w-full h-auto mt-2 rounded-lg shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => deleteBooking(booking.id)}
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};