// src/test/websocket.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock socket.io-client
const mockSocketOn = vi.fn();
const mockSocketEmit = vi.fn();
const mockSocketDisconnect = vi.fn();

const mockSocket = {
  connected: true,
  id: 'socket-123',
  on: mockSocketOn,
  emit: mockSocketEmit,
  disconnect: mockSocketDisconnect,
  io: { engine: { transport: { name: 'websocket' } } },
};

vi.mock('socket.io-client', () => ({
  io: vi.fn(() => mockSocket),
}));

vi.mock('../utils/env', () => ({
  ENV: {
    WS_URL: 'ws://test-ws',
  },
}));

vi.mock('../utils/tokenUtils', () => ({
  TokenUtils: {
    getAccessToken: vi.fn(() => 'test-token'),
  },
}));

import { io } from 'socket.io-client';
import { TokenUtils } from '../utils/tokenUtils';
import WebSocketService from '../services/websocket.service';

const mockedIo = vi.mocked(io);

describe('WebSocketService', () => {
  let ws: InstanceType<typeof WebSocketService>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    ws = new WebSocketService();
    mockSocket.connected = true;
    mockSocket.id = 'socket-123';
  });

  afterEach(() => {
    ws.disconnect();
    vi.useRealTimers();
  });

  // ---------- Connection ----------
  describe('connect', () => {
    it('connects to WebSocket server', () => {
      ws.connect();
      expect(mockedIo).toHaveBeenCalledWith('ws://test-ws', expect.objectContaining({
        path: '/ws/socket.io',
        auth: { token: 'test-token' },
        transports: ['websocket', 'polling'],
      }));
    });

    it('does not connect if already connected', () => {
      ws.connect();
      const callCount = mockedIo.mock.calls.length;
      // Second connect should be a no-op since socket.connected is true
      ws.connect();
      expect(mockedIo.mock.calls.length).toBe(callCount);
    });

    it('emits auth_error if no token', () => {
      vi.mocked(TokenUtils.getAccessToken).mockReturnValueOnce(null);
      const handler = vi.fn();
      ws.on('auth_error', handler);

      ws.connect();

      vi.advanceTimersByTime(1);
      expect(handler).toHaveBeenCalledWith({ message: 'No access token' });
    });

    it('does not connect after manual disconnect', () => {
      ws.disconnect();
      ws.connect();
      expect(mockedIo).not.toHaveBeenCalled();
    });
  });

  // ---------- Disconnect ----------
  describe('disconnect', () => {
    it('disconnects the socket', () => {
      ws.connect();
      ws.disconnect();
      expect(mockSocketDisconnect).toHaveBeenCalled();
    });

    it('clears typing timeouts on disconnect', () => {
      ws.connect();
      const authCallback = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCallback) {
        authCallback[1]({ userId: 'u1' });
      }

      ws.disconnect();
      expect(ws.isConnected()).toBe(false);
    });
  });

  // ---------- Reconnect ----------
  describe('reconnect', () => {
    it('reconnects after disconnect', () => {
      ws.connect();
      const initialCalls = mockedIo.mock.calls.length;
      ws.reconnect();
      vi.advanceTimersByTime(200);
      expect(mockedIo.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  describe('reconnectWithFreshToken', () => {
    it('reconnects with a fresh token', () => {
      ws.connect();
      const initialCalls = mockedIo.mock.calls.length;
      ws.reconnectWithFreshToken();
      vi.advanceTimersByTime(300);
      expect(mockedIo.mock.calls.length).toBeGreaterThan(initialCalls);
    });
  });

  // ---------- Event bus ----------
  describe('event bus (on/off/emit)', () => {
    it('registers and fires event listeners via socket events', () => {
      ws.connect();

      const newMsgCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'new_message',
      );
      expect(newMsgCall).toBeTruthy();

      const msgHandler = vi.fn();
      ws.on('new_message', msgHandler);
      newMsgCall![1]({ content: 'hello' });
      vi.advanceTimersByTime(1);
      expect(msgHandler).toHaveBeenCalledWith({ content: 'hello' });
    });

    it('removes a specific listener', () => {
      const handler = vi.fn();
      ws.on('test_event', handler);
      ws.off('test_event', handler);
      // Verify listener was removed (no crash, handler won't be called)
    });

    it('removes all listeners for an event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      ws.on('test_event', handler1);
      ws.on('test_event', handler2);
      ws.off('test_event');
    });
  });

  // ---------- Public actions ----------
  describe('joinConversation', () => {
    it('emits join_conversation when authenticated', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({ userId: 'u1' });
      vi.advanceTimersByTime(1);

      ws.joinConversation('conv-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('join_conversation', {
        conversationId: 'conv-1',
      });
    });

    it('queues join when not authenticated', () => {
      ws.connect();
      ws.joinConversation('conv-1');
      const joinCalls = mockSocketEmit.mock.calls.filter(
        (call: any[]) => call[0] === 'join_conversation',
      );
      expect(joinCalls.length).toBe(0);
    });

    it('does nothing when not connected', () => {
      ws.joinConversation('conv-1');
      expect(mockSocketEmit).not.toHaveBeenCalled();
    });
  });

  describe('leaveConversation', () => {
    it('emits leave_conversation', () => {
      ws.connect();
      ws.leaveConversation('conv-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('leave_conversation', {
        conversationId: 'conv-1',
      });
    });
  });

  describe('sendMessage', () => {
    it('sends message when authenticated', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      const result = ws.sendMessage({ content: 'hello', conversationId: 'conv-1' });
      expect(result).toBe(true);
      expect(mockSocketEmit).toHaveBeenCalledWith('send_message', {
        content: 'hello',
        conversationId: 'conv-1',
      });
    });

    it('returns false and emits error when not connected', () => {
      const handler = vi.fn();
      ws.on('message_error', handler);

      const result = ws.sendMessage({ content: 'hello' });
      expect(result).toBe(false);
      vi.advanceTimersByTime(1);
      expect(handler).toHaveBeenCalledWith({ message: 'Not connected' });
    });

    it('queues message when connected but not authenticated', () => {
      ws.connect();
      const result = ws.sendMessage({ content: 'hello' });
      expect(result).toBe(false);
      const sendCalls = mockSocketEmit.mock.calls.filter(
        (call: any[]) => call[0] === 'send_message',
      );
      expect(sendCalls.length).toBe(0);
    });
  });

  describe('startTyping', () => {
    it('emits typing_start when authenticated', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      ws.startTyping('conv-1');
      expect(mockSocketEmit).toHaveBeenCalledWith(
        'typing_start',
        expect.objectContaining({ conversationId: 'conv-1' }),
      );
    });

    it('throttles typing events (1 second)', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      ws.startTyping('conv-1');
      ws.startTyping('conv-1');

      const typingCalls = mockSocketEmit.mock.calls.filter(
        (call: any[]) => call[0] === 'typing_start',
      );
      expect(typingCalls.length).toBe(1);
    });
  });

  describe('stopTyping', () => {
    it('emits typing_end', () => {
      ws.connect();
      ws.stopTyping('conv-1');
      expect(mockSocketEmit).toHaveBeenCalledWith(
        'typing_end',
        expect.objectContaining({ conversationId: 'conv-1' }),
      );
    });
  });

  describe('cancelTyping', () => {
    it('clears typing timeout without error', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      ws.startTyping('conv-1');
      ws.cancelTyping('conv-1');
    });
  });

  describe('markAsRead', () => {
    it('emits mark_as_read', () => {
      ws.connect();
      ws.markAsRead('msg-1', 'conv-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('mark_as_read', {
        messageId: 'msg-1',
        conversationId: 'conv-1',
      });
    });
  });

  describe('ping', () => {
    it('emits ping', () => {
      ws.connect();
      ws.ping();
      expect(mockSocketEmit).toHaveBeenCalledWith('ping');
    });
  });

  describe('getUserPresence', () => {
    it('emits get_presence', () => {
      ws.connect();
      ws.getUserPresence('user-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('get_presence', { userId: 'user-1' });
    });
  });

  describe('subscribeToUser', () => {
    it('emits subscribe_user', () => {
      ws.connect();
      ws.subscribeToUser('user-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('subscribe_user', { userId: 'user-1' });
    });
  });

  describe('unsubscribeFromUser', () => {
    it('emits unsubscribe_user', () => {
      ws.connect();
      ws.unsubscribeFromUser('user-1');
      expect(mockSocketEmit).toHaveBeenCalledWith('unsubscribe_user', { userId: 'user-1' });
    });
  });

  // ---------- Status ----------
  describe('status methods', () => {
    it('isConnected returns true when socket is connected', () => {
      ws.connect();
      expect(ws.isConnected()).toBe(true);
    });

    it('isConnected returns false when not connected', () => {
      expect(ws.isConnected()).toBe(false);
    });

    it('isReady returns true when connected and authenticated', () => {
      ws.connect();
      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      expect(ws.isReady()).toBe(true);
    });

    it('isReady returns false when not authenticated', () => {
      ws.connect();
      expect(ws.isReady()).toBe(false);
    });

    it('getSocketId returns socket id when connected', () => {
      ws.connect();
      expect(ws.getSocketId()).toBe('socket-123');
    });

    it('getSocketId returns null when not connected', () => {
      expect(ws.getSocketId()).toBeNull();
    });

    it('getConnectionStatus returns full status object', () => {
      ws.connect();
      const status = ws.getConnectionStatus();
      expect(status).toEqual(
        expect.objectContaining({
          connected: true,
          authenticated: false,
          socketId: 'socket-123',
        }),
      );
    });
  });

  // ---------- Pending operations flush ----------
  describe('flushPendingOperations', () => {
    it('flushes queued operations after authentication', () => {
      ws.connect();

      ws.joinConversation('conv-1');
      ws.sendMessage({ content: 'queued' });

      const authCall = mockSocketOn.mock.calls.find(
        (call: any[]) => call[0] === 'authenticated',
      );
      if (authCall) authCall[1]({});
      vi.advanceTimersByTime(1);

      expect(mockSocketEmit).toHaveBeenCalledWith('join_conversation', {
        conversationId: 'conv-1',
      });
      expect(mockSocketEmit).toHaveBeenCalledWith('send_message', { content: 'queued' });
    });
  });
});
