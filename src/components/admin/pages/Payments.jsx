import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import { FiInfo, FiTrash2, FiDownload, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
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

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const paymentsPerPage = 5;

  useEffect(() => {
    fetchPayments();
    subscribeToBookingChanges();
  }, [currentPage]);

  const fetchPayments = async () => {
    const { data, error, count } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (name),
        users (email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage - 1);

    if (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal mengambil data pembayaran');
    } else {
      const updatedData = data.map(booking => ({
        ...booking,
        payment_status: booking.payment_status || 'pending'
      }));
      setPayments(updatedData);
      setTotalPages(Math.ceil(count / paymentsPerPage));
    }
  };

  const subscribeToBookingChanges = () => {
    const subscription = supabase
      .channel('public:bookings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, handleBookingChange)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  const handleBookingChange = (payload) => {
    console.log('Booking change received:', payload);
    if (payload.eventType === 'UPDATE') {
      setPayments(prevPayments => 
        prevPayments.map(payment => 
          payment.id === payload.new.id ? { ...payment, ...payload.new } : payment
        )
      );
    }
  };

  const updatePaymentStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: newStatus
        })
        .eq('id', id)
        .select('*, users(id)')
        .single();

      if (error) throw error;

      // Jika pembayaran menjadi 'paid' dan status pemesanan sudah 'confirmed', buat notifikasi
      if (newStatus === 'paid' && data.status === 'confirmed') {
        const bookingCode = data.id.toString().padStart(4, '0');
        const message = `Pembayaran untuk Pemesanan #${bookingCode} telah dikonfirmasi dan pemesanan siap digunakan.`;
        await createNotification(data.users.id, data.id, message, 'payment');
      }

      fetchPayments();
      toast.success(`Status pembayaran berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal mengubah status pembayaran');
    }
  };

  const mapPaymentStatusToBookingStatus = (paymentStatus) => {
    switch (paymentStatus) {
      case 'paid':
        return 'confirmed';
      case 'cancelled':
        return 'cancelled';
      case 'failed':
        return 'cancelled';
      default:
        return 'pending';
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

  const deletePayment = async (id) => {
    try {
      // Pertama, periksa apakah pembayaran masih ada
      const { data: existingPayment, error: checkError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        if (checkError.code === 'PGRST116') {
          // Pembayaran tidak ditemukan, mungkin sudah dihapus
          toast.info('Pembayaran tidak ditemukan atau sudah dihapus');
          fetchPayments(); // Refresh daftar pembayaran
          return;
        }
        throw checkError;
      }

      // Jika pembayaran ditemukan, lanjutkan dengan penghapusan
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Pembayaran berhasil dihapus');
      fetchPayments(); // Refresh daftar pembayaran
    } catch (error) {
      console.error('Error deleting payment:', error);
      toast.error('Gagal menghapus pembayaran: ' + error.message);
    }
    setIsDeleteDialogOpen(false);
  };

  const downloadExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(payments.map(payment => ({
      Tanggal: format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm'),
      Pengguna: payment.users.email,
      Lapangan: payment.courts.name,
      Jumlah: payment.total_price,
      MetodePembayaran: payment.payment_method,
      Status: payment.payment_status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payments");
    XLSX.writeFile(workbook, "payments.xlsx");
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
      <h2 className="text-2xl font-bold mb-4">Kelola Pembayaran</h2>
      <div className="mb-4">
        <Button onClick={downloadExcel} className="w-full sm:w-auto flex items-center justify-center gap-2">
          <FiDownload /> Download Excel
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="hidden md:table-cell">Tanggal</TableHead>
              <TableHead>Pengguna</TableHead>
              <TableHead className="hidden md:table-cell">Lapangan</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead className="hidden md:table-cell">Metode Pembayaran</TableHead>
              <TableHead>Status Pembayaran</TableHead>
              <TableHead className="hidden md:table-cell">Status Pemesanan</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="hidden md:table-cell">{format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm')}</TableCell>
                <TableCell>{payment.users.email}</TableCell>
                <TableCell className="hidden md:table-cell">{payment.courts.name}</TableCell>
                <TableCell>Rp {payment.total_price.toLocaleString()}</TableCell>
                <TableCell className="hidden md:table-cell">{payment.payment_method}</TableCell>
                <TableCell>
                  <Select
                    onValueChange={(value) => updatePaymentStatus(payment.id, value)}
                    defaultValue={payment.payment_status}
                  >
                    <SelectTrigger className="w-full md:w-[180px]">
                      <SelectValue placeholder="Status Pembayaran" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Tetunda</SelectItem>
                      <SelectItem value="paid">Dibayar</SelectItem>
                      <SelectItem value="cancelled">Dibatalkan</SelectItem>
                      <SelectItem value="failed">Gagal</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="hidden md:table-cell">{payment.status}</TableCell>
                <TableCell>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedPayment(payment)}
                          title="Detail"
                          className="w-full md:w-auto flex items-center justify-center gap-2"
                        >
                          <FiInfo className="md:hidden" /> <span className="hidden md:inline">Detail</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="w-full max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-2xl font-bold mb-4">Detail Pembayaran</DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                          <div className="space-y-4">
                            <div className="bg-gray-100 p-4 rounded-lg">
                              <h3 className="text-lg font-semibold mb-2">Informasi Umum</h3>
                              <p><span className="font-medium">Pengguna:</span> {selectedPayment.users.email}</p>
                              <p><span className="font-medium">Lapangan:</span> {selectedPayment.courts.name}</p>
                              <p><span className="font-medium">Tanggal:</span> {format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm')}</p>
                            </div>
                            <div className="bg-gray-100 p-4 rounded-lg">
                              <h3 className="text-lg font-semibold mb-2">Detail Pembayaran</h3>
                              <p><span className="font-medium">Jumlah:</span> Rp {selectedPayment.total_price.toLocaleString()}</p>
                              <p><span className="font-medium">Metode Pembayaran:</span> {selectedPayment.payment_method}</p>
                              <p><span className="font-medium">Status Pembayaran:</span> <span className={`font-bold ${selectedPayment.payment_status === 'paid' ? 'text-green-600' : 'text-red-600'}`}>{selectedPayment.payment_status}</span></p>
                              <p><span className="font-medium">Status Pemesanan:</span> {selectedPayment.status}</p>
                            </div>
                            {selectedPayment.proof_of_payment_url && (
                              <div className="bg-gray-100 p-4 rounded-lg">
                                <h3 className="text-lg font-semibold mb-2">Bukti Pembayaran</h3>
                                <img 
                                  src={selectedPayment.proof_of_payment_url} 
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
                        setPaymentToDelete(payment);
                        setIsDeleteDialogOpen(true);
                      }}
                      title="Hapus"
                      className="w-full md:w-auto flex items-center justify-center gap-2"
                    >
                      <FiTrash2 className="md:hidden" /> <span className="hidden md:inline">Hapus</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {renderPagination()}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus pembayaran ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => deletePayment(paymentToDelete.id)}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};