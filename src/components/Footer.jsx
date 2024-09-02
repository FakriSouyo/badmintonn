import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-muted p-6 md:py-12 w-full">
      <div className="container max-w-7xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 text-sm">
        <div className="grid gap-1">
          <h3 className="font-semibold">Company</h3>
          <Link to="/about">About Us</Link>
          <Link to="/team">Our Team</Link>
          <Link to="/careers">Careers</Link>
          <Link to="/news">News</Link>
        </div>
        <div className="grid gap-1">
          <h3 className="font-semibold">Facilities</h3>
          <Link to="/courts">Courts</Link>
          <Link to="/amenities">Amenities</Link>
          <Link to="/directions">Directions</Link>
          <Link to="/hours">Hours</Link>
        </div>
        {/* Add more columns as needed */}
      </div>
    </footer>
  );
};

export default Footer;