import { useState, useEffect, useRef, useCallback } from "react";

export interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

interface UseChatProps {
  sessionId: string;
  userId: string;
  userName: string;
  onMessageReceived?: (message: ChatMessage) => void;
}

export function useChat({
  sessionId,
  userId,
  userName,
  onMessageReceived
}: UseChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      // Connect to WebSocket on specific path
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/video-signaling`;
      
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('Chat WebSocket connected');
        
        // Authenticate first
        if (wsRef.current) {
          wsRef.current.send(JSON.stringify({
            type: 'authenticate',
            userId,
            sessionToken: 'placeholder-token'
          }));
        }
      };
      
      wsRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'authenticated':
            console.log('Chat authenticated successfully');
            setIsConnected(true);
            
            // Join chat session
            if (wsRef.current) {
              wsRef.current.send(JSON.stringify({
                type: 'join-chat-session',
                sessionId,
                userId,
                userName
              }));
            }
            break;
            
          case 'chat-session-joined':
            console.log('Joined chat session');
            // Load any previous messages if available
            if (data.messages && Array.isArray(data.messages)) {
              setMessages(data.messages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp),
                isOwn: msg.senderId === userId
              })));
            }
            break;
            
          case 'chat-message':
            console.log('Received chat message:', data);
            const newMessage: ChatMessage = {
              id: data.id,
              sender: data.sender,
              senderId: data.senderId,
              message: data.message,
              timestamp: new Date(data.timestamp),
              isOwn: data.senderId === userId
            };
            
            setMessages(prev => [...prev, newMessage]);
            onMessageReceived?.(newMessage);
            break;
            
          case 'error':
            console.error('Chat error:', data.message);
            break;
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('Chat WebSocket disconnected');
        setIsConnected(false);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('Chat WebSocket error:', error);
      };
      
    } catch (error) {
      console.error('Failed to connect to chat:', error);
    }
  }, [sessionId, userId, userName, onMessageReceived]);

  // Send message
  const sendMessage = useCallback((messageText: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('Cannot send message: WebSocket not connected');
      return;
    }

    const message: ChatMessage = {
      id: `${Date.now()}-${userId}`,
      sender: userName,
      senderId: userId,
      message: messageText,
      timestamp: new Date(),
      isOwn: true
    };

    // Send to server
    wsRef.current.send(JSON.stringify({
      type: 'send-chat-message',
      sessionId,
      userId,
      userName,
      message: messageText,
      messageId: message.id
    }));

    // Add to local messages immediately for instant feedback
    setMessages(prev => [...prev, message]);
  }, [sessionId, userId, userName]);

  // Disconnect
  const disconnect = useCallback(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'leave-chat-session',
        sessionId,
        userId
      }));
      wsRef.current.close();
    }
    
    wsRef.current = null;
    setIsConnected(false);
  }, [sessionId, userId]);

  // Auto-connect on mount
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    messages,
    sendMessage,
    disconnect
  };
}
