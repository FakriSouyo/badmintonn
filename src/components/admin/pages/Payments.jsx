import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import { FiInfo, FiTrash2, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

const createNotification = async (userId, message, type) => {
  try {
    console.log('Creating notification:', { userId, message, type });
    const { data, error } = await supabase
      .from('notifications')
      .insert({ user_id: userId, message, type });

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

  useEffect(() => {
    fetchPayments();
    subscribeToBookingChanges();
  }, []);

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (name),
        users (email)
      `)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching payments:', error);
      toast.error('Gagal mengambil data pembayaran');
    } else {
      // Set default payment status to 'pending' if not set
      const updatedData = data.map(booking => ({
        ...booking,
        payment_status: booking.payment_status || 'pending'
      }));
      setPayments(updatedData);
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
      // Perbarui status pembayaran dan status pemesanan sekaligus
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          payment_status: newStatus,
          status: mapPaymentStatusToBookingStatus(newStatus)
        })
        .eq('id', id)
        .select()
        .single();
  
      if (error) throw error;
  
      // Buat notifikasi untuk pengguna
      let statusIndonesia = '';
      switch (newStatus) {
        case 'paid':
          statusIndonesia = 'dikonfirmasi';
          break;
        case 'pending':
          statusIndonesia = 'ditunda';
          break;
        case 'cancelled':
          statusIndonesia = 'dibatalkan';
          break;
        case 'failed':
          statusIndonesia = 'gagal';
          break;
        default:
          statusIndonesia = newStatus;
      }
      const message = `Pembayaran pemesanan Anda telah ${statusIndonesia}.`;
      await createNotification(data.user_id, message, 'payment');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal mengubah status pembayaran dan pemesanan');
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
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
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
                          <DialogTitle>Detail Pembayaran</DialogTitle>
                        </DialogHeader>
                        {selectedPayment && (
                          <div className="space-y-2">
                            <p><strong>Pengguna:</strong> {selectedPayment.users.email}</p>
                            <p><strong>Lapangan:</strong> {selectedPayment.courts.name}</p>
                            <p><strong>Jumlah:</strong> Rp {selectedPayment.total_price.toLocaleString()}</p>
                            <p><strong>Metode Pembayaran:</strong> {selectedPayment.payment_method}</p>
                            <p><strong>Status Pembayaran:</strong> {selectedPayment.payment_status}</p>
                            <p><strong>Status Pemesanan:</strong> {selectedPayment.status}</p>
                            <p><strong>Tanggal:</strong> {format(new Date(selectedPayment.created_at), 'dd/MM/yyyy HH:mm')}</p>
                            {selectedPayment.proof_of_payment_url && (
                              <div>
                                <p><strong>Bukti Pembayaran:</strong></p>
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