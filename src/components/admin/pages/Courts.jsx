import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/services/supabaseClient';
import { FiPlus, FiEdit, FiTrash2, FiImage, FiDollarSign, FiType, FiFileText } from 'react-icons/fi';

export const Courts = () => {
  const [courts, setCourts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentCourt, setCurrentCourt] = useState({ name: '', hourly_rate: '', court_img: null, description: '' });
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      const { data, error } = await supabase.from('courts').select('*');
      if (error) throw error;
      console.log('Fetched courts:', data);
      setCourts(data);
    } catch (error) {
      console.error('Error fetching courts:', error);
      setError('Failed to fetch courts');
    }
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const uploadImage = async (file, courtId) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${courtId}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('imgcourt')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      return null;
    }
    return fileName;
  };

  const handleAddCourt = async () => {
    const { data, error } = await supabase
      .from('courts')
      .insert([{ 
        name: currentCourt.name, 
        hourly_rate: parseFloat(currentCourt.hourly_rate),
        description: currentCourt.description
      }])
      .select();

    if (error) {
      console.error('Error adding court:', error);
    } else {
      if (imageFile) {
        const fileName = await uploadImage(imageFile, data[0].id);
        if (fileName) {
          await supabase
            .from('courts')
            .update({ court_img: fileName })
            .eq('id', data[0].id);
        }
      }
      fetchCourts();
      setIsAddModalOpen(false);
      setCurrentCourt({ name: '', hourly_rate: '', court_img: null, description: '' });
      setImageFile(null);
    }
  };

  const handleUpdateCourt = async () => {
    let updateData = { 
      name: currentCourt.name, 
      hourly_rate: parseFloat(currentCourt.hourly_rate),
      description: currentCourt.description
    };

    if (imageFile) {
      const fileName = await uploadImage(imageFile, currentCourt.id);
      if (fileName) {
        updateData.court_img = fileName;
      }
    }

    const { error } = await supabase
      .from('courts')
      .update(updateData)
      .eq('id', currentCourt.id);

    if (error) {
      console.error('Error updating court:', error);
    } else {
      fetchCourts();
      setIsEditModalOpen(false);
      setImageFile(null);
    }
  };

  const handleDeleteCourt = async (courtId) => {
    const { error } = await supabase
      .from('courts')
      .delete()
      .eq('id', courtId);

    if (error) {
      console.error('Error deleting court:', error);
    } else {
      fetchCourts();
    }
  };

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Kelola Lapangan</h2>
      <Button onClick={() => setIsAddModalOpen(true)} className="mb-4 w-full sm:w-auto flex items-center justify-center gap-2">
        <FiPlus /> Tambah Lapangan Baru
      </Button>
      {courts.length === 0 ? (
        <p>Tidak ada lapangan tersedia</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead className="hidden sm:table-cell">Tarif per Jam</TableHead>
                <TableHead className="hidden sm:table-cell">Deskripsi</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courts.map((court) => (
                <TableRow key={court.id}>
                  <TableCell className="font-medium">{court.name}</TableCell>
                  <TableCell className="hidden sm:table-cell">Rp {court.hourly_rate.toLocaleString()}</TableCell>
                  <TableCell className="hidden sm:table-cell">{court.description}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2"
                        onClick={() => {
                          setCurrentCourt(court);
                          setIsEditModalOpen(true);
                        }}
                      >
                        <FiEdit className="sm:hidden" /> <span className="hidden sm:inline">Edit</span>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="flex-grow sm:flex-grow-0 flex items-center justify-center gap-2"
                        onClick={() => handleDeleteCourt(court.id)}
                      >
                        <FiTrash2 className="sm:hidden" /> <span className="hidden sm:inline">Hapus</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Tambah Lapangan Baru</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <FiType className="text-gray-500" />
              <Input
                placeholder="Nama Lapangan"
                value={currentCourt.name}
                onChange={(e) => setCurrentCourt({ ...currentCourt, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-gray-500" />
              <Input
                placeholder="Tarif per Jam"
                type="number"
                value={currentCourt.hourly_rate}
                onChange={(e) => setCurrentCourt({ ...currentCourt, hourly_rate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-gray-500" />
              <Textarea
                placeholder="Deskripsi Lapangan"
                value={currentCourt.description}
                onChange={(e) => setCurrentCourt({ ...currentCourt, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiImage className="text-gray-500" />
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddCourt} className="w-full">Tambah Lapangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Lapangan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center gap-2">
              <FiType className="text-gray-500" />
              <Input
                placeholder="Nama Lapangan"
                value={currentCourt.name}
                onChange={(e) => setCurrentCourt({ ...currentCourt, name: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiDollarSign className="text-gray-500" />
              <Input
                placeholder="Tarif per Jam"
                type="number"
                value={currentCourt.hourly_rate}
                onChange={(e) => setCurrentCourt({ ...currentCourt, hourly_rate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiFileText className="text-gray-500" />
              <Textarea
                placeholder="Deskripsi Lapangan"
                value={currentCourt.description}
                onChange={(e) => setCurrentCourt({ ...currentCourt, description: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <FiImage className="text-gray-500" />
              <Input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </div>
            {currentCourt.court_img && (
              <img 
                src={`${supabase.storage.from('imgcourt').getPublicUrl(currentCourt.court_img).data.publicUrl}`} 
                alt={`Lapangan ${currentCourt.name}`} 
                className="w-full h-48 object-cover rounded-md"
              />
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleUpdateCourt} className="w-full">Perbarui Lapangan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};