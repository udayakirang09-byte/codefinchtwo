import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, Mail, Phone, MessageSquare } from "lucide-react";

export default function Help() {
  const faqs = [
    {
      question: "How do I book a session with a mentor?",
      answer: "Browse our mentors, click on a profile, and then click 'Book a Session'. Fill in the required details and submit the form."
    },
    {
      question: "Is the platform safe for children?",
      answer: "Yes! We have strict safety guidelines, background checks for mentors, and encourage parent supervision during sessions."
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
          <Card className="text-center">
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
                onClick={() => {
                  console.log('Email Support clicked');
                  alert('Email support coming soon! support@codeconnect.com');
                }}
                data-testid="button-email-support"
              >
                Contact Support
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
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
                onClick={() => {
                  console.log('Live Chat clicked');
                  alert('Live chat coming soon! Email us for now.');
                }}
                data-testid="button-live-chat"
              >
                Start Chat
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
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
                onClick={() => {
                  console.log('Phone Support clicked');
                  alert('Phone support coming soon! Email us for urgent matters.');
                }}
                data-testid="button-phone-support"
              >
                Call Now
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