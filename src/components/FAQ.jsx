  import React from 'react';
  import { motion } from 'framer-motion';
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./ui/accordion";

  const FAQ = () => {
    const faqs = [
      {
        question: "Bagaimana cara memesan lapangan badminton?",
        answer: "Untuk memesan lapangan badminton, cukup pilih tanggal dan waktu yang Anda inginkan di kalender, pilih lapangan yang tersedia, dan isi formulir pemesanan dengan informasi Anda. Kami akan mengirimkan konfirmasi setelah pemesanan Anda selesai."
      },
      {
        question: "Berapa tarif sewa lapangan?",
        answer: "Tarif sewa lapangan kami mulai dari Rp200.000 per jam untuk lapangan standar, Rp250.000 per jam untuk lapangan premium, dan Rp300.000 per jam untuk lapangan VIP. Diskon mungkin tersedia untuk pemesanan yang lebih lama atau sewa kelompok."
      },
      {
        question: "Bisakah saya membatalkan atau menjadwalkan ulang pemesanan saya?",
        answer: "Ya, Anda dapat membatalkan atau menjadwalkan ulang pemesanan Anda hingga 24 jam sebelum waktu yang dijadwalkan. Mungkin ada biaya pembatalan kecil, tetapi kami akan berusaha sebaik mungkin untuk mengakomodasi perubahan pada pemesanan Anda."
      },
      {
        question: "Apakah Anda menyediakan peralatan?",
        answer: "Ya, kami memiliki sejumlah terbatas raket badminton dan kok yang tersedia untuk disewa dengan biaya tambahan. Anda juga dipersilakan untuk membawa peralatan Anda sendiri."
      },
      {
        question: "Apakah ada pilihan keanggotaan yang tersedia?",
        answer: "Ya, kami menawarkan berbagai paket keanggotaan yang memberikan manfaat seperti prioritas pemesanan, tarif diskon, dan akses ke acara eksklusif. Silakan hubungi meja depan kami untuk informasi lebih lanjut tentang pilihan keanggotaan saat ini."
      }
    ];

    return (
      <section id="faq" className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="container px-4 md:px-6 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8 text-gray-900">Pertanyaan yang Sering Diajukan</h2>
            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
                    <AccordionContent>{faq.answer}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </motion.div>
        </div>
      </section>
    );
  };

  export default FAQ;