import { useEffect, useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { HelpCircle, Mail, Phone, MessageSquare, Bot, Send, Ticket, Search, ArrowLeft, Loader2 } from "lucide-react";

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
  confidence?: number;
}

interface HelpTicket {
  id: string;
  subject: string;
  category: string;
  status: string;
  createdAt: string;
}

export default function Help() {
  const { toast } = useToast();
  const [contactSettings, setContactSettings] = useState({
    emailEnabled: false,
    chatEnabled: false,
    phoneEnabled: false,
  });

  // AI Chat State
  const [currentView, setCurrentView] = useState<'main' | 'ai-chat' | 'create-ticket'>('main');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  // Ticket Creation State
  const [ticketForm, setTicketForm] = useState({
    subject: '',
    description: '',
    category: 'general',
    contactEmail: ''
  });
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  // Knowledge Base State
  const [knowledgeBase, setKnowledgeBase] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Fetch admin contact settings
    fetch("/api/admin/contact-settings")
      .then((res) => res.json())
      .then((settings) => setContactSettings(settings))
      .catch(() => {
        // Default to all disabled
        setContactSettings({ emailEnabled: false, chatEnabled: false, phoneEnabled: false });
      });

    // Load knowledge base articles
    loadKnowledgeBase();
  }, []);

  const loadKnowledgeBase = async () => {
    try {
      const response = await fetch('/api/help-knowledge-base');
      if (response.ok) {
        const articles = await response.json();
        setKnowledgeBase(articles);
      }
    } catch (error) {
      console.error('Failed to load knowledge base:', error);
    }
  };

  // AI Chat Functions
  const sendMessageToAI = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      message: message.trim(),
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const response = await fetch('/api/ai/help/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: message.trim(),
          category: 'general'
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          message: result.aiResponse,
          timestamp: new Date(),
          confidence: result.confidence
        };

        setChatMessages(prev => [...prev, aiMessage]);

        // If AI confidence is low, suggest creating a ticket
        if (result.escalateToHuman) {
          setTimeout(() => {
            toast({
              title: "Need more help?",
              description: "I recommend creating a support ticket for personalized assistance.",
              action: (
                <Button size="sm" onClick={() => setCurrentView('create-ticket')}>
                  Create Ticket
                </Button>
              )
            });
          }, 2000);
        }
      } else {
        throw new Error('Failed to get AI response');
      }
    } catch (error) {
      console.error('AI chat error:', error);
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        message: "I'm sorry, I'm having trouble connecting right now. Please try creating a support ticket for immediate assistance.",
        timestamp: new Date()
      };

      setChatMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Connection Error",
        description: "AI assistant is temporarily unavailable. Please create a support ticket.",
        variant: "destructive"
      });
    } finally {
      setIsAiTyping(false);
    }
  };

  // Ticket Creation Functions
  const createSupportTicket = async () => {
    if (!ticketForm.subject || !ticketForm.description) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject and description.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmittingTicket(true);

    try {
      const response = await fetch('/api/help-tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticketForm)
      });

      if (response.ok) {
        const ticket = await response.json();
        
        toast({
          title: "Ticket Created!",
          description: `Your support ticket #${ticket.id.slice(-8)} has been submitted. You'll receive an email confirmation shortly.`
        });

        // Reset form and return to main view
        setTicketForm({
          subject: '',
          description: '',
          category: 'general',
          contactEmail: ''
        });
        setCurrentView('main');

        // Send email notification (fallback functionality)
        if (ticketForm.contactEmail) {
          await sendEmailNotification(ticket);
        }

      } else {
        throw new Error('Failed to create ticket');
      }
    } catch (error) {
      console.error('Ticket creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Email Fallback Function (simplified to avoid system user dependency)
  const sendEmailNotification = async (ticket: any) => {
    try {
      // Skip notification creation to avoid foreign key constraint issues
      // In production, this would integrate with an email service like SendGrid
      console.log(`📧 Email notification would be sent to: ${ticketForm.contactEmail}`);
      console.log(`📋 Ticket created: #${ticket.id.slice(-8)}`);
    } catch (error) {
      console.error('Email notification error:', error);
    }
  };

  const faqs = [
    {
      question: "How do I book a session with a mentor?",
      answer: "Browse our mentors, click on a profile, and then click 'Book a Session'. Fill in the required details and submit the form."
    },
    {
      question: "What age groups do you support?",
      answer: "We primarily serve children ages 6-17, exception for General Computer Science topics."
    },
    {
      question: "Can I cancel or reschedule a session?",
      answer: "Yes, you can cancel or reschedule sessions up to 24 hours before the scheduled time through your dashboard."
    },
    {
      question: "What equipment do I need?",
      answer: "A computer or tablet with internet access. Some courses may require specific software, which we'll help you install."
    },
    {
      question: "How do I enroll in a course?",
      answer: "Browse our courses, select one that interests you, and click 'Enroll Now'. Complete the secure payment process to gain access."
    }
  ];

  // Render AI Chat View
  const renderAIChatView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setCurrentView('main')}
          className="mr-4"
          data-testid="button-back-from-chat"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>
        <div className="flex items-center">
          <Bot className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-2xl font-bold">KADB AI Assistant</h2>
        </div>
      </div>

      <Card className="h-[600px] flex flex-col">
        <CardContent className="flex-1 p-4 overflow-y-auto">
          {chatMessages.length === 0 ? (
            <div className="text-center py-20">
              <Bot className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Hi! I'm KADB, your AI assistant</h3>
              <p className="text-gray-600 mb-4">
                I'm here to help with questions about TechLearnOrbit. Ask me anything about:
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-lg mx-auto text-sm">
                <Badge variant="outline">Platform Navigation</Badge>
                <Badge variant="outline">Booking Sessions</Badge>
                <Badge variant="outline">Course Enrollment</Badge>
                <Badge variant="outline">Payment Issues</Badge>
                <Badge variant="outline">Account Settings</Badge>
                <Badge variant="outline">Technical Problems</Badge>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <div className="text-xs opacity-70 mt-1">
                      {msg.timestamp.toLocaleTimeString()}
                      {msg.confidence && (
                        <span className="ml-2">
                          Confidence: {Math.round(msg.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 p-3 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="text-sm">KADB is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
        <div className="p-4 border-t">
          <div className="flex space-x-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessageToAI(chatInput)}
              placeholder="Ask KADB a question..."
              className="flex-1"
              data-testid="input-ai-chat"
              disabled={isAiTyping}
            />
            <Button
              onClick={() => sendMessageToAI(chatInput)}
              disabled={!chatInput.trim() || isAiTyping}
              data-testid="button-send-message"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render Ticket Creation View
  const renderCreateTicketView = () => (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center mb-6">
        <Button
          variant="ghost"
          onClick={() => setCurrentView('main')}
          className="mr-4"
          data-testid="button-back-from-ticket"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Help Center
        </Button>
        <div className="flex items-center">
          <Ticket className="h-6 w-6 text-green-600 mr-2" />
          <h2 className="text-2xl font-bold">Create Support Ticket</h2>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Submit a Support Request</CardTitle>
          <p className="text-gray-600">
            Can't find the answer you need? Create a support ticket and our team will help you within 24 hours.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Subject *</label>
            <Input
              value={ticketForm.subject}
              onChange={(e) => setTicketForm({ ...ticketForm, subject: e.target.value })}
              placeholder="Brief description of your issue"
              data-testid="input-ticket-subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Select
              value={ticketForm.category}
              onValueChange={(value) => setTicketForm({ ...ticketForm, category: value })}
            >
              <SelectTrigger data-testid="select-ticket-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Question</SelectItem>
                <SelectItem value="technical">Technical Issue</SelectItem>
                <SelectItem value="payment">Payment Problem</SelectItem>
                <SelectItem value="account">Account Issue</SelectItem>
                <SelectItem value="course">Course Question</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description *</label>
            <Textarea
              value={ticketForm.description}
              onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })}
              placeholder="Please provide detailed information about your issue..."
              rows={6}
              data-testid="textarea-ticket-description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contact Email (Optional)</label>
            <Input
              type="email"
              value={ticketForm.contactEmail}
              onChange={(e) => setTicketForm({ ...ticketForm, contactEmail: e.target.value })}
              placeholder="Email for updates and responses"
              data-testid="input-ticket-email"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, you'll receive email updates about your ticket status.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={createSupportTicket}
              disabled={isSubmittingTicket || !ticketForm.subject || !ticketForm.description}
              className="flex-1"
              data-testid="button-submit-ticket"
            >
              {isSubmittingTicket ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Ticket...
                </>
              ) : (
                <>
                  <Ticket className="h-4 w-4 mr-2" />
                  Create Support Ticket
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => setCurrentView('main')}
              disabled={isSubmittingTicket}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen">
      <Navigation />
      
      {currentView === 'ai-chat' && renderAIChatView()}
      {currentView === 'create-ticket' && renderCreateTicketView()}
      
      {currentView === 'main' && (
        <>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
            <div className="text-center mb-16">
              <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-help-title">
                Help <span className="text-gradient">Center</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-help-description">
                Get instant help with KADB AI assistant, create support tickets, or browse our knowledge base.
              </p>
            </div>

            {/* KADB AI Assistant Section */}
            <div className="mb-12">
              <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="p-4 bg-blue-600 rounded-full">
                      <Bot className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl mb-2">KADB AI Assistant</CardTitle>
                  <p className="text-gray-600">
                    Get instant help with our AI-powered assistant. Ask questions about platform features, troubleshooting, and more!
                  </p>
                </CardHeader>
                <CardContent className="text-center">
                  <Button
                    size="lg"
                    onClick={() => setCurrentView('ai-chat')}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3"
                    data-testid="button-start-ai-chat"
                  >
                    <Bot className="h-5 w-5 mr-2" />
                    Chat with KADB
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid lg:grid-cols-2 gap-8 mb-16">
              <Card>
                <CardHeader className="text-center">
                  <Ticket className="mx-auto text-green-600 mb-4" size={48} />
                  <CardTitle>Create Support Ticket</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-center">
                    Need personalized help? Create a support ticket and our team will respond within 24 hours.
                  </p>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCurrentView('create-ticket')}
                    data-testid="button-create-ticket"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    Submit Support Request
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <Search className="mx-auto text-purple-600 mb-4" size={48} />
                  <CardTitle>Knowledge Base</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 text-center">
                    Browse our comprehensive knowledge base with step-by-step guides and tutorials.
                  </p>
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search knowledge base..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                      data-testid="input-knowledge-search"
                    />
                  </div>
                  <Button variant="outline" className="w-full">
                    Browse Articles
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Traditional Contact Options */}
            <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <Card className={`text-center ${!contactSettings.emailEnabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <Mail className="mx-auto text-primary mb-4" size={48} />
              <CardTitle>Email Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Get help via email within 24 hours
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!contactSettings.emailEnabled}
                onClick={() => {
                  if (contactSettings.emailEnabled) {
                    console.log('Email Support clicked');
                    window.location.href = 'mailto:support@techlearnorbit.com';
                  }
                }}
                data-testid="button-email-support"
              >
                {contactSettings.emailEnabled ? 'Contact Support' : 'Currently Unavailable'}
              </Button>
            </CardContent>
          </Card>

          <Card className={`text-center ${!contactSettings.chatEnabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <MessageSquare className="mx-auto text-primary mb-4" size={48} />
              <CardTitle>Live Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Chat with our team in real-time
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!contactSettings.chatEnabled}
                onClick={() => {
                  if (contactSettings.chatEnabled) {
                    console.log('Live Chat clicked');
                    // In real app, open chat widget
                    alert('Live chat is now available!');
                  }
                }}
                data-testid="button-live-chat"
              >
                {contactSettings.chatEnabled ? 'Start Chat' : 'Currently Unavailable'}
              </Button>
            </CardContent>
          </Card>

          <Card className={`text-center ${!contactSettings.phoneEnabled ? 'opacity-50' : ''}`}>
            <CardHeader>
              <Phone className="mx-auto text-primary mb-4" size={48} />
              <CardTitle>Phone Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Call us during business hours
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                disabled={!contactSettings.phoneEnabled}
                onClick={() => {
                  if (contactSettings.phoneEnabled) {
                    console.log('Phone Support clicked');
                    window.location.href = 'tel:+91-8000-123-456';
                  }
                }}
                data-testid="button-phone-support"
              >
                {contactSettings.phoneEnabled ? 'Call Now' : 'Currently Unavailable'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div>
          <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} data-testid={`faq-${index}`}>
                <CardHeader>
                  <CardTitle className="flex items-center text-lg">
                    <HelpCircle className="mr-3 text-primary" size={20} />
                    {faq.question}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
            </div>

            {/* FAQ Section */}
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center">Frequently Asked Questions</h2>
              <div className="space-y-6">
                {faqs.map((faq, index) => (
                  <Card key={index} data-testid={`faq-${index}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <HelpCircle className="mr-3 text-primary" size={20} />
                        {faq.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
          <Footer />
        </>
      )}
    </div>
  );
}