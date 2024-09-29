import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { supabase } from '../services/supabaseClient';
import toast from 'react-hot-toast';
import { FiDollarSign, FiCreditCard, FiSmartphone, FiShoppingBag, FiCoffee, FiTruck } from 'react-icons/fi';

const Refund = ({ booking, onClose, onRefundSubmitted }) => {
  const [refundMethod, setRefundMethod] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [eWalletType, setEWalletType] = useState('');
  const [bankType, setBankType] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const refundData = {
        booking_id: booking.id,
        user_id: booking.user_id,
        amount: booking.total_price,
        refund_method: refundMethod,
        account_number: accountNumber,
        status: 'pending'
      };

      if (refundMethod === 'e_wallet') {
        refundData.e_wallet_type = eWalletType;
      } else if (refundMethod === 'bank_transfer') {
        refundData.bank_type = bankType;
      }

      const { data, error } = await supabase
        .from('refunds')
        .insert(refundData)
        .select()
        .single();

      if (error) throw error;

      toast.success('Permintaan refund berhasil diajukan', {
        icon: '✅',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
      onRefundSubmitted(data);
      onClose();
    } catch (error) {
      console.error('Error submitting refund:', error);
      toast.error('Gagal mengajukan refund', {
        icon: '❌',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const renderAccountInput = () => {
    switch (refundMethod) {
      case 'bank_transfer':
        return (
          <>
            <Select onValueChange={setBankType} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih Bank" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bca">
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2" /> BCA
                  </div>
                </SelectItem>
                <SelectItem value="mandiri">
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2" /> Mandiri
                  </div>
                </SelectItem>
                <SelectItem value="bni">
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2" /> BNI
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 mt-2">
              <FiCreditCard className="text-gray-400" />
              <Input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nomor Rekening"
                required
              />
            </div>
          </>
        );
      case 'e_wallet':
        return (
          <>
            <Select onValueChange={setEWalletType} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih E-Wallet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="shopeepay">
                  <div className="flex items-center">
                    <FiShoppingBag className="mr-2" /> ShopeePay
                  </div>
                </SelectItem>
                <SelectItem value="dana">
                  <div className="flex items-center">
                    <FiCoffee className="mr-2" /> DANA
                  </div>
                </SelectItem>
                <SelectItem value="gopay">
                  <div className="flex items-center">
                    <FiTruck className="mr-2" /> GoPay
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center space-x-2 mt-2">
              <FiSmartphone className="text-gray-400" />
              <Input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Nomor Telepon E-Wallet"
                required
              />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Ajukan Refund</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Metode Refund</label>
            <Select onValueChange={setRefundMethod} required>
              <SelectTrigger>
                <SelectValue placeholder="Pilih metode refund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center">
                    <FiCreditCard className="mr-2" /> Transfer Bank
                  </div>
                </SelectItem>
                <SelectItem value="e_wallet">
                  <div className="flex items-center">
                    <FiSmartphone className="mr-2" /> E-Wallet
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          {renderAccountInput()}
          <div className="flex items-center space-x-2">
            <FiDollarSign className="text-gray-400" />
            <Input
              type="text"
              value={booking.total_price.toLocaleString()}
              readOnly
              className="bg-gray-100"
            />
          </div>
          <Button type="submit" className="w-full">Ajukan Refund</Button>
        </form>
        <Button onClick={onClose} variant="outline" className="w-full mt-4">Batal</Button>
      </div>
    </motion.div>
  );
};

export default Refund;