import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from '@/services/supabaseClient';
import { format } from 'date-fns';

const BookingDetailModalUser = ({ isOpen, onClose, scheduleInfo, user }) => {
  const [bookingDetail, setBookingDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && scheduleInfo) {
      fetchBookingDetail();
    }
  }, [isOpen, scheduleInfo]);

  const fetchBookingDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          start_time,
          end_time,
          status,
          payment_status,
          total_price,
          courts (name)
        `)
        .eq('court_id', scheduleInfo.courtId)
        .eq('booking_date', scheduleInfo.date)
        .lte('start_time', scheduleInfo.time)
        .gt('end_time', scheduleInfo.time)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setBookingDetail(data);
    } catch (error) {
      console.error('Error fetching booking detail:', error);
      setError('Gagal mengambil detail booking');
    } finally {
      setLoading(false);
    }
  };

  const getSimplifiedId = (id) => {
    return id ? id.slice(0, 4).toUpperCase() : '';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold mb-4">Detail Pemesanan Anda</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="text-center">Memuat data...</div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : bookingDetail ? (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-lg">
              <p><span className="font-medium">ID Pesanan:</span> {getSimplifiedId(bookingDetail.id)}</p>
              <p><span className="font-medium">Lapangan:</span> {bookingDetail.courts.name}</p>
              <p><span className="font-medium">Tanggal:</span> {format(new Date(bookingDetail.booking_date), 'dd/MM/yyyy')}</p>
              <p><span className="font-medium">Waktu:</span> {bookingDetail.start_time} - {bookingDetail.end_time}</p>
              <p><span className="font-medium">Status Pemesanan:</span> <span className={`font-bold ${bookingDetail.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`}>{bookingDetail.status}</span></p>
              <p><span className="font-medium">Status Pembayaran:</span> <span className={`font-bold ${bookingDetail.payment_status === 'paid' ? 'text-green-600' : 'text-yellow-600'}`}>{bookingDetail.payment_status}</span></p>
              <p><span className="font-medium">Total Harga:</span> Rp {bookingDetail.total_price.toLocaleString()}</p>
            </div>
          </div>
        ) : (
          <div className="text-center">Tidak ada data booking ditemukan</div>
        )}
        <DialogFooter>
          <Button onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BookingDetailModalUser;