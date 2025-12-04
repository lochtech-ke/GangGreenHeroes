/**
 * Chatbot Widget Component
 * Floating chat button that opens the chat interface
 */

import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { ChatInterface } from './ChatInterface';
import { ChatContext } from '../../types/aiCompanion.types';

interface ChatbotWidgetProps {
  context?: ChatContext;
  position?: 'bottom-right' | 'bottom-left';
}

export const ChatbotWidget: React.FC<ChatbotWidgetProps> = ({
  context,
  position = 'bottom-right'
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionClasses = position === 'bottom-right' 
    ? 'bottom-6 right-6' 
    : 'bottom-6 left-6';

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed ${positionClasses} w-96 h-[600px] z-50 shadow-2xl rounded-lg overflow-hidden`}
        >
          <ChatInterface context={context} />
        </div>
      )}

      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed ${positionClasses} ${
          isOpen ? 'w-14 h-14' : 'w-16 h-16'
        } bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all z-50 ${
          isOpen ? 'translate-y-[-620px]' : ''
        }`}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-8 h-8" />
        )}
      </button>

      {/* Notification Badge (optional) */}
      {!isOpen && (
        <div className={`fixed ${positionClasses} translate-x-10 -translate-y-10 z-50`}>
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
        </div>
      )}
    </>
  );
};
