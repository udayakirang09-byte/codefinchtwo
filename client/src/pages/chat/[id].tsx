import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Video, Loader2, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ChatMessage {
  id: string;
  bookingId: string;
  senderId: string;
  senderName: string;
  message: string;
  sentAt: string;
}

export default function ChatClass() {
  const [, params] = useRoute("/chat/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  if (!params) {
    return <div>Invalid class ID</div>;
  }
  
  const classId = (params as { id: string }).id;
  
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch booking details to get class info
  const { data: booking } = useQuery({
    queryKey: ['/api/bookings', classId],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${classId}`);
      if (!response.ok) throw new Error('Failed to fetch booking');
      return response.json();
    },
    enabled: !!classId
  });

  // Fetch chat messages
  const { data: messages = [], isLoading, refetch } = useQuery<ChatMessage[]>({
    queryKey: ['/api/bookings', classId, 'messages'],
    queryFn: async () => {
      const response = await fetch(`/api/bookings/${classId}/messages`);
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    },
    enabled: !!classId,
    refetchInterval: 3000, // Refetch every 3 seconds for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      return apiRequest('POST', `/api/bookings/${classId}/messages`, {
        senderId: user?.id,
        senderName: user?.email?.split('@')[0] || 'User',
        message: messageText
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/bookings', classId, 'messages'] });
      refetch(); // Immediately refetch to show new message
    }
  });

  const classInfo = {
    subject: booking?.subject || "Class Chat",
    mentor: booking ? `${booking.mentor?.user?.firstName} ${booking.mentor?.user?.lastName}` : "Mentor",
    participants: 2
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || sendMessageMutation.isPending) return;

    console.log(`📤 Sending message in class ${classId}: ${newMessage}`);
    sendMessageMutation.mutate(newMessage);
    setNewMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleJoinVideo = () => {
    console.log(`🎥 Joining video from chat for class ${classId}`);
    window.location.href = `/video-class/${classId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4 mx-auto" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Chat...</h2>
          <p className="text-gray-600">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-gray-600"
              data-testid="button-home"
            >
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="text-gray-600"
              data-testid="button-back"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="ml-4">
              <h1 className="text-lg font-bold text-gray-900">{classInfo.subject} - Class Chat</h1>
              <p className="text-sm text-gray-600">with {classInfo.mentor}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-gray-600"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              onClick={handleJoinVideo}
              className="bg-blue-600 hover:bg-blue-700"
              data-testid={`button-join-video-${classId}`}
            >
              <Video className="h-4 w-4 mr-2" />
              Join Video
            </Button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4">
        <Card className="h-[calc(100vh-200px)] flex flex-col shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg py-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Class Discussion</span>
              <Badge className="bg-white/20 text-white border-0">
                {messages.length} messages
              </Badge>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-8">
                  <p>No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages.map((message) => {
                  const isOwn = message.senderId === user?.id;
                  return (
                    <div
                      key={message.id}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.id}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                          isOwn
                            ? 'bg-blue-600 text-white rounded-br-sm'
                            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                        }`}
                      >
                        {!isOwn && (
                          <div className="text-xs font-medium mb-1 opacity-75">
                            {message.senderName}
                          </div>
                        )}
                        <p className="text-sm leading-relaxed">{message.message}</p>
                        <div className={`text-xs mt-1 opacity-75 ${isOwn ? 'text-right' : 'text-left'}`}>
                          {new Date(message.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border-gray-300 focus:border-blue-500 rounded-full"
                  data-testid="input-chat-message"
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 p-0"
                  data-testid="button-send-message"
                >
                  {sendMessageMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
