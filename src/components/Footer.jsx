import React from 'react';
import { Facebook, Twitter, Youtube, Instagram } from 'lucide-react'; // Import social media icons

const Footer = () => (
  <footer className="bg-gray-900 text-gray-300 mt-auto font-inter shadow-inner pt-10 pb-6"> {/* Darker background, font, padding */}
    <div className="container mx-auto px-6 py-8"> {/* Consistent padding */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-10"> {/* Adjusted grid, increased gap */}
        {/* About Section */}
        

        {/* Help Section */}
        

        {/* Contact Info (New Section) */}
        <div className="col-span-2 md:col-span-1"> {/* Spans 2 columns on mobile, 1 on desktop */}
          <h4 className="font-bold text-lg text-white mb-4 uppercase tracking-wider">CONTACT</h4>
          <p className="text-sm mb-2">VijayNagar, Sangli</p>
          <p className="text-sm mb-2">Maharashtra, India -416416</p>
          <p className="text-sm">Phone: 7028307934</p>
        </div>
      </div>

      {/* Copyright Section */}
      <div className="border-t border-gray-700 pt-6 text-center text-sm text-gray-500"> {/* Adjusted padding, darker text */}
        <p>&copy; {new Date().getFullYear()} RD Panshop All Rights Reserved.</p>
        <p className="mt-1">Developed by AJ </p> {/* Optional: Add your design credit */}
      </div>
    </div>
  </footer>
);

export default Footer;
