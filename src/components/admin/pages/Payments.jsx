import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/services/supabaseClient';
import { format, parseISO, addHours } from 'date-fns';
import { FiInfo, FiTrash2, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';
import * as XLSX from 'xlsx';

export const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [selectedPayment, setSelectedPayment] = useState(null);

  useEffect(() => {
    fetchPayments();
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

  const updatePaymentStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ payment_status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      fetchPayments();
      toast.success(`Status pembayaran berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Gagal mengubah status pembayaran');
    }
  };

  const updateBookingAndSchedule = async (booking) => {
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
            status: 'confirmed',
            user_id: booking.user_id
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal berhasil diperbarui');
    } catch (error) {
      console.error('Error updating schedule:', error);
      toast.error('Gagal memperbarui jadwal');
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
            status: 'pending',
            user_id: null
          }, { onConflict: ['court_id', 'date', 'start_time'] });

        if (error) throw error;

        currentTime = addHours(currentTime, 1);
      }

      console.log('Jadwal berhasil dibebaskan');
    } catch (error) {
      console.error('Error freeing up schedule:', error);
      toast.error('Gagal membebaskan jadwal');
    }
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
        <Button onClick={downloadExcel} className="flex items-center gap-2">
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
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id} className="flex flex-col md:table-row">
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
                    <SelectTrigger className="w-[180px]">
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
                <TableCell className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setSelectedPayment(payment)}
                        title="Detail"
                      >
                        <FiInfo className="h-4 w-4" />
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
                          <p><strong>Status:</strong> {selectedPayment.payment_status}</p>
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
                    size="icon"
                    onClick={() => deletePayment(payment.id)}
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
    </div>
  );
};