import React from 'react';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const ScheduleModal = ({ court, days, user, isSlotBooked, getSlotStatus, handleSlotClick }) => {
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  const getSlotColor = (status) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
        return 'bg-gray-800 text-white';
      case 'holiday':
        return 'bg-gray-600 text-white';
      case 'maintenance':
        return 'bg-gray-700 text-white';
      default:
        return 'bg-white text-gray-800 hover:bg-gray-200';
    }
  };

  const getSlotText = (status) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
        return 'Dipesan';
      case 'holiday':
        return 'Libur';
      case 'maintenance':
        return 'Perbaikan';
      default:
        return 'Tersedia';
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-gray-800 text-white hover:bg-gray-700">Lihat Jadwal</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] overflow-auto bg-gray-100">
        <DialogHeader>
          <DialogTitle className="text-gray-800">Jadwal Lapangan {court.name}</DialogTitle>
          <DialogDescription className="text-gray-600">Pilih slot yang tersedia untuk memesan</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg text-sm sm:text-base">
            <thead className="sticky top-0 bg-gray-200 z-10">
              <tr>
                <th className="p-2 sm:p-3 text-left text-gray-800">Waktu</th>
                {days.map(day => (
                  <th key={day.name} className="p-2 sm:p-3 text-left text-gray-800">
                    <div>{format(new Date(day.date), 'EEEE', { locale: id })}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{day.displayDate}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((time, index) => (
                <tr 
                  key={time}
                  className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
                >
                  <td className="p-2 sm:p-3 font-medium sticky left-0 bg-inherit text-gray-800">{time}</td>
                  {days.map(day => {
                    const status = getSlotStatus(court.id, day.date, time);
                    return (
                      <td key={`${day.name}-${time}`} className="p-1 sm:p-2">
                        <DialogClose asChild>
                          <Button 
                            variant="outline"
                            size="sm" 
                            className={`w-full text-xs sm:text-sm ${getSlotColor(status)} border border-gray-300`}
                            onClick={() => handleSlotClick(court.id, day, time)}
                            disabled={status !== 'available'}
                          >
                            {getSlotText(status)}
                          </Button>
                        </DialogClose>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleModal;