import React, { useState, createContext, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { IconMenu2, IconX, IconLayoutDashboard } from "@tabler/icons-react";

const cn = (...classes) => classes.filter(Boolean).join(' ');

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
}) => {
  const [openState, setOpenState] = useState(true);
  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp || setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children }) => {
  return <SidebarProvider>{children}</SidebarProvider>;
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  
  return (
    <motion.div
      className={cn(
        "h-full py-4 hidden md:flex md:flex-col bg-white dark:bg-gray-800 shadow-lg",
        className
      )}
      animate={{
        width: open ? "240px" : "80px",
      }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
      {...props}
    >
      <div className="flex items-center justify-center h-16 mb-8">
        <motion.div
          animate={{ opacity: open ? 1 : 0, scale: open ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <h1 className="text-2xl font-bold text-blue-600">Admin</h1>
        </motion.div>
        <motion.div
          animate={{ opacity: open ? 0 : 1, scale: open ? 0 : 1 }}
          transition={{ duration: 0.2 }}
          className={cn("absolute", { "pointer-events-none": open })}
        >
          <IconLayoutDashboard className="w-8 h-8 text-blue-600" />
        </motion.div>
      </div>
      <div className="flex-1 px-4 space-y-2">{children}</div>
      <button
        onClick={() => setOpen(!open)}
        className="mt-auto mx-auto mb-4 p-2 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors duration-200"
      >
        <motion.div
          animate={{ rotate: open ? 0 : 180 }}
          transition={{ duration: 0.3 }}
        >
          <IconMenu2 className="w-6 h-6 text-blue-600" />
        </motion.div>
      </button>
    </motion.div>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div className="md:hidden fixed top-0 left-0 right-0 z-20 bg-white dark:bg-gray-800 shadow-md">
        <button
          onClick={() => setOpen(true)}
          className="p-4 text-gray-600 dark:text-gray-200"
        >
          <IconMenu2 className="w-6 h-6" />
        </button>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={cn(
              "fixed inset-0 bg-white dark:bg-gray-800 z-30 p-4 flex flex-col",
              className
            )}
            {...props}
          >
            <button
              onClick={() => setOpen(false)}
              className="self-end p-2 text-gray-600 dark:text-gray-200"
            >
              <IconX className="w-6 h-6" />
            </button>
            <div className="flex-1 mt-8 space-y-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}) => {
  const { open } = useSidebar();
  const location = useLocation();
  const isActive = location.pathname === link.href;

  return (
    <Link
      to={link.href}
      className={cn(
        "flex items-center py-2 px-3 rounded-lg transition-colors duration-200",
        isActive
          ? "bg-blue-100 text-blue-600"
          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700",
        className
      )}
      {...props}
    >
      <div className="w-8 h-8 flex items-center justify-center">
        {React.cloneElement(link.icon, { className: "w-5 h-5" })}
      </div>
      {open && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "auto" }}
          exit={{ opacity: 0, width: 0 }}
          className="ml-3 whitespace-nowrap"
        >
          {link.label}
        </motion.span>
      )}
    </Link>
  );
};