import React, { useState } from 'react';
import { MessengerSidebar } from './MessengerSidebar.tsx';
import { ChatArea } from './ChatArea.tsx';
import { StoryViewerModal } from './StoryViewerModal.tsx';
import { GKStory } from '../../types/gkChat.ts';
import { gkMessengerService } from '../../services/gkMessengerService.ts';

interface GKChatToolProps {
  onStartVoiceSession?: () => void;
}

export function GKChatTool({ onStartVoiceSession }: GKChatToolProps) {
  const [activeChatId, setActiveChatId] = useState<string>(() =>
    gkMessengerService.getActiveChatId()
  );
  const [selectedStory, setSelectedStory] = useState<GKStory | null>(null);
  // On mobile: true = in conversation, false = in chat list
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const handleSelectChat = (id: string) => {
    setActiveChatId(id);
    gkMessengerService.setActiveChatId(id);
    setIsMobileChatOpen(true);
  };

  const handleBackToSidebar = () => {
    setIsMobileChatOpen(false);
  };

  return (
    <div className="w-full h-full flex-1 min-h-0 max-w-7xl mx-auto flex flex-col rounded-2xl sm:rounded-3xl overflow-hidden border border-cyan-500/25 bg-[#030712] shadow-2xl relative">
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar: Visible on desktop, or on mobile when not viewing a chat */}
        <div
          className={`h-full ${
            isMobileChatOpen ? 'hidden md:flex' : 'flex w-full md:w-auto'
          }`}
        >
          <MessengerSidebar
            activeChatId={activeChatId}
            onSelectChat={handleSelectChat}
            onOpenStoryModal={(story) => setSelectedStory(story)}
          />
        </div>

        {/* Active Chat Window: Visible on desktop, or on mobile when chat is open */}
        <div
          className={`flex-1 h-full ${
            !isMobileChatOpen ? 'hidden md:flex' : 'flex'
          }`}
        >
          <ChatArea
            chatId={activeChatId}
            onBackToSidebar={handleBackToSidebar}
            onStartVoiceCall={onStartVoiceSession}
          />
        </div>
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <StoryViewerModal
          initialStory={selectedStory}
          onClose={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
}

export default GKChatTool;
