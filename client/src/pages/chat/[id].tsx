import { useState, useEffect, useRef } from "react";
import { useRoute } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Users, Video, Phone, Paperclip } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: string;
  message: string;
  timestamp: Date;
  isOwn: boolean;
}

export default function ChatClass() {
  const [, params] = useRoute("/chat/:id");
  const classId = params?.id;
  
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const classInfo = {
    subject: "Python Basics",
    mentor: "Sarah Johnson",
    participants: 2
  };

  useEffect(() => {
    console.log(`💬 Initializing chat for class ${classId}`);
    
    // Simulate connection and initial messages
    setTimeout(() => {
      setIsConnected(true);
      setMessages([
        {
          id: '1',
          sender: 'Sarah Johnson',
          message: 'Welcome to our Python Basics class! Feel free to ask questions anytime.',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          isOwn: false
        },
        {
          id: '2',
          sender: 'You',
          message: 'Thank you! Looking forward to learning Python.',
          timestamp: new Date(Date.now() - 3 * 60 * 1000),
          isOwn: true
        },
        {
          id: '3',
          sender: 'Sarah Johnson',
          message: 'Great! We\'ll start with variables and data types. Let me know if you need clarification on anything.',
          timestamp: new Date(Date.now() - 1 * 60 * 1000),
          isOwn: false
        }
      ]);
    }, 1000);
  }, [classId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date(),
      isOwn: true
    };

    console.log(`📤 Sending message in class ${classId}: ${newMessage}`);
    setMessages(prev => [...prev, message]);
    setNewMessage("");

    // Simulate mentor response
    setTimeout(() => {
      const responses = [
        "Great question! Let me explain that...",
        "I see what you mean. Here's how we can approach this...",
        "That's exactly right! Well done.",
        "Let me share my screen to show you this concept better."
      ];
      
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'Sarah Johnson',
        message: responses[Math.floor(Math.random() * responses.length)],
        timestamp: new Date(),
        isOwn: false
      };
      
      setMessages(prev => [...prev, response]);
    }, 2000);
  };

  const handleJoinVideo = () => {
    console.log(`🎥 Joining video from chat for class ${classId}`);
    window.location.href = `/video-class/${classId}`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4 mx-auto"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Connecting to Chat...</h2>
          <p className="text-gray-600">Joining {classInfo.subject} discussion</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">{classInfo.subject} - Class Chat</h1>
            <p className="text-sm text-gray-600">with {classInfo.mentor}</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge className="bg-green-100 text-green-800">
              <Users className="h-3 w-3 mr-1" />
              {classInfo.participants} online
            </Badge>
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
            <CardTitle className="text-lg">Class Discussion</CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex flex-col">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                      message.isOwn
                        ? 'bg-blue-600 text-white rounded-br-sm'
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                    }`}
                  >
                    {!message.isOwn && (
                      <div className="text-xs font-medium mb-1 opacity-75">
                        {message.sender}
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.message}</p>
                    <div className={`text-xs mt-1 opacity-75 ${message.isOwn ? 'text-right' : 'text-left'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-gray-200 p-4 bg-gray-50">
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 border-gray-300 focus:border-blue-500 rounded-full"
                  data-testid="input-chat-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 rounded-full w-10 h-10 p-0"
                  data-testid="button-send-message"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}