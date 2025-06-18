import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ChatRoom } from '../../types';
import { Plus, Hash, Users, MessageCircle } from 'lucide-react';

interface RoomListProps {
  selectedRoom: string | null;
  onRoomSelect: (roomId: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ selectedRoom, onRoomSelect }) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomDescription, setNewRoomDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser } = useAuth();

  useEffect(() => {
    const q = query(collection(db, 'rooms'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const roomsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        lastMessage: doc.data().lastMessage ? {
          ...doc.data().lastMessage,
          timestamp: doc.data().lastMessage.timestamp?.toDate() || new Date()
        } : undefined
      })) as ChatRoom[];
      setRooms(roomsData);
    });

    return unsubscribe;
  }, []);

  const createRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newRoomName.trim()) return;

    setLoading(true);
    try {
      const roomData = {
        name: newRoomName.trim(),
        description: newRoomDescription.trim(),
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
        participantCount: 0,
        isPublic: true
      };

      await addDoc(collection(db, 'rooms'), roomData);
      setNewRoomName('');
      setNewRoomDescription('');
      setShowCreateRoom(false);
    } catch (error) {
      console.error('Error creating room:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-white border-r border-gray-200 h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <MessageCircle className="w-5 h-5 mr-2 text-blue-500" />
            Chat Rooms
          </h2>
          <button
            onClick={() => setShowCreateRoom(true)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
            title="Create new room"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showCreateRoom && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <form onSubmit={createRoom} className="space-y-3">
            <input
              type="text"
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="Room name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
            <input
              type="text"
              value={newRoomDescription}
              onChange={(e) => setNewRoomDescription(e.target.value)}
              placeholder="Room description (optional)"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-500 text-white py-2 px-3 rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm"
              >
                {loading ? 'Creating...' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateRoom(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded-lg hover:bg-gray-400 transition-colors text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="flex-1 overflow-y-auto">
        {rooms.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <Hash className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No rooms yet</p>
            <p className="text-sm">Create one to get started!</p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => onRoomSelect(room.id)}
                className={`w-full text-left p-3 rounded-lg transition-colors ${
                  selectedRoom === room.id
                    ? 'bg-blue-50 border-blue-200 border'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <Hash className="w-4 h-4 text-gray-400 mr-1 flex-shrink-0" />
                      <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                    </div>
                    {room.description && (
                      <p className="text-sm text-gray-500 truncate mt-1">{room.description}</p>
                    )}
                    {room.lastMessage && (
                      <div className="text-sm text-gray-500 truncate mt-1">
                        <span className="font-medium">{room.lastMessage.senderName}:</span>{' '}
                        {room.lastMessage.text}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end ml-2">
                    <div className="flex items-center text-gray-400 text-xs">
                      <Users className="w-3 h-3 mr-1" />
                      {room.participantCount}
                    </div>
                    {room.lastMessage && (
                      <span className="text-xs text-gray-400 mt-1">
                        {formatTime(room.lastMessage.timestamp)}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};