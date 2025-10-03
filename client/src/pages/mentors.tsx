import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Star, Users, BookOpen, Clock, Search, Filter, X } from "lucide-react";

export default function Mentors() {
  const { data: mentors, isLoading } = useQuery({
    queryKey: ["/api/mentors"]
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedExperience, setSelectedExperience] = useState("all");
  const [ratingFilter, setRatingFilter] = useState(0);
  const [priceRange, setPriceRange] = useState([0, 200]);
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique specialties from mentors
  const allSpecialties = useMemo(() => {
    if (!Array.isArray(mentors)) return [];
    const specialties = mentors.flatMap(mentor => mentor.specialties || []);
    return Array.from(new Set(specialties));
  }, [mentors]);

  // Filter mentors based on search criteria
  const filteredMentors = useMemo(() => {
    if (!Array.isArray(mentors)) return [];
    
    return mentors.filter(mentor => {
      // Text search (name, title, description)
      const searchText = searchQuery.toLowerCase();
      const mentorName = mentor.user ? `${mentor.user.firstName} ${mentor.user.lastName}`.toLowerCase() : '';
      const mentorTitle = (mentor.title || '').toLowerCase();
      const mentorDescription = (mentor.description || '').toLowerCase();
      
      const matchesSearch = !searchQuery || 
        mentorName.includes(searchText) ||
        mentorTitle.includes(searchText) ||
        mentorDescription.includes(searchText);

      // Specialty filter
      const matchesSpecialty = selectedSpecialty === "all" || 
        (mentor.specialties && mentor.specialties.includes(selectedSpecialty));

      // Experience filter
      const mentorExperience = mentor.experience || 1;
      const matchesExperience = selectedExperience === "all" ||
        (selectedExperience === "beginner" && mentorExperience <= 2) ||
        (selectedExperience === "intermediate" && mentorExperience > 2 && mentorExperience <= 5) ||
        (selectedExperience === "expert" && mentorExperience > 5);

      // Rating filter
      const mentorRating = parseFloat(mentor.rating || "4.5");
      const matchesRating = mentorRating >= ratingFilter;

      // Price range filter
      const mentorRate = mentor.hourlyRate || 50;
      const matchesPrice = mentorRate >= priceRange[0] && mentorRate <= priceRange[1];

      return matchesSearch && matchesSpecialty && matchesExperience && matchesRating && matchesPrice;
    });
  }, [mentors, searchQuery, selectedSpecialty, selectedExperience, ratingFilter, priceRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedSpecialty("all");
    setSelectedExperience("all");
    setRatingFilter(0);
    setPriceRange([0, 200]);
  };

  const handleBookMentor = (mentorId: string) => {
    console.log(`📅 Booking session with mentor ${mentorId}`);
    window.location.href = `/booking/${mentorId}`;
  };

  const handleViewProfile = (mentorId: string) => {
    console.log(`👤 Viewing profile for mentor ${mentorId}`);
    window.location.href = `/mentors/${mentorId}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Coding Mentor 🎓</h1>
          <p className="text-xl text-gray-600">Connect with experienced developers and accelerate your learning journey</p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search mentors by name, specialty, or expertise..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              data-testid="input-search-mentors"
            />
          </div>

          {/* Toggle Filters Button */}
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              data-testid="button-toggle-filters"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredMentors.length} mentor{filteredMentors.length !== 1 ? 's' : ''} found
              </span>
              {(searchQuery || selectedSpecialty !== "all" || selectedExperience !== "all" || ratingFilter > 0) && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  data-testid="button-clear-filters"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-gray-50 rounded-xl">
              {/* Specialty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                  <SelectTrigger data-testid="select-specialty">
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Specialties</SelectItem>
                    {allSpecialties.map((specialty) => (
                      <SelectItem key={specialty} value={specialty}>
                        {specialty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Experience Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
                <Select value={selectedExperience} onValueChange={setSelectedExperience}>
                  <SelectTrigger data-testid="select-experience">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="beginner">Beginner (1-2 years)</SelectItem>
                    <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                    <SelectItem value="expert">Expert (5+ years)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rating: {ratingFilter}★
                </label>
                <Slider
                  value={[ratingFilter]}
                  onValueChange={(value) => setRatingFilter(value[0])}
                  max={5}
                  min={0}
                  step={0.5}
                  className="w-full"
                  data-testid="slider-rating"
                />
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ${priceRange[0]} - ${priceRange[1]}/hour
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={200}
                  min={0}
                  step={10}
                  className="w-full"
                  data-testid="slider-price"
                />
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : filteredMentors.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No mentors found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or removing some filters.
              </p>
              <Button 
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-clear-all-filters"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMentors.map((mentor: any) => (
              <Card key={mentor.id} className="group hover:shadow-xl transition-all duration-300 transform hover:scale-105 bg-white border-0">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {mentor.title?.charAt(0) || 'M'}
                    </div>
                    <Badge className="bg-yellow-100 text-yellow-800">
                      <Star className="h-3 w-3 mr-1" />
                      {mentor.rating || '4.8'}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-800" data-testid={`text-mentor-name-${mentor.id}`}>
                    {mentor.user ? `${mentor.user.firstName} ${mentor.user.lastName}` : 'Expert Coding Mentor'}
                  </CardTitle>
                  <p className="text-sm font-medium text-blue-600 mb-2" data-testid={`text-mentor-title-${mentor.id}`}>
                    {mentor.title || 'Expert Coding Mentor'}
                  </p>
                  <p className="text-gray-600 line-clamp-2">
                    {mentor.description || 'Experienced developer ready to help you master programming skills'}
                  </p>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      {mentor.totalStudents || 0} students
                    </span>
                    <span className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-1" />
                      {mentor.experience || 0} years
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1 mb-2">
                      {(mentor.specialties || []).map((specialty: string) => (
                        <Badge key={specialty} variant="outline" className="text-xs">
                          {specialty}
                        </Badge>
                      ))}
                    </div>
                    {mentor.hourlyRate && (
                      <p className="text-lg font-bold text-green-600">
                        ${mentor.hourlyRate}/hour
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleViewProfile(mentor.id)}
                      className="flex-1"
                      data-testid={`button-view-profile-${mentor.id}`}
                    >
                      View Profile
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => handleBookMentor(mentor.id)}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      data-testid={`button-book-mentor-${mentor.id}`}
                    >
                      Book Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
            }
          </div>
        )}
      </div>
    </div>
  );
}