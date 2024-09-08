import React, { useState, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { BiSupport } from "react-icons/bi";

// Fungsi utilitas cn (className)
const cn = (...classes) => classes.filter(Boolean).join(' ');

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <SidebarContext.Provider value={{ open, setOpen, isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, className, ...props }) => {
  const { open, setOpen, isMobileMenuOpen, setIsMobileMenuOpen } = useSidebar();

  return (
    <>
      <div 
        className={cn(
          "h-screen py-4 hidden md:flex md:flex-col bg-black text-white shadow-lg transition-all duration-300",
          open ? "w-64" : "w-20",
          className
        )} 
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </div>
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="fixed top-4 right-4 z-20 p-2 bg-black text-white rounded-md"
        >
          <IconMenu2 size={24} />
        </button>
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-10 bg-black text-white p-4 overflow-y-auto"
            >
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-4 right-4 p-2"
              >
                <IconX size={24} />
              </button>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarBody = ({ children, className, ...props }) => {
  const { open } = useSidebar();
  
  return (
    <div
      className={cn("flex-1 px-4 space-y-2 flex flex-col overflow-y-auto", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const SidebarLink = ({
  link,
  className,
  onClick,
  ...props
}) => {
  const { open, setIsMobileMenuOpen } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;
  const isMobile = window.innerWidth < 768; // Tambahkan ini

  const handleClick = (e) => {
    if (onClick) {
      e.preventDefault();
      onClick(e);
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center py-2 px-3 rounded-lg transition-colors duration-200",
        isActive
          ? "bg-gray-800 text-white"
          : "text-gray-300 hover:bg-gray-800 hover:text-white",
        className
      )}
      onClick={handleClick}
      {...props}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {React.cloneElement(link.icon, { className: "w-5 h-5" })}
      </div>
      {(open || isMobile) && ( // Ubah kondisi ini
        <span className="ml-3 whitespace-nowrap">
          {link.label}
        </span>
      )}
    </Link>
  );
};

export const SidebarHeader = ({ title, icon }) => {
  const { open } = useSidebar();

  return (
    <div className="mb-8 px-4 flex items-center">
      <AnimatePresence mode="wait">
        {open ? (
          <motion.div
            key="full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center text-white"
          >
            <BiSupport className="w-6 h-6 mr-2" />
            <h1 className="text-xl font-bold">{title}</h1>
          </motion.div>
        ) : (
          <motion.div
            key="icon"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-white"
          >
            <BiSupport className="w-6 h-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

