import React, { useState, useEffect, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  increment
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { Message } from '../../types';
import { MessageBubble } from './MessageBubble';
import { Send, Hash } from 'lucide-react';

interface ChatRoomProps {
  roomId: string;
  roomName: string;
}

export const ChatRoom: React.FC<ChatRoomProps> = ({ roomId, roomName }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { currentUser, userProfile } = useAuth();

  useEffect(() => {
    if (!roomId) return;

    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data() as any,
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }))
        .filter(message => message.roomId === roomId) as Message[];
      
      setMessages(messagesData);
    });

    // Update participant count when entering room
    const roomRef = doc(db, 'rooms', roomId);
    updateDoc(roomRef, {
      participantCount: increment(1)
    });

    return () => {
      unsubscribe();
      // Update participant count when leaving room
      updateDoc(roomRef, {
        participantCount: increment(-1)
      });
    };
  }, [roomId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !userProfile) return;

    setLoading(true);
    const messageText = newMessage.trim();
    setNewMessage('');

    try {
      const messageData = {
        text: messageText,
        senderId: currentUser.uid,
        senderName: userProfile.displayName,
        senderPhoto: userProfile.photoURL ?? '',
        roomId,
        timestamp: serverTimestamp(),
        reactions: {}
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update room's last message
      const roomRef = doc(db, 'rooms', roomId);
      await updateDoc(roomRef, {
        lastMessage: {
          text: messageText,
          senderName: userProfile.displayName,
          timestamp: serverTimestamp()
        }
      });
    } catch (error) {
      console.error('Error sending message:', error);
      setNewMessage(messageText); // Restore message on error
    } finally {
      setLoading(false);
    }
  };

  if (!roomId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Hash className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">Select a chat room</h3>
          <p className="text-gray-500">Choose a room from the sidebar to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <Hash className="w-5 h-5 text-gray-400 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">{roomName}</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isConsecutive = 
              index > 0 && 
              messages[index - 1].senderId === message.senderId &&
              (message.timestamp.getTime() - messages[index - 1].timestamp.getTime()) < 300000; // 5 minutes

            return (
              <MessageBubble
                key={message.id}
                message={message}
                isOwnMessage={message.senderId === currentUser?.uid}
                showAvatar={!isConsecutive}
              />
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message #${roomName}`}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !newMessage.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};