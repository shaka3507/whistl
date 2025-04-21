import React from 'react';
import { Header } from '@/components/header'; // Adjust the import path as needed
import { ChatAgent } from '@/components/chat-agent';

const ChatAgentPage = () => {
  return (
    <div className="flex flex-col">
      <Header />
      <div className="flex-grow flex flex-col h-full bottom-2">
        <ChatAgent />
      </div>
    </div>
  );
};

export default ChatAgentPage;
