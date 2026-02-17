import { io, Socket } from "socket.io-client";
import { ENV } from "../utils/env";
import { TokenUtils } from "../utils/tokenUtils";

interface QueuedOperation {
  type: "join" | "send" | "leave";
  payload: any;
}

class WebSocketService {
  private socket: Socket | null = null;
  private listeners = new Map<string, ((data: any) => void)[]>();
  private isManualDisconnect = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  private lastTypingEvents = new Map<string, number>();
  private _isAuthenticated = false;
  private pendingOperations: QueuedOperation[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.disconnect());
    }
  }

  /* -------------------- CONNECTION -------------------- */

  connect(): void {
    if (this.socket?.connected) return;
    if (this.isManualDisconnect) return;

    const token = TokenUtils.getAccessToken();
    if (!token) {
      this.emit("auth_error", { message: "No access token" });
      return;
    }

    this._isAuthenticated = false;

    try {
      this.socket = io(ENV.WS_URL, {
        path: "/ws/socket.io",
        auth: { token },
        transports: ["websocket", "polling"],
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: this.maxReconnectAttempts,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        autoConnect: true,
        forceNew: false,
      });

      this.bindCoreEvents();
      this.bindAppEvents();
    } catch (error) {
      this.emit("connection_error", { message: (error as Error).message });
    }
  }

  disconnect(): void {
    this.isManualDisconnect = true;
    this._isAuthenticated = false;
    this.pendingOperations = [];
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.lastTypingEvents.clear();

    this.socket?.disconnect();
    this.socket = null;
    this.reconnectAttempts = 0;
  }

  reconnect(): void {
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this._isAuthenticated = false;
    this.pendingOperations = [];

    // Clean up existing socket without setting isManualDisconnect
    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.lastTypingEvents.clear();
    this.socket?.disconnect();
    this.socket = null;

    setTimeout(() => this.connect(), 100);
  }

  /**
   * Reconnect with a fresh token (e.g., after token refresh).
   * Forces a new connection even if currently connected.
   */
  reconnectWithFreshToken(): void {
    this.isManualDisconnect = false;
    this.reconnectAttempts = 0;
    this._isAuthenticated = false;

    this.typingTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.typingTimeouts.clear();
    this.lastTypingEvents.clear();
    this.socket?.disconnect();
    this.socket = null;

    setTimeout(() => this.connect(), 200);
  }

  /* -------------------- CORE EVENTS -------------------- */

  private bindCoreEvents() {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      this.reconnectAttempts = 0;
      this._isAuthenticated = false;
      this.emit("connected", {
        socketId: this.socket?.id,
        transport: this.socket?.io?.engine?.transport?.name,
      });
      // Authenticate immediately after connecting
      this.authenticate();
    });

    this.socket.on("disconnect", (reason) => {
      this._isAuthenticated = false;
      this.emit("disconnected", { reason });
      if (
        reason === "io client disconnect" ||
        reason === "io server disconnect"
      ) {
        this.isManualDisconnect = true;
      }
    });

    this.socket.on("connect_error", (err: any) => {
      this.reconnectAttempts++;
      this._isAuthenticated = false;
      this.emit("connection_error", {
        message: err.message,
        type: err?.type,
        description: err?.description,
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
      });

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        // Clean up socket but do NOT set isManualDisconnect so future
        // connect() / reconnect() calls can still work.
        this._isAuthenticated = false;
        this.pendingOperations = [];
        this.socket?.disconnect();
        this.socket = null;
        this.emit("disconnected", { reason: "max_reconnect_attempts" });
      }
    });

    this.socket.on("error", (error) => {
      this.emit("error", error);
    });

    this.socket.on("authenticated", (data) => {
      this._isAuthenticated = true;
      this.emit("authenticated", data);
      // Process any operations that were queued while waiting for auth
      this.flushPendingOperations();
    });

    this.socket.on("auth_error", (data) => {
      this._isAuthenticated = false;
      this.pendingOperations = [];
      this.emit("auth_error", data);

      // Try reconnecting with a fresh token instead of disconnecting immediately
      const freshToken = TokenUtils.getAccessToken();
      if (freshToken) {
        console.warn("[WS] Auth error, retrying with fresh token...");
        this.reconnectWithFreshToken();
      } else {
        this.disconnect();
      }
    });
  }

  /* -------------------- AUTHENTICATION -------------------- */

  private authenticate() {
    if (!this.socket?.connected) return;
    const token = TokenUtils.getAccessToken();
    this.socket.emit("authenticate", { token });
  }

  /* -------------------- PENDING OPERATIONS -------------------- */

  private flushPendingOperations() {
    const ops = [...this.pendingOperations];
    this.pendingOperations = [];

    for (const op of ops) {
      switch (op.type) {
        case "join":
          this.joinConversation(op.payload.conversationId);
          break;
        case "send":
          this.sendMessage(op.payload);
          break;
        case "leave":
          this.leaveConversation(op.payload.conversationId);
          break;
      }
    }
  }

  /* -------------------- APP EVENTS -------------------- */

  private bindAppEvents() {
    if (!this.socket) return;

    const events = [
      "connected",
      "authenticated",
      "new_message",
      "message_sent",
      "message_error",
      "message_read",
      "typing_start",
      "typing_end",
      "user_joined",
      "user_left",
      "online_users",
      "user_online",
      "user_offline",
      "pong",
      "joined_conversation",
      "conversation_updated",
      "user_typing",
      "new_notification",
    ];

    events.forEach((event) => {
      this.socket!.on(event, (data) => {
        this.emit(event, data);
      });
    });
  }

  /* -------------------- PUBLIC ACTIONS -------------------- */

  joinConversation(conversationId: string) {
    if (!this.socket?.connected) return;

    // Queue if not yet authenticated
    if (!this._isAuthenticated) {
      this.pendingOperations.push({
        type: "join",
        payload: { conversationId },
      });
      return;
    }

    this.socket.emit("join_conversation", { conversationId });
  }

  leaveConversation(conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("leave_conversation", { conversationId });
  }

  sendMessage(payload: Record<string, unknown>): boolean {
    if (!this.socket?.connected) {
      this.emit("message_error", { message: "Not connected" });
      return false;
    }

    // Queue if not yet authenticated
    if (!this._isAuthenticated) {
      this.pendingOperations.push({ type: "send", payload });
      return false;
    }

    this.socket.emit("send_message", payload);
    return true;
  }

  startTyping(conversationId: string) {
    if (!this.socket?.connected || !this._isAuthenticated) return;

    const now = Date.now();
    const lastEvent = this.lastTypingEvents.get(conversationId) || 0;

    if (now - lastEvent < 1000) return;

    this.socket.emit("typing_start", {
      conversationId,
      timestamp: new Date().toISOString(),
    });

    this.lastTypingEvents.set(conversationId, now);

    const existingTimeout = this.typingTimeouts.get(conversationId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.stopTyping(conversationId);
    }, 3000);

    this.typingTimeouts.set(conversationId, timeout);
  }

  stopTyping(conversationId: string) {
    if (!this.socket?.connected) return;

    this.socket.emit("typing_end", {
      conversationId,
      timestamp: new Date().toISOString(),
    });

    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }

    this.lastTypingEvents.delete(conversationId);
  }

  cancelTyping(conversationId: string) {
    const timeout = this.typingTimeouts.get(conversationId);
    if (timeout) {
      clearTimeout(timeout);
      this.typingTimeouts.delete(conversationId);
    }
    this.lastTypingEvents.delete(conversationId);
  }

  markAsRead(messageId: string, conversationId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("mark_as_read", { messageId, conversationId });
  }

  ping() {
    if (!this.socket?.connected) return;
    this.socket.emit("ping");
  }

  getUserPresence(userId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("get_presence", { userId });
  }

  subscribeToUser(userId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("subscribe_user", { userId });
  }

  unsubscribeFromUser(userId: string) {
    if (!this.socket?.connected) return;
    this.socket.emit("unsubscribe_user", { userId });
  }

  /* -------------------- STATUS -------------------- */

  isConnected(): boolean {
    return !!this.socket?.connected;
  }

  isReady(): boolean {
    return !!this.socket?.connected && this._isAuthenticated;
  }

  getSocketId(): string | null {
    return this.socket?.id || null;
  }

  getConnectionStatus() {
    return {
      connected: this.isConnected(),
      authenticated: this._isAuthenticated,
      socketId: this.getSocketId(),
      transport: this.socket?.io?.engine?.transport?.name,
      reconnectAttempts: this.reconnectAttempts,
      isManualDisconnect: this.isManualDisconnect,
      pendingOperations: this.pendingOperations.length,
    };
  }

  /* -------------------- EVENT BUS -------------------- */

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback?: (data: any) => void) {
    if (!callback) {
      this.listeners.delete(event);
      return;
    }
    const list = this.listeners.get(event);
    if (!list) return;
    this.listeners.set(
      event,
      list.filter((cb) => cb !== callback),
    );
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;

    setTimeout(() => {
      callbacks.forEach((cb) => {
        try {
          cb(data);
        } catch {
          // Silent failure for event listeners
        }
      });
    }, 0);
  }
}

export const webSocketService = new WebSocketService();
export default WebSocketService;
