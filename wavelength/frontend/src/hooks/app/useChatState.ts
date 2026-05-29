import { useState, useEffect, useCallback } from 'react';
import type { ChatConversation, ChatPeer, IncomingChatRequest, NearbyUser } from '../../types';
import type { ChatCallbacks } from '../useSocket';

type ConvMap = Map<string, ChatConversation>;

export function useChatState(registerCallbacks: (cbs: ChatCallbacks) => void) {
  const [conversations, setConversations] = useState<ConvMap>(() => new Map<string, ChatConversation>());
  const [openChatId, setOpenChatId]       = useState<string | null>(null);
  const [incomingRequest, setIncomingRequest] = useState<IncomingChatRequest | null>(null);

  useEffect(() => {
    registerCallbacks({
      onChatRequest: (from) => setIncomingRequest({ from, timestamp: Date.now() }),

      onChatAccepted: (from) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          m.set(from.id, { peer: from, messages: m.get(from.id)?.messages ?? [], unread: 0, state: 'active' });
          return m;
        });
        setOpenChatId(from.id);
      },

      onChatDeclined: (from, reason) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          m.set(from.id, { peer: from, messages: [], unread: 0, state: 'declined', declineReason: reason });
          return m;
        });
        setOpenChatId(from.id);
      },

      onChatMessage: (from, text, timestamp) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(from.id);
          const msg = { id: `${timestamp}-${Math.random()}`, fromMe: false, text, timestamp };
          m.set(from.id, ex
            ? { ...ex, messages: [...ex.messages, msg], unread: ex.unread + 1, state: 'active' }
            : { peer: from, messages: [msg], unread: 1, state: 'active' }
          );
          return m;
        });
        setOpenChatId(id => id ?? from.id);
      },

      onChatClosed: (fromId: string) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(fromId);
          if (ex) m.set(fromId, { ...ex, state: 'closed' });
          return m;
        });
      },

      onChatUnavailable: (toId) => {
        setConversations(prev => {
          const m = new Map<string, ChatConversation>(prev);
          const ex = m.get(toId);
          if (ex) m.set(toId, { ...ex, state: 'unavailable' });
          return m;
        });
      },
    });
  }, [registerCallbacks]);

  // ── Actions ──────────────────────────────────────────────────────────────────

  const startChat = useCallback((
    user: NearbyUser,
    sendRequest: (id: string) => void
  ) => {
    const peer: ChatPeer = { id: user.id, username: user.username, color: user.color, emoji: user.emoji };
    setConversations(prev => {
      const m = new Map<string, ChatConversation>(prev);
      if (!m.has(user.id)) m.set(user.id, { peer, messages: [], unread: 0, state: 'requesting' });
      return m;
    });
    setOpenChatId(user.id);
    sendRequest(user.id);
  }, []);

  const acceptChat = useCallback((
    from: ChatPeer,
    socketAccept: (id: string) => void
  ) => {
    socketAccept(from.id);
    setConversations(prev => {
      const m = new Map<string, ChatConversation>(prev);
      m.set(from.id, { peer: from, messages: [], unread: 0, state: 'active' });
      return m;
    });
    setOpenChatId(from.id);
    setIncomingRequest(null);
  }, []);

  const declineChat = useCallback((
    fromId: string,
    socketDecline: (id: string) => void
  ) => {
    socketDecline(fromId);
    setIncomingRequest(null);
  }, []);

  const sendMessage = useCallback((
    toId: string,
    text: string,
    socketSend: (id: string, text: string) => void
  ) => {
    socketSend(toId, text);
    setConversations(prev => {
      const m = new Map<string, ChatConversation>(prev);
      const ex = m.get(toId);
      if (!ex) return prev;
      const msg = { id: `${Date.now()}-${Math.random()}`, fromMe: true, text, timestamp: Date.now() };
      m.set(toId, { ...ex, messages: [...ex.messages, msg] });
      return m;
    });
  }, []);

  const closeChat = useCallback((
    id: string,
    socketClose: (id: string) => void
  ) => {
    socketClose(id);
    setConversations(prev => { const m = new Map<string, ChatConversation>(prev); m.delete(id); return m; });
    setOpenChatId(oid => oid === id ? null : oid);
  }, []);

  return {
    conversations,
    openChatId,
    incomingRequest,
    setIncomingRequest,
    startChat,
    acceptChat,
    declineChat,
    sendMessage,
    closeChat,
  };
}
