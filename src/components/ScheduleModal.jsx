import React from 'react';
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { format } from 'date-fns';

const ScheduleModal = ({ court, days, user, isSlotBooked, handleSlotClick }) => {
  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ];

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">View Schedule</Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-[95vw] sm:max-w-[90vw] h-[80vh] max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Schedule for Court {court.name}</DialogTitle>
          <DialogDescription>Select an available slot to book</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-lg text-sm sm:text-base">
            <thead className="sticky top-0 bg-gray-200 z-10">
              <tr>
                <th className="p-2 sm:p-3 text-left">Time</th>
                {days.map(day => (
                  <th key={day.name} className="p-2 sm:p-3 text-left">
                    <div>{day.name.slice(0, 3)}</div>
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
                  <td className="p-2 sm:p-3 font-medium sticky left-0 bg-inherit">{time}</td>
                  {days.map(day => {
                    const isBooked = isSlotBooked(court.id, day.date, time);
                    return (
                      <td key={`${day.name}-${time}`} className="p-1 sm:p-2">
                        <DialogClose asChild>
                          <Button 
                            variant={isBooked ? "secondary" : "outline"}
                            size="sm" 
                            className={`w-full text-xs sm:text-sm ${
                              isBooked ? 'bg-red-500 text-white cursor-not-allowed' : 
                              'hover:bg-green-100'
                            }`}
                            onClick={() => !isBooked && handleSlotClick(court.id, day, time)}
                            disabled={isBooked}
                          >
                            {isBooked ? 'Booked' : 'Available'}
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