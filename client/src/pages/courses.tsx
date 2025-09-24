import { useState, useMemo } from "react";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Clock, Users, Star, User, Search, Filter, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

export default function Courses() {
  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses"]
  });

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [showFilters, setShowFilters] = useState(false);

  // Extract all unique categories and difficulties from courses
  const allCategories = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    const categories = courses.map(course => course.category).filter(Boolean);
    return Array.from(new Set(categories));
  }, [courses]);

  const allDifficulties = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    const difficulties = courses.map(course => course.difficulty).filter(Boolean);
    return Array.from(new Set(difficulties));
  }, [courses]);

  // Filter courses based on search criteria
  const filteredCourses = useMemo(() => {
    if (!Array.isArray(courses)) return [];
    
    return courses.filter(course => {
      // Text search (title, description, mentor name)
      const searchText = searchQuery.toLowerCase();
      const courseTitle = (course.title || '').toLowerCase();
      const courseDescription = (course.description || '').toLowerCase();
      const mentorName = course.mentor?.user ? 
        `${course.mentor.user.firstName} ${course.mentor.user.lastName}`.toLowerCase() : '';
      
      const matchesSearch = !searchQuery || 
        courseTitle.includes(searchText) ||
        courseDescription.includes(searchText) ||
        mentorName.includes(searchText);

      // Category filter
      const matchesCategory = selectedCategory === "all" || course.category === selectedCategory;

      // Difficulty filter
      const matchesDifficulty = selectedDifficulty === "all" || course.difficulty === selectedDifficulty;

      // Price range filter
      const coursePrice = parseFloat(course.price || "0");
      const matchesPrice = coursePrice >= priceRange[0] && coursePrice <= priceRange[1];

      return matchesSearch && matchesCategory && matchesDifficulty && matchesPrice;
    });
  }, [courses, searchQuery, selectedCategory, selectedDifficulty, priceRange]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedDifficulty("all");
    setPriceRange([0, 10000]);
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-courses-title">
            Browse <span className="text-gradient">Coding Courses</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-courses-description">
            Structured learning paths designed specifically for young coders. Learn at your own pace with expert guidance.
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-12">
          {/* Search Bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search courses by title, description, or mentor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg border-2 border-gray-200 focus:border-blue-500 rounded-xl"
              data-testid="input-search-courses"
            />
          </div>

          {/* Toggle Filters Button */}
          <div className="flex justify-between items-center mb-4">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
              data-testid="button-toggle-course-filters"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''} found
              </span>
              {(searchQuery || selectedCategory !== "all" || selectedDifficulty !== "all") && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                  data-testid="button-clear-course-filters"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-gray-50 rounded-xl">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger data-testid="select-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {allCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Difficulty Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
                <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                  <SelectTrigger data-testid="select-difficulty">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    {allDifficulties.map((difficulty) => (
                      <SelectItem key={difficulty} value={difficulty}>
                        {difficulty}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Price Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{priceRange[0]} - ₹{priceRange[1]}
                </label>
                <Slider
                  value={priceRange}
                  onValueChange={setPriceRange}
                  max={10000}
                  min={0}
                  step={500}
                  className="w-full"
                  data-testid="slider-course-price"
                />
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-lg animate-pulse">
                <div className="h-48 bg-gray-200 rounded mb-4"></div>
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No courses found</h3>
              <p className="text-gray-600 mb-4">
                Try adjusting your search criteria or removing some filters.
              </p>
              <Button 
                onClick={clearFilters}
                className="bg-blue-600 hover:bg-blue-700"
                data-testid="button-clear-all-course-filters"
              >
                Clear All Filters
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredCourses.map((course: any) => (
            <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`course-card-${course.id}`}>
              <div className="relative">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <Badge className="absolute top-4 left-4" variant="secondary">
                  {course.difficulty}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-xl" data-testid={`course-title-${course.id}`}>
                  {course.title}
                </CardTitle>
                <p className="text-muted-foreground" data-testid={`course-description-${course.id}`}>
                  {course.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                    <div className="flex items-center" data-testid={`course-duration-${course.id}`}>
                      <Clock size={16} className="mr-1" />
                      {course.duration}
                    </div>
                    <div className="flex items-center" data-testid={`course-mentor-${course.id}`}>
                      <User size={16} className="mr-1" />
                      {course.mentor?.user?.firstName} {course.mentor?.user?.lastName}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center" data-testid={`course-category-${course.id}`}>
                      <Badge variant="outline" className="text-xs">
                        {course.category}
                      </Badge>
                    </div>
                    <div className="flex items-center" data-testid={`course-mentor-title-${course.id}`}>
                      <span className="text-blue-600 font-medium">
                        {course.mentor?.title}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-green-600">₹{course.price}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      Best Value
                    </Badge>
                  </div>
                </div>
                <Button 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 h-11 text-base font-semibold shadow-lg" 
                  data-testid={`button-enroll-${course.id}`}
                  onClick={() => {
                    console.log(`🛒 Enrolling in course ${course.id}: ${course.title}`);
                    window.location.href = `/booking/${course.mentorId}?courseId=${course.id}`;
                  }}
                >
                  Enroll Now - ₹{course.price}
                </Button>
              </CardContent>
            </Card>
          ))
            )}
          </div>
        )}

        <div className="text-center mt-16">
          <h2 className="text-2xl font-bold text-foreground mb-4">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">
            Work with one of our mentors to create a custom learning path just for you.
          </p>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => {
              console.log('Find a Mentor button clicked');
              window.location.href = '/#discover';
            }}
            data-testid="button-find-mentor"
          >
            Find a Mentor
          </Button>
        </div>
      </div>
      <Footer />
    </div>
  );
}