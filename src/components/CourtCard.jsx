import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '../services/supabaseClient';
import ScheduleModal from './ScheduleModal';

const CourtCard = ({ 
  court, 
  schedules, 
  days, 
  user, 
  onBookingInitiated, 
  openAuthModal, 
  setSchedules,
  isSlotBooked,
  getSlotStatus,  
  handleSlotClick
}) => {
  const imageUrl = court.court_img 
    ? `${supabase.storage.from('imgcourt').getPublicUrl(court.court_img).data.publicUrl}`
    : "/api/placeholder/400/300";

  return (
    <Card className="w-full max-w-sm mx-auto overflow-hidden">
      <CardHeader className="p-0">
        <img src={imageUrl} alt={`Lapangan ${court.name}`} className="w-full h-48 object-cover" />
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-xl mb-2">{court.name}</CardTitle>
        <div className="bg-gray-100 rounded-lg p-3 mb-3">
          <p className="text-lg font-semibold text-green-600">
            Rp {court.hourly_rate.toLocaleString('id-ID')}<span className="text-sm text-gray-600">/jam</span>
          </p>
        </div>
        <p className="text-sm text-gray-600 line-clamp-3">{court.description}</p>
      </CardContent>
      <CardFooter className="bg-gray-50 p-4">
        <ScheduleModal 
          court={court}
          schedules={schedules}
          days={days}
          user={user}
          onBookingInitiated={onBookingInitiated}
          openAuthModal={openAuthModal}
          setSchedules={setSchedules}
          isSlotBooked={isSlotBooked}
          getSlotStatus={getSlotStatus}  
          handleSlotClick={handleSlotClick}
        />
      </CardFooter>
    </Card>
  );
};

export default CourtCard;