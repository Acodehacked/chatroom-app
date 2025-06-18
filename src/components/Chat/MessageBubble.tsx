import React from 'react';
import { Message } from '../../types';

interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  showAvatar: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ 
  message, 
  isOwnMessage, 
  showAvatar 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group`}>
      <div className={`flex max-w-xs lg:max-w-md ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
        {showAvatar && (
          <div className={`flex-shrink-0 ${isOwnMessage ? 'ml-3' : 'mr-3'}`}>
            {message.senderPhoto ? (
              <img
                src={message.senderPhoto}
                alt={message.senderName}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-medium">
                  {getInitials(message.senderName)}
                </span>
              </div>
            )}
          </div>
        )}
        
        <div className={`${!showAvatar ? (isOwnMessage ? 'mr-11' : 'ml-11') : ''}`}>
          {showAvatar && !isOwnMessage && (
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium text-gray-900">{message.senderName}</span>
              <span className="text-xs text-gray-500 ml-2">{formatTime(message.timestamp)}</span>
            </div>
          )}
          
          <div
            className={`px-4 py-2 rounded-2xl ${
              isOwnMessage
                ? 'bg-blue-500 text-white rounded-br-md'
                : 'bg-gray-100 text-gray-900 rounded-bl-md'
            }`}
          >
            <p className="text-sm leading-relaxed">{message.text}</p>
          </div>
          
          {showAvatar && isOwnMessage && (
            <div className="flex items-center justify-end mt-1">
              <span className="text-xs text-gray-500">{formatTime(message.timestamp)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};