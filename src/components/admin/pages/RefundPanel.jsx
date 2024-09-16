import React, { useState, useEffect } from 'react';
import { supabase } from '@/services/supabaseClient';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import toast from 'react-hot-toast';
import { FiInfo, FiTrash2, FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export const RefundPanel = () => {
  const [refunds, setRefunds] = useState([]);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const refundsPerPage = 5;

  useEffect(() => {
    fetchRefunds();
  }, [currentPage]);

  const fetchRefunds = async () => {
    try {
      const { data, error, count } = await supabase
        .from('refunds')
        .select(`
          *,
          bookings (
            id,
            booking_date,
            start_time,
            end_time,
            total_price,
            courts (name),
            users (email)
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * refundsPerPage, currentPage * refundsPerPage - 1);

      if (error) throw error;
      console.log('Fetched refunds:', data);
      setRefunds(data);
      setTotalPages(Math.ceil(count / refundsPerPage));
    } catch (error) {
      console.error('Error fetching refunds:', error);
      toast.error('Gagal mengambil data refund');
    }
  };

  const handleRefundStatus = async (id, newStatus) => {
    try {
      const { data, error } = await supabase
        .from('refunds')
        .update({ status: newStatus })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setRefunds(refunds.map(refund => 
        refund.id === id ? { ...refund, status: newStatus } : refund
      ));

      await supabase
        .from('notifications')
        .insert({
          user_id: data.user_id,
          message: `Refund Anda telah ${newStatus === 'completed' ? 'berhasil' : 'ditolak'}.`,
          type: 'refund'
        });

      toast.success(`Status refund berhasil diubah menjadi ${newStatus}`);
    } catch (error) {
      console.error('Error updating refund status:', error);
      toast.error('Gagal mengubah status refund');
    }
  };

  const handleDeleteRefund = async (id) => {
    try {
      const { error } = await supabase
        .from('refunds')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRefunds(refunds.filter(refund => refund.id !== id));
      toast.success('Refund berhasil dihapus');
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Error deleting refund:', error);
      toast.error('Gagal menghapus refund');
    }
  };

  const RefundDetailDialog = ({ refund }) => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <FiInfo />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Detail Refund</DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-2">
          <p><strong>ID Refund:</strong> {refund.id}</p>
          <p><strong>Tanggal Pengajuan:</strong> {new Date(refund.created_at).toLocaleString()}</p>
          <p><strong>Pengguna:</strong> {refund.bookings?.users?.email}</p>
          <p><strong>Lapangan:</strong> {refund.bookings?.courts?.name}</p>
          <p><strong>Tanggal Booking:</strong> {new Date(refund.bookings?.booking_date).toLocaleDateString()}</p>
          <p><strong>Waktu Booking:</strong> {refund.bookings?.start_time} - {refund.bookings?.end_time}</p>
          <p><strong>Jumlah Refund:</strong> Rp {refund.amount.toLocaleString()}</p>
          <p><strong>Metode Refund:</strong> {refund.refund_method}</p>
          {refund.e_wallet_type && <p><strong>Tipe E-Wallet:</strong> {refund.e_wallet_type}</p>}
          <p><strong>Nomor Akun:</strong> {refund.account_number}</p>
          <p><strong>Status:</strong> {refund.status}</p>
        </div>
      </DialogContent>
    </Dialog>
  );

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
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Panel Refund</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Pengguna</TableHead>
            <TableHead>Lapangan</TableHead>
            <TableHead>Jumlah</TableHead>
            <TableHead>Metode</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {refunds.map((refund) => (
            <TableRow key={refund.id}>
              <TableCell>{new Date(refund.created_at).toLocaleDateString()}</TableCell>
              <TableCell>{refund.bookings?.users?.email}</TableCell>
              <TableCell>{refund.bookings?.courts?.name}</TableCell>
              <TableCell>Rp {refund.amount.toLocaleString()}</TableCell>
              <TableCell>{refund.refund_method}</TableCell>
              <TableCell>{refund.status}</TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <RefundDetailDialog refund={refund} />
                  {refund.status === 'pending' && (
                    <>
                      <Button onClick={() => handleRefundStatus(refund.id, 'completed')} size="sm">
                        Setujui
                      </Button>
                      <Button onClick={() => handleRefundStatus(refund.id, 'rejected')} variant="destructive" size="sm">
                        Tolak
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={() => {
                      setSelectedRefund(refund);
                      setIsDeleteDialogOpen(true);
                    }} 
                    variant="destructive" 
                    size="sm"
                  >
                    <FiTrash2 />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {renderPagination()}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Penghapusan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Apakah Anda yakin ingin menghapus refund ini? Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Batal
            </Button>
            <Button variant="destructive" onClick={() => handleDeleteRefund(selectedRefund.id)}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};