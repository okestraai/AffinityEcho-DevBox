// src/test/messagingApis.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the base module
const mockPost = vi.fn();
const mockGet = vi.fn();
const mockPut = vi.fn();
const mockDelete = vi.fn();

vi.mock('../../api/base', () => ({
  API_URL: 'http://test-api',
  getAuthInstance: () => ({
    post: mockPost,
    get: mockGet,
    put: mockPut,
    delete: mockDelete,
  }),
  unwrap: (res: { data: any }) => res.data?.data ?? res.data,
}));

import {
  SendAMessage,
  MarkMessagesAsRead,
  GetMessageUnreadCount,
  GetTypingStatus,
  CreateConversation,
  GetConversations,
  GetSingleConversationMessages,
  DeleteConversation,
  RequestIdentityReveal,
  RespondToIdentityReveal,
  GetIdentityRevealRequests,
  CancelIdentityReveal,
  GetIdentityRevealStatusForConversation,
  StartMentorshipChatFromDirectRequest,
  SetTypingStatus,
  DeleteMessage,
  EditMessage,
  GetConnectableUsers,
  SearchUsersForMention,
  GetUserSuggestions,
} from '../../api/messaging';

describe('Messaging API functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------- SendAMessage ----------
  describe('SendAMessage', () => {
    it('sends a message with correct payload', async () => {
      const payload = {
        conversation_id: 'conv-1',
        content_encrypted: 'hello',
        content_type: 'text',
        chat_type: 'regular' as const,
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'msg-1' } } });

      const result = await SendAMessage(payload);

      expect(mockPost).toHaveBeenCalledWith('http://test-api/messaging/send', payload);
      expect(result).toEqual({ id: 'msg-1' });
    });

    it('throws on network error', async () => {
      mockPost.mockRejectedValue(new Error('Network error'));
      await expect(
        SendAMessage({
          conversation_id: 'conv-1',
          content_encrypted: 'hello',
          content_type: 'text',
          chat_type: 'regular',
        }),
      ).rejects.toThrow('Network error');
    });
  });

  // ---------- MarkMessagesAsRead ----------
  describe('MarkMessagesAsRead', () => {
    it('marks messages as read', async () => {
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      const result = await MarkMessagesAsRead('conv-1', 'msg-5');
      expect(mockPut).toHaveBeenCalledWith('http://test-api/messaging/read', {
        conversation_id: 'conv-1',
        message_id: 'msg-5',
      });
      expect(result).toEqual({ success: true });
    });

    it('throws on failure', async () => {
      mockPut.mockRejectedValue(new Error('Server error'));
      await expect(MarkMessagesAsRead('conv-1', 'msg-5')).rejects.toThrow('Server error');
    });
  });

  // ---------- GetMessageUnreadCount ----------
  describe('GetMessageUnreadCount', () => {
    it('fetches unread count without filters', async () => {
      mockGet.mockResolvedValue({ data: { data: { count: 5 } } });
      const result = await GetMessageUnreadCount();
      expect(mockGet).toHaveBeenCalledWith('http://test-api/messaging/unread-count');
      expect(result).toEqual({ count: 5 });
    });

    it('fetches unread count with chat_type filter', async () => {
      mockGet.mockResolvedValue({ data: { data: { count: 2 } } });
      const result = await GetMessageUnreadCount({ chat_type: 'mentorship' });
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/messaging/unread-count?chat_type=mentorship',
      );
      expect(result).toEqual({ count: 2 });
    });
  });

  // ---------- GetTypingStatus ----------
  describe('GetTypingStatus', () => {
    it('gets typing status for a conversation', async () => {
      mockGet.mockResolvedValue({ data: { data: { is_typing: true } } });
      const result = await GetTypingStatus('conv-1');
      expect(mockGet).toHaveBeenCalledWith('http://test-api/messaging/typing/conv-1');
      expect(result).toEqual({ is_typing: true });
    });
  });

  // ---------- CreateConversation ----------
  describe('CreateConversation', () => {
    it('creates a regular conversation', async () => {
      const payload = {
        other_user_id: 'user-2',
        context_type: 'regular' as const,
        initial_message: 'Hi!',
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'conv-new' } } });
      const result = await CreateConversation(payload);
      expect(mockPost).toHaveBeenCalledWith('http://test-api/conversations', payload);
      expect(result).toEqual({ id: 'conv-new' });
    });

    it('creates a mentorship conversation', async () => {
      const payload = {
        other_user_id: 'user-3',
        context_type: 'mentorship' as const,
        context_id: 'mentorship-1',
      };
      mockPost.mockResolvedValue({ data: { data: { id: 'conv-m1' } } });
      const result = await CreateConversation(payload);
      expect(mockPost).toHaveBeenCalledWith('http://test-api/conversations', payload);
      expect(result).toEqual({ id: 'conv-m1' });
    });
  });

  // ---------- GetConversations ----------
  describe('GetConversations', () => {
    it('fetches conversations with filters', async () => {
      mockGet.mockResolvedValue({
        data: { data: { conversations: [], total: 0 } },
      });
      const filter = { chat_type: 'all' as const, limit: 20, offset: 0, search: '' };
      const result = await GetConversations(filter);
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('http://test-api/conversations?'),
      );
      expect(result).toEqual({ conversations: [], total: 0 });
    });

    it('includes search param when provided', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetConversations({
        chat_type: 'regular',
        limit: 10,
        offset: 0,
        search: 'john',
      });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('search=john');
      expect(url).toContain('chat_type=regular');
    });
  });

  // ---------- GetSingleConversationMessages ----------
  describe('GetSingleConversationMessages', () => {
    it('fetches messages for a conversation', async () => {
      mockGet.mockResolvedValue({ data: { data: { messages: [] } } });
      const result = await GetSingleConversationMessages('conv-1', { limit: 50 });
      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('http://test-api/conversations/conv-1/messages?'),
      );
      expect(result).toEqual({ messages: [] });
    });

    it('includes before param for pagination', async () => {
      mockGet.mockResolvedValue({ data: { data: { messages: [] } } });
      await GetSingleConversationMessages('conv-1', {
        limit: 50,
        before: 'msg-100',
      });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('before=msg-100');
    });
  });

  // ---------- DeleteConversation ----------
  describe('DeleteConversation', () => {
    it('deletes a conversation', async () => {
      mockDelete.mockResolvedValue({ data: { data: { success: true } } });
      const result = await DeleteConversation('conv-1');
      expect(mockDelete).toHaveBeenCalledWith('http://test-api/conversations/conv-1/clear');
      expect(result).toEqual({ success: true });
    });
  });

  // ---------- Identity Reveal ----------
  describe('RequestIdentityReveal', () => {
    it('sends identity reveal request', async () => {
      mockPost.mockResolvedValue({ data: { data: { id: 'reveal-1' } } });
      const result = await RequestIdentityReveal('conv-1', 'Please reveal', 'conn-1');
      expect(mockPost).toHaveBeenCalledWith('http://test-api/identity-reveal/request', {
        conversation_id: 'conv-1',
        message: 'Please reveal',
        connection_id: 'conn-1',
      });
      expect(result).toEqual({ id: 'reveal-1' });
    });
  });

  describe('RespondToIdentityReveal', () => {
    it('accepts an identity reveal', async () => {
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      const result = await RespondToIdentityReveal('reveal-1', 'accept');
      expect(mockPut).toHaveBeenCalledWith('http://test-api/identity-reveal/respond', {
        reveal_id: 'reveal-1',
        action: 'accept',
        reason: undefined,
      });
      expect(result).toEqual({ success: true });
    });

    it('rejects an identity reveal with reason', async () => {
      mockPut.mockResolvedValue({ data: { data: { success: true } } });
      await RespondToIdentityReveal('reveal-1', 'reject', 'Not ready');
      expect(mockPut).toHaveBeenCalledWith('http://test-api/identity-reveal/respond', {
        reveal_id: 'reveal-1',
        action: 'reject',
        reason: 'Not ready',
      });
    });
  });

  describe('GetIdentityRevealRequests', () => {
    it('fetches pending reveal requests', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      const result = await GetIdentityRevealRequests({ status: 'pending' });
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/identity-reveal?status=pending',
      );
      expect(result).toEqual([]);
    });
  });

  describe('CancelIdentityReveal', () => {
    it('cancels an identity reveal', async () => {
      mockDelete.mockResolvedValue({ data: { data: { success: true } } });
      const result = await CancelIdentityReveal('reveal-1');
      expect(mockDelete).toHaveBeenCalledWith('http://test-api/identity-reveal/reveal-1');
      expect(result).toEqual({ success: true });
    });
  });

  describe('GetIdentityRevealStatusForConversation', () => {
    it('gets reveal status for a conversation', async () => {
      mockGet.mockResolvedValue({ data: { data: { status: 'none' } } });
      const result = await GetIdentityRevealStatusForConversation('conv-1');
      expect(mockGet).toHaveBeenCalledWith(
        'http://test-api/identity-reveal/status/conv-1',
      );
      expect(result).toEqual({ status: 'none' });
    });
  });

  // ---------- StartMentorshipChatFromDirectRequest ----------
  describe('StartMentorshipChatFromDirectRequest', () => {
    it('starts mentorship chat from request', async () => {
      mockPost.mockResolvedValue({ data: { data: { conversationId: 'conv-m1' } } });
      const result = await StartMentorshipChatFromDirectRequest('req-1');
      expect(mockPost).toHaveBeenCalledWith(
        'http://test-api/mentorship-chat/start-from-request/req-1',
      );
      expect(result).toEqual({ conversationId: 'conv-m1' });
    });
  });

  // ---------- SetTypingStatus ----------
  describe('SetTypingStatus', () => {
    it('sets typing status', async () => {
      mockPost.mockResolvedValue({ data: { data: { success: true } } });
      const result = await SetTypingStatus({
        conversation_id: 'conv-1',
        is_typing: true,
      });
      expect(mockPost).toHaveBeenCalledWith('http://test-api/messaging/typing', {
        conversation_id: 'conv-1',
        is_typing: true,
      });
      expect(result).toEqual({ success: true });
    });
  });

  // ---------- DeleteMessage ----------
  describe('DeleteMessage', () => {
    it('deletes a message', async () => {
      mockDelete.mockResolvedValue({ data: { data: { success: true } } });
      const result = await DeleteMessage('msg-1', 'conv-1');
      expect(mockDelete).toHaveBeenCalledWith(
        'http://test-api/messaging/messages/msg-1',
        { data: { conversation_id: 'conv-1' } },
      );
      expect(result).toEqual({ success: true });
    });
  });

  // ---------- EditMessage ----------
  describe('EditMessage', () => {
    it('edits a message', async () => {
      mockPut.mockResolvedValue({ data: { data: { id: 'msg-1', content: 'edited' } } });
      const result = await EditMessage('msg-1', {
        conversation_id: 'conv-1',
        content_encrypted: 'edited',
      });
      expect(mockPut).toHaveBeenCalledWith('http://test-api/messaging/messages/msg-1', {
        conversation_id: 'conv-1',
        content_encrypted: 'edited',
      });
      expect(result).toEqual({ id: 'msg-1', content: 'edited' });
    });
  });

  // ---------- GetConnectableUsers ----------
  describe('GetConnectableUsers', () => {
    it('fetches connectable users with search', async () => {
      mockGet.mockResolvedValue({ data: { data: { users: [] } } });
      await GetConnectableUsers({ search: 'alice', limit: 10 });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('search=alice');
      expect(url).toContain('limit=10');
    });

    it('includes skills and role params', async () => {
      mockGet.mockResolvedValue({ data: { data: { users: [] } } });
      await GetConnectableUsers({ role: 'mentor', skills: ['react', 'node'] });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('role=mentor');
      expect(url).toContain('skills=react%2Cnode');
    });
  });

  // ---------- SearchUsersForMention ----------
  describe('SearchUsersForMention', () => {
    it('searches users by query', async () => {
      mockGet.mockResolvedValue({ data: { data: [{ id: 'u1', username: 'alice' }] } });
      const result = await SearchUsersForMention({ search: 'ali' });
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('search=ali');
      expect(result).toEqual([{ id: 'u1', username: 'alice' }]);
    });
  });

  // ---------- GetUserSuggestions ----------
  describe('GetUserSuggestions', () => {
    it('fetches user suggestions with limit', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetUserSuggestions(5);
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('limit=5');
    });

    it('fetches without limit', async () => {
      mockGet.mockResolvedValue({ data: { data: [] } });
      await GetUserSuggestions();
      const url = mockGet.mock.calls[0][0] as string;
      expect(url).toContain('suggestions');
      expect(url).not.toContain('limit=');
    });
  });
});
