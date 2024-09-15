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
  isSlotBooked,  // Tambahkan ini
  handleSlotClick  // Tambahkan ini
}) => {
  const imageUrl = court.court_img 
    ? `${supabase.storage.from('imgcourt').getPublicUrl(court.court_img).data.publicUrl}`
    : "/api/placeholder/400/300";

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardHeader>
        <CardTitle>{court.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <img src={imageUrl} alt={`Lapangan${court.name}`} className="w-full h-48 object-cover rounded-md mb-4" />
        <p className="text-lg font-semibold">Harga: Rp {court.hourly_rate.toLocaleString('id-ID')}/jam</p>
        <p className="mt-2 text-sm">{court.description}</p>
      </CardContent>
      <CardFooter>
        <ScheduleModal 
          court={court}
          schedules={schedules}
          days={days}
          user={user}
          onBookingInitiated={onBookingInitiated}
          openAuthModal={openAuthModal}
          setSchedules={setSchedules}
          isSlotBooked={isSlotBooked}  // Teruskan ini
          handleSlotClick={handleSlotClick}  // Teruskan ini
        />
      </CardFooter>
    </Card>
  );
};

export default CourtCard;