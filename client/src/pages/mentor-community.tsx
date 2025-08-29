import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { MessageSquare, Trophy, Calendar, Coffee, Star, Users } from "lucide-react";

export default function MentorCommunity() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4" data-testid="title-mentor-community">
            Mentor Community
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect with fellow mentors, share experiences, and grow together in our supportive community
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MessageSquare className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Discussion Forums</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Ask questions, share tips, and help each other learn
              </p>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm mb-4">
                1,245 active members
              </div>
              <Button className="w-full" data-testid="button-join-forums">Join Forums</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trophy className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Mentor Leaderboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                See top-performing mentors and learn from the best
              </p>
              <div className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-sm mb-4">
                Updated weekly
              </div>
              <Button className="w-full" data-testid="button-view-leaderboard">View Leaderboard</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Calendar className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Community Events</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Join coding challenges, workshops, and meetups
              </p>
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm mb-4">
                Next event: Tomorrow
              </div>
              <Button className="w-full" data-testid="button-view-events">View Events</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Coffee className="w-12 h-12 text-orange-600 mb-4" />
              <CardTitle>Mentor Meetups</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Local and virtual meetups for networking and collaboration
              </p>
              <div className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-sm mb-4">
                Monthly events
              </div>
              <Button className="w-full" data-testid="button-join-meetups">Join Meetups</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Star className="w-12 h-12 text-yellow-600 mb-4" />
              <CardTitle>Success Stories</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Read inspiring stories from fellow mentors and their students
              </p>
              <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-sm mb-4">
                500+ stories
              </div>
              <Button className="w-full" data-testid="button-read-stories">Read Stories</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Users className="w-12 h-12 text-indigo-600 mb-4" />
              <CardTitle>Peer Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Get help from experienced mentors and support newcomers
              </p>
              <div className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full text-sm mb-4">
                24/7 support
              </div>
              <Button className="w-full" data-testid="button-get-support">Get Support</Button>
            </CardContent>
          </Card>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Featured Community Topics</h2>
          <div className="space-y-4">
            <div className="border-l-4 border-blue-600 pl-4">
              <h3 className="font-semibold text-gray-900">How to Handle Difficult Students</h3>
              <p className="text-gray-600">Discussion about managing challenging learning situations</p>
              <div className="text-sm text-gray-500 mt-2">23 replies • Active 2 hours ago</div>
            </div>
            
            <div className="border-l-4 border-green-600 pl-4">
              <h3 className="font-semibold text-gray-900">Best Practices for Online Teaching</h3>
              <p className="text-gray-600">Tips and tricks for effective remote coding instruction</p>
              <div className="text-sm text-gray-500 mt-2">45 replies • Active 4 hours ago</div>
            </div>
            
            <div className="border-l-4 border-purple-600 pl-4">
              <h3 className="font-semibold text-gray-900">Setting Competitive Rates</h3>
              <p className="text-gray-600">How to price your mentoring services appropriately</p>
              <div className="text-sm text-gray-500 mt-2">67 replies • Active 6 hours ago</div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}