import React, { useState } from 'react';
import { Header } from './Header';
import { RoomList } from '../Chat/RoomList';
import { ChatRoom } from '../Chat/ChatRoom';

export const MainLayout: React.FC = () => {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string>('');

  const handleRoomSelect = (roomId: string, roomName?: string) => {
    setSelectedRoom(roomId);
    if (roomName) {
      setSelectedRoomName(roomName);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        <div className="w-80 flex-shrink-0 hidden md:block">
          <RoomList 
            selectedRoom={selectedRoom} 
            onRoomSelect={(roomId) => {
              // We'll get the room name from the RoomList component
              handleRoomSelect(roomId);
            }} 
          />
        </div>
        
        <div className="flex-1 flex">
          <ChatRoom 
            roomId={selectedRoom || ''} 
            roomName={selectedRoomName || selectedRoom || ''} 
          />
        </div>
      </div>
    </div>
  );
};