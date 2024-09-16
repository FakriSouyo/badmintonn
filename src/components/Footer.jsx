import { Link } from 'react-router-dom';
import { FaFacebook, FaInstagram, FaTwitter, FaWhatsapp } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="bg-black text-white p-6 md:py-12 w-full">
      <div className="container max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="grid gap-2">
          <h3 className="font-semibold text-lg mb-2">Gor Nandy</h3>
          <p>Tempat bermain badminton terbaik untuk semua kalangan.</p>
        </div>
        <div className="grid gap-2">
          <h3 className="font-semibold text-lg mb-2">Tautan Cepat</h3>
          <Link to="/" className="hover:text-gray-300">Beranda</Link>
          <Link to="/about" className="hover:text-gray-300">Tentang Kami</Link>
          <Link to="/schedule" className="hover:text-gray-300">Jadwal</Link>
          <Link to="/contact" className="hover:text-gray-300">Kontak</Link>
        </div>
        <div className="grid gap-2">
          <h3 className="font-semibold text-lg mb-2">Fasilitas</h3>
          <p>Lapangan Standar Internasional</p>
          <p>Penyewaan Raket</p>
          <p>Kantin</p>
          <p>Area Parkir Luas</p>
        </div>
        <div className="grid gap-2">
          <h3 className="font-semibold text-lg mb-2">Hubungi Kami</h3>
          <p>Jl. Contoh No. 123, Kota, Provinsi</p>
          <p>Telp: (021) 1234-5678</p>
          <p>Email: info@gornandy.com</p>
          <div className="flex space-x-4 mt-2">
            <a href="#" className="hover:text-gray-300"><FaFacebook /></a>
            <a href="#" className="hover:text-gray-300"><FaInstagram /></a>
            <a href="#" className="hover:text-gray-300"><FaTwitter /></a>
            <a href="#" className="hover:text-gray-300"><FaWhatsapp /></a>
          </div>
        </div>
      </div>
      <div className="mt-8 pt-8 border-t border-gray-700 text-center text-xs">
        <p>&copy; {new Date().getFullYear()} Gor Nandy. Hak Cipta Dilindungi.</p>
      </div>
    </footer>
  );
};

export default Footer;