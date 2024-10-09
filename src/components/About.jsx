import React from 'react';
import { motion } from 'framer-motion';
import playerbg from '../assets/player.jpeg';
import lapanganbg from '../assets/images.jpeg';
import peralatanbg from '../assets/racket.jpg';
import bolabg from '../assets/shtlck.jpg';

const About = () => {
  return (
    <section id="about" className="min-h-screen flex items-center justify-center bg-white">
      <div className="container px-4 md:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-left mb-8 text-gray-900">Tentang Kami</h2>
              <p className="text-base sm:text-lg text-gray-600">
                Kami berkomitmen untuk menyediakan fasilitas badminton terbaik bagi pemain dari semua tingkatan. Lapangan dan peralatan modern kami memastikan Anda mendapatkan pengalaman terbaik setiap kali bermain.
              </p>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">Misi Kami</h3>
                <p className="text-sm sm:text-base text-gray-600">
                  Mempromosikan olahraga badminton dan menyediakan lingkungan yang ramah bagi pemain untuk meningkatkan keterampilan dan menikmati permainan.
                </p>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-semibold mb-2 text-gray-800">Fasilitas Kami</h3>
                <ul className="list-disc list-inside text-sm sm:text-base text-gray-600 space-y-1">
                  <li>6 lapangan kelas profesional</li>
                  <li>Sistem pencahayaan berkualitas tinggi</li>
                  <li>Ruang ganti dan kamar mandi nyaman</li>
                  <li>Toko pro dengan penyewaan dan penjualan peralatan</li>
                  <li>Area lounge untuk bersantai antar permainan</li>
                </ul>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-8 md:mt-0">
              <motion.div
                className="relative w-full h-0 pb-[100%] overflow-hidden rounded-lg shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <img
                  src={lapanganbg}
                  alt="Lapangan Badminton"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80"></div>
              </motion.div>
              <motion.div
                className="relative w-full h-0 pb-[100%] overflow-hidden rounded-lg shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <img
                  src={playerbg}
                  alt="Pemain"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80"></div>
              </motion.div>
              <motion.div
                className="relative w-full h-0 pb-[100%] overflow-hidden rounded-lg shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <img
                  src={peralatanbg}
                  alt="Peralatan"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80"></div>
              </motion.div>
              <motion.div
                className="relative w-full h-0 pb-[100%] overflow-hidden rounded-lg shadow-md"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <img
                  src={bolabg}
                  alt="Area Lounge"
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/80"></div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default About;