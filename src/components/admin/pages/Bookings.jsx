import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import { FiEye, FiTrash2, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const createNotification = async (userId, bookingId, message, type) => {
  try {
    console.log('Creating notification:', { userId, bookingId, message, type });
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, booking_id: bookingId, message, type });

    if (error) throw error;
    console.log('Notification created successfully:', data);
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

export const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const bookingsPerPage = 5;

  useEffect(() => {
    fetchBookings();
  }, [currentPage]);

  const fetchBookings = async () => {
    const { data, error, count } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (name),
        users (email)
      `, { count: 'exact' })
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * bookingsPerPage, currentPage * bookingsPerPage - 1);

    if (error) {
      console.error('Error fetching bookings:', error);
      toast.error('Gagal mengambil data pemesanan');
    } else {
      setBookings(data || []);
      setTotalPages(Math.ceil(count / bookingsPerPage));
    }
  };

  const updateBookingStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id)
        .select('*, users(id), courts(name)')
        .single();
  
      if (error) throw error;
  
      if (newStatus === 'confirmed') {
        await updateAdminAndUserSchedule(data, newStatus);
      } else {
        // Untuk status 'pending', 'cancelled', 'finished', atau status lainnya
        await updateAdminAndUserSchedule(data, newStatus);
      }
  
      // Buat notifikasi untuk pengguna
      let statusIndonesia = '';
      switch (newStatus) {
        case 'confirmed':
          statusIndonesia = 'dikonfirmasi';
          break;
        case 'pending':
          statusIndonesia = 'ditunda';
          break;
        case 'cancelled':
          statusIndonesia = 'dibatalkan';
          break;
        case 'finished':
          statusIndonesia = 'telah selesai';
          break;
        default:
          statusIndonesia = newStatus;
      }
      const bookingCode = data.id.toString().padStart(4, '0');
      const message = `Status Pemesanan #${bookingCode} telah ${statusIndonesia}.`;
      await createNotification(data.users.id, data.id, message, 'booking');
  
      fetchBookings();
      toast.success(`Status pemesanan berhasil diubah menjadi ${statusIndonesia}`);
    } catch (error) {
      console.error('Error updating booking status:', error);
      toast.error('Gagal mengubah status pemesanan');
    }
  };

  const updateAdminAndUserSchedule = async (booking, newStatus) => {
    try {
      const startTime = parseISO(`${booking.booking_date}T${booking.start_time}`);
      const endTime = parseISO(`${booking.booking_date}T${booking.end_time}`);
      let currentTime = startTime;

      while (currentTime < endTime) {
        const scheduleStatus = mapBookingStatusToScheduleStatus(newStatus);
        const { error } = await supabase
          .from('schedules')
          .upsert({
            court_id: booking.court_id,
            date: format(currentTime, 'yyyy-MM-dd'),
            start_time: format(currentTime, 'HH:mm'),
            end_time: format(addHours(currentTime, 1), 'HH:mm'),
            status: scheduleStatus,
            user_id: newStatus === 'confirmed' ? booking.user_id : null
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal admin dan pengguna berhasil diperbarui');
    } catch (error) {
      console.error('Error updating admin and user schedule:', error);
      toast.error('Gagal memperbarui jadwal admin dan pengguna');
    }
  };

  const mapBookingStatusToScheduleStatus = (bookingStatus) => {
    switch (bookingStatus) {
      case 'confirmed':
        return 'booked';
      case 'cancelled':
      case 'finished':
        return 'available';
      default:
        return 'pending';
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

      // Ubah jadwal menjadi tersedia setelah penghapusan
      await updateAdminAndUserSchedule(data, 'available');
      fetchBookings();
      toast.success('Pemesanan berhasil dihapus');
    } catch (error) {
      console.error('Error deleting booking:', error);
      toast.error('Gagal menghapus pemesanan');
    }
    setIsDeleteDialogOpen(false);
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

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(
        <Button
          key={i}
          onClick={() => handlePageChange(i)}
          variant={currentPage === i ? "default" : "outline"}
          size="sm"
          className="mx-1"
        >
          {i}
        </Button>
      );
    }

    return (
      <div className="flex justify-center items-center mt-4">
        <Button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          variant="outline"
          size="sm"
          className="mr-2"
        >
          <FiChevronLeft />
        </Button>
        {pageNumbers}
        <Button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          variant="outline"
          size="sm"
          className="ml-2"
        >
          <FiChevronRight />
        </Button>
      </div>
    );
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Pemesanan</h2>
      <div className="mb-4">
        <Button onClick={downloadExcel} className="w-full sm:w-auto flex items-center justify-center gap-2">
          <FiDownload /> Download Excel
        </Button>
      </div>
      {bookings.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="w-full">
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Waktu</TableHead>
                <TableHead>Lapangan</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium sm:hidden">Tanggal:</span>
                      {format(new Date(booking.booking_date), 'dd/MM/yyyy')}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium sm:hidden">Waktu:</span>
                      {`${booking.start_time} - ${booking.end_time}`}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium sm:hidden">Lapangan:</span>
                      {booking.courts.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row">
                      <span className="font-medium sm:hidden">Pengguna:</span>
                      {booking.users.email}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row items-center">
                      <span className="font-medium sm:hidden mr-2">Status:</span>
                      <Select
                        onValueChange={(value) => updateBookingStatus(booking.id, value)}
                        defaultValue={booking.status}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Status Pemesanan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="finished">Finished</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                            title="Detail"
                            className="w-full sm:w-auto flex items-center justify-center gap-2"
                          >
                            <FiEye className="sm:hidden" /> <span className="hidden sm:inline">Detail</span>
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
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setBookingToDelete(booking);
                          setIsDeleteDialogOpen(true);
                        }}
                        title="Hapus"
                        className="w-full sm:w-auto flex items-center justify-center gap-2"
                      >
                        <FiTrash2 className="sm:hidden" /> <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="text-center text-gray-500 my-4">Tidak ada pemesanan yang sudah dibayar.</p>
      )}
      {renderPagination()}
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