import React, { useState, useEffect } from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Button } from './ui/button';
import { FiDownload } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { marginBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#4a5568' },
  subtitle: { fontSize: 18, marginBottom: 15, color: '#718096' },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 5, color: '#2d3748' },
  text: { fontSize: 12, marginBottom: 3, color: '#4a5568' },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0, marginTop: 10 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableHeader: { backgroundColor: '#edf2f7', fontWeight: 'bold' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, marginBottom: 5, fontSize: 10 },
  footer: { position: 'absolute', bottom: 30, left: 30, right: 30, textAlign: 'center', color: '#a0aec0', fontSize: 10 }
});

// Fungsi untuk menghitung durasi dalam jam
const calculateDuration = (startTime, endTime) => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const durationMs = end - start;
  return Math.round(durationMs / (1000 * 60 * 60));
};

// Komponen PDF
const InvoicePDF = ({ booking, profile }) => {
  const duration = calculateDuration(booking.start_time, booking.end_time);
  const totalPrice = booking.courts.hourly_rate * duration;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Bukti pemesanan GOR Badminton Nandy</Text>
        </View>
        
        <Text style={styles.subtitle}>Booking #{booking.orderNumber}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Pemesan:</Text>
          <Text style={styles.text}>Nama: {profile?.full_name || 'Tidak tersedia'}</Text>
          <Text style={styles.text}>Nomor Telepon: {profile?.phone_number || 'Tidak tersedia'}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informasi Booking:</Text>
          <Text style={styles.text}>Tanggal Invoice: {new Date(booking.created_at).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.text}>Nama Lapangan: {booking.courts.name}</Text>
          <Text style={styles.text}>Tanggal Bermain: {new Date(booking.booking_date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</Text>
          <Text style={styles.text}>Waktu: {booking.start_time} - {booking.end_time}</Text>
        </View>
        
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Lapangan</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Harga per Jam</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Durasi</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Total</Text></View>
          </View>
          <View style={styles.tableRow}>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{booking.courts.name}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {booking.courts.hourly_rate.toLocaleString('id-ID')}</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>{duration} jam</Text></View>
            <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {totalPrice.toLocaleString('id-ID')}</Text></View>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={[styles.text, { fontWeight: 'bold', marginTop: 10 }]}>Total Harga: Rp {totalPrice.toLocaleString('id-ID')}</Text>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Catatan:</Text>
          <Text style={styles.text}>- Harap tiba 15 menit sebelum waktu bermain.</Text>
          <Text style={styles.text}>- Harap tunjukkan bukti pemesanan ini kepada petugas lapangan.</Text>
          <Text style={styles.text}>- Untuk pertanyaan, hubungi kami di 081234567890.</Text>
        </View>
        
        <Text style={styles.footer}>Terima kasih telah memilih layanan kami. Selamat bermain!</Text>
      </Page>
    </Document>
  );
};

const InvoiceDownload = ({ booking }) => {
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('profiles')
          .select('full_name, phone_number')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error mengambil profil:', error);
        } else {
          setProfile(data);
        }
      }
    };

    fetchProfile();
  }, []);

  if (booking.status !== 'confirmed') {
    return null;
  }

  return (
    <PDFDownloadLink
      document={<InvoicePDF booking={booking} profile={profile} />}
      fileName={`invoice_booking_${booking.orderNumber}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button
          className="bg-green-500 text-white hover:bg-green-600 transition-colors duration-300 flex items-center justify-center px-4 py-2 rounded-md shadow-md"
        >
          Unduh Riwayat Pemesanan
          <FiDownload className="ml-2" />
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default InvoiceDownload;