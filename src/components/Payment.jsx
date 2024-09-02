import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiUpload } from 'react-icons/fi';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

const Payment = ({ isOpen, onClose, bookingId, totalAmount }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);

  const paymentMethods = [
    { id: 1, name: 'Transfer Bank' },
    { id: 2, name: 'QRIS' },
    { id: 3, name: 'Bayar di Tempat' },
  ];

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      try {
        const fileName = `${bookingId}_${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('buktibyr')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl }, error: urlError } = supabase.storage
          .from('buktibyr')
          .getPublicUrl(fileName);
        
        if (urlError) throw urlError;

        setProofOfPayment(publicUrl);
        toast.success('Bukti pembayaran berhasil diunggah');
      } catch (error) {
        console.error('Error mengunggah bukti pembayaran:', error);
        toast.error('Gagal mengunggah bukti pembayaran');
      }
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Silakan pilih metode pembayaran');
      return;
    }

    if (selectedMethod !== 'Bayar di Tempat' && !proofOfPayment) {
      toast.error('Silakan unggah bukti pembayaran');
      return;
    }

    try {
      const { error: updateError } = await supabase
        .from('bookings')
        .update({
          payment_method: selectedMethod,
          payment_status: selectedMethod === 'Bayar di Tempat' ? 'pending' : 'paid',
          proof_of_payment_url: proofOfPayment
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      toast.success('Pembayaran berhasil diproses');
      onClose();
    } catch (error) {
      console.error('Kesalahan pembayaran:', error);
      toast.error(`Gagal memproses pembayaran: ${error.message || 'Kesalahan tidak diketahui'}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Pembayaran</h2>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <FiX size={24} />
              </button>
            </div>
            <div className="mb-4">
              <p className="font-semibold">Total: Rp {totalAmount.toLocaleString()}</p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pilih Metode Pembayaran:
              </label>
              <Select onValueChange={setSelectedMethod} value={selectedMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih metode pembayaran" />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map((method) => (
                    <SelectItem key={method.id} value={method.name}>
                      {method.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedMethod && selectedMethod !== 'Bayar di Tempat' && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Upload Bukti Pembayaran:</h3>
                <div className="flex items-center justify-center w-full">
                  <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 overflow-hidden">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full h-full">
                      {proofOfPayment ? (
                        <img src={proofOfPayment} alt="Bukti Pembayaran" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <FiUpload className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Klik untuk unggah</span> atau seret dan lepas
                          </p>
                          <p className="text-xs text-gray-500">PNG, JPG atau GIF (MAKS. 800x400px)</p>
                        </>
                      )}
                    </div>
                    <input
                      id="dropzone-file"
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>
            )}

            <Button
              onClick={handlePayment}
              className="w-full"
              disabled={selectedMethod !== 'Bayar di Tempat' && !proofOfPayment}
            >
              Bayar Sekarang
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Payment;