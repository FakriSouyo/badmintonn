import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import emailjs from 'emailjs-com';
import { toast, Toaster } from 'react-hot-toast';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  useEffect(() => {
    emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading('Mengirim pesan...');
    try {
      // Kirim email utama
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formData
      );

      // Kirim auto-reply
      await emailjs.send(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_AUTO_REPLY_TEMPLATE_ID,
        {
          to_name: formData.name,
          to_email: formData.email,
          from_name: "Gor Badminton Nandy", // Tambahkan ini
          message: formData.message,
          date: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
          phone_number: "(021) 1234-5678"
        }
      );

      toast.success('Pesan berhasil dikirim!', { id: loadingToast });
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error(error);
      toast.error('Gagal mengirim pesan. Silakan coba lagi.', { id: loadingToast });
    }
  };

  return (
    <section id="contact" className="min-h-screen flex items-center justify-center bg-gray-100">
      <Toaster position="top-center" reverseOrder={false} />
      <div className="container px-4 md:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8 text-gray-900">Hubungi Kami</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Kirim Pesan</h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <Input id="name" placeholder="Nama Anda" className="bg-white" value={formData.name} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input id="email" type="email" placeholder="Email Anda" className="bg-white" value={formData.email} onChange={handleChange} required />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Pesan</label>
                  <Textarea id="message" placeholder="Pesan Anda" rows={4} className="bg-white" value={formData.message} onChange={handleChange} required />
                </div>
                <Button type="submit" className="w-full bg-black text-white hover:bg-gray-800">Kirim Pesan</Button>
              </form>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Informasi Kontak</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>Alamat:</strong> Jl. Bibis Raya Kembaran RT 07, Kasih, Tamantirto, Kec. Kasihan, Kabupaten Bantul, Daerah Istimewa Yogyakarta 55184</p>
                <p><strong>Telepon:</strong> (021) 1234-5678</p>
                <p><strong>Email:</strong> info@gorbadmintonnandy.com</p>
                <p><strong>Jam Operasional:</strong> Senin - Minggu: 06.00 - 22.00 WIB</p>
                <p><strong>Harga Sewa:</strong><br />06.00 - 17.00: Rp 50.000/jam<br />17.00 - 22.00: Rp 55.000/jam</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;