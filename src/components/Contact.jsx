import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";

const Contact = () => {
  return (
    <section id="contact" className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="container px-4 md:px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-center mb-8 text-gray-900">Contact Us</h2>
          <div className="grid md:grid-cols-2 gap-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Get in Touch</h3>
              <form className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <Input id="name" placeholder="Your name" className="bg-white" />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input id="email" type="email" placeholder="Your email" className="bg-white" />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <Textarea id="message" placeholder="Your message" rows={4} className="bg-white" />
                </div>
                <Button type="submit" className="w-full bg-gray-900 text-white hover:bg-gray-800">Send Message</Button>
              </form>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="bg-white p-6 rounded-lg shadow-md"
            >
              <h3 className="text-2xl font-semibold mb-4 text-gray-800">Contact Information</h3>
              <div className="space-y-2 text-gray-600">
                <p><strong>Address:</strong> 123 Badminton Street, Sportsville, SP 12345</p>
                <p><strong>Phone:</strong> (123) 456-7890</p>
                <p><strong>Email:</strong> info@badmintonbooking.com</p>
                <p><strong>Hours:</strong> Monday - Friday: 8am - 10pm<br />Saturday - Sunday: 9am - 9pm</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default Contact;