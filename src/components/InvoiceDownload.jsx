import React from 'react';
import { PDFDownloadLink, Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { Button } from './ui/button';
import { FiDownload } from 'react-icons/fi';

// Definisikan styles untuk PDF
const styles = StyleSheet.create({
  page: { padding: 30 },
  title: { fontSize: 24, marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 10 },
  text: { fontSize: 12, marginBottom: 5 },
  table: { display: 'table', width: 'auto', borderStyle: 'solid', borderWidth: 1, borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: 'auto', flexDirection: 'row' },
  tableCol: { width: '25%', borderStyle: 'solid', borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCell: { margin: 'auto', marginTop: 5, fontSize: 10 }
});

// Komponen PDF
const InvoicePDF = ({ booking }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Invoice</Text>
      <Text style={styles.subtitle}>Booking #{booking.orderNumber}</Text>
      <View style={styles.text}>
        <Text>Tanggal: {new Date(booking.created_at).toLocaleDateString()}</Text>
        <Text>Lapangan: {booking.courts.name}</Text>
        <Text>Tanggal Booking: {new Date(booking.booking_date).toLocaleDateString()}</Text>
        <Text>Waktu: {booking.start_time} - {booking.end_time}</Text>
        <Text>Total Harga: Rp {booking.total_price.toLocaleString()}</Text>
      </View>
      <View style={styles.table}>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Item</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Harga per Jam</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Durasi</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Total</Text></View>
        </View>
        <View style={styles.tableRow}>
          <View style={styles.tableCol}><Text style={styles.tableCell}>{booking.courts.name}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {booking.courts.hourly_rate.toLocaleString()}</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>1 jam</Text></View>
          <View style={styles.tableCol}><Text style={styles.tableCell}>Rp {booking.total_price.toLocaleString()}</Text></View>
        </View>
      </View>
    </Page>
  </Document>
);

const InvoiceDownload = ({ booking }) => {
  if (booking.status !== 'confirmed') {
    return null;
  }

  return (
    <PDFDownloadLink
      document={<InvoicePDF booking={booking} />}
      fileName={`invoice_booking_${booking.orderNumber}.pdf`}
    >
      {({ blob, url, loading, error }) => (
        <Button
          disabled={loading}
          className="bg-green-50 text-green-600 hover:bg-green-100 border-green-200"
        >
          {loading ? 'Loading document...' : 'Unduh Invoice'}
          <FiDownload className="ml-2" />
        </Button>
      )}
    </PDFDownloadLink>
  );
};

export default InvoiceDownload;