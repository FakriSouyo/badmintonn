import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/services/supabaseClient';
import { format } from 'date-fns';
import { FiCheck, FiInfo, FiTrash2 } from 'react-icons/fi';

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
      .order('created_at', { ascending: true });
    if (error) console.error('Error fetching payments:', error);
    else setPayments(data);
  };

  const confirmPayment = async (id) => {
    const { error } = await supabase
      .from('bookings')
      .update({ payment_status: 'confirmed' })
      .eq('id', id);
    if (error) console.error('Error confirming payment:', error);
    else {
      fetchPayments();
      await updateBookingAndSchedule(id);
    }
  };

  const deletePayment = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus pembayaran ini?')) {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      if (error) console.error('Error deleting payment:', error);
      else fetchPayments();
    }
  };

  const updateBookingAndSchedule = async (bookingId) => {
    // ... (kode ini tetap sama seperti sebelumnya)
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Pembayaran</h2>
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
                <TableCell>{payment.payment_status}</TableCell>
                <TableCell className="flex flex-wrap gap-2">
                  {payment.payment_status === 'pending' && (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => confirmPayment(payment.id)}
                      title="Konfirmasi"
                    >
                      <FiCheck className="h-4 w-4" />
                    </Button>
                  )}
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
                          {selectedPayment.payment_status === 'pending' && (
                            <Button
                              onClick={() => {
                                confirmPayment(selectedPayment.id);
                                setSelectedPayment(null);
                              }}
                              className="w-full mt-4"
                            >
                              Konfirmasi Pembayaran
                            </Button>
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