import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SimpleTest() {
  const [message, setMessage] = useState("Test page loaded successfully!");

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600">
              🧪 Simple System Test Page
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-lg">{message}</p>
            <p className="text-sm text-muted-foreground">
              Current URL: {window.location.href}
            </p>
            <p className="text-sm text-muted-foreground">
              Pathname: {window.location.pathname}
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={() => setMessage("Button clicked successfully!")}
                className="mr-2"
              >
                Test Button Click
              </Button>
              
              <Button 
                variant="outline"
                onClick={() => setMessage("This page is working correctly!")}
              >
                Reset Message
              </Button>
            </div>

            <div className="bg-green-100 border border-green-300 rounded p-4 mt-4">
              <p className="text-green-800 font-medium">
                ✅ This test page should stay stable without any redirects
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}