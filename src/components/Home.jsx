import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Link } from 'react-scroll';

const Home = () => {
  return (
    <section id="home" className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="container px-4 md:px-6">
        <div className="grid max-w-[1300px] mx-auto gap-8 px-4 sm:px-6 md:px-10 md:grid-cols-2 md:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left"
          >
            <h1 className="lg:leading-tighter text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl xl:text-6xl text-gray-900">
              Pesan Lapangan Badminton Anda Hari Ini
            </h1>
            <p className="mt-4 max-w-[700px] text-lg text-gray-600 md:text-xl">
              Dengan mudah reservasi lapangan badminton dan nikmati permainan seru bersama teman atau keluarga.
            </p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-6"
            >
              <Link 
                to="schedule" 
                smooth={true}  
                duration={500} 
                className="inline-block text-lg px-6 py-3 bg-gray-900 rounded-md text-white hover:bg-gray-800 cursor-pointer transition-colors duration-300"
              >
                Pesan Lapangan
              </Link>
            </motion.div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mt-8 md:mt-0"
          >
            <img
              src="/placeholder.svg"
              width="1270"
              height="300"
              alt="Lapangan Badminton"
              className="w-full aspect-[3/2] md:aspect-[3/1] overflow-hidden rounded-xl object-cover shadow-xl"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Home;