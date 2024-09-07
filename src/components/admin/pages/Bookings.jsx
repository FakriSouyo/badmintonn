import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import { FiEye, FiTrash2, FiCheck, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);

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
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal mengambil data pemesanan');
    } else {
      setBookings(data);
    }
  };

  const confirmBooking = async (booking) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', booking.id)
        .select()
        .single();

      if (error) throw error;

      await updateScheduleToBooked(data);
      
      fetchBookings();
      toast.success('Pemesanan berhasil dikonfirmasi dan jadwal diperbarui');
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Gagal mengkonfirmasi pemesanan');
    }
  };

  const updateScheduleToBooked = async (booking) => {
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
            status: 'booked',
            user_id: booking.user_id
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal berhasil diperbarui menjadi dipesan');
    } catch (error) {
      console.error('Error updating schedule to booked:', error);
      toast.error('Gagal memperbarui jadwal menjadi dipesan');
    }
  };

  const deleteBooking = async (id) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      await updateScheduleToAvailable(data);
      fetchBookings();
      toast.success('Pemesanan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Gagal menghapus pemesanan');
    }
    setIsDeleteDialogOpen(false);
  };

  const updateScheduleToAvailable = async (booking) => {
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
            status: 'available',
            user_id: null
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal berhasil diperbarui menjadi tersedia');
    } catch (error) {
      console.error('Error updating schedule to available:', error);
      toast.error('Gagal memperbarui jadwal menjadi tersedia');
    }
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(bookings.map(booking => ({
      Tanggal: format(new Date(booking.booking_date), 'dd/MM/yyyy'),
      Waktu: `${booking.start_time} - ${booking.end_time}`,
      Lapangan: booking.courts.name,
      Pengguna: booking.users.email,
      Status: booking.status,
      TotalHarga: booking.total_price
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Bookings");
    XLSX.writeFile(workbook, "bookings.xlsx");
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Pemesanan</h2>
      <div className="mb-4">
        <Button onClick={downloadExcel} className="flex items-center gap-2">
          <FiDownload /> Download Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Tanggal</TableHead>
              <TableHead className="hidden md:table-cell">Waktu</TableHead>
              <TableHead>Lapangan</TableHead>
              <TableHead className="hidden md:table-cell">Pengguna</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
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
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedBooking(booking)}
                        title="Detail"
                      >
                        <FiEye className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="w-full max-w-md">
                      <DialogHeader>
                        <DialogTitle>Detail Pemesanan</DialogTitle>
                      </DialogHeader>
                      {selectedBooking && (
                        <div className="space-y-2">
                          <p><strong>Pengguna:</strong> {selectedBooking.users.email}</p>
                          <p><strong>Lapangan:</strong> {selectedBooking.courts.name}</p>
                          <p><strong>Tanggal:</strong> {format(new Date(selectedBooking.booking_date), 'dd/MM/yyyy')}</p>
                          <p><strong>Waktu:</strong> {`${selectedBooking.start_time} - ${selectedBooking.end_time}`}</p>
                          <p><strong>Status:</strong> {selectedBooking.status}</p>
                          <p><strong>Total Harga:</strong> Rp {selectedBooking.total_price.toLocaleString()}</p>
                          {selectedBooking.proof_of_payment_url && (
                            <div>
                              <p><strong>Bukti Pembayaran:</strong></p>
                              <img 
                                src={selectedBooking.proof_of_payment_url} 
                                alt="Bukti Pembayaran" 
                                className="w-full h-auto mt-2 rounded-lg shadow-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  {booking.status !== 'confirmed' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmBooking(booking)}
                      title="Konfirmasi"
                    >
                      <FiCheck className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => {
                      setBookingToDelete(booking);
                      setIsDeleteDialogOpen(true);
                    }}
                    title="Hapus"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus pemesanan ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => deleteBooking(bookingToDelete.id)}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};