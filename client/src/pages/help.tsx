import { useEffect, useState } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";

export default function Help() {
  const [contactSettings, setContactSettings] = useState({
    emailEnabled: false,
    chatEnabled: false,
    phoneEnabled: false,
  });

  useEffect(() => {
    // Fetch admin contact settings
    fetch("/api/admin/contact-settings")
      .then((res) => res.json())
      .then((settings) => setContactSettings(settings))
      .catch(() => {
        // Default to all disabled
        setContactSettings({ emailEnabled: false, chatEnabled: false, phoneEnabled: false });
      });
  }, []);

  const faqs = [
    {
      question: "How do I book a session with a mentor?",
      answer: "Browse our mentors, click on a profile, and then click 'Book a Session'. Fill in the required details and submit the form."
    },
    {
      question: "What age groups do you support?",
      answer: "We primarily serve children ages 6-17, with age-appropriate content and teaching methods for each group."
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

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-help-title">
            Help <span className="text-gradient">Center</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-help-description">
            Find answers to common questions or get in touch with our support team.
          </p>
        </div>

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
                    window.location.href = 'mailto:support@codeconnect.com';
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
      </div>
      <Footer />
    </div>
  );
}