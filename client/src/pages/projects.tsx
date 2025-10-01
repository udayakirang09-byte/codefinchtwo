import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Navigation from "@/components/navigation";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trophy, Plus, Clock, User, ExternalLink, Github, Star, Eye } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ProjectCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface Project {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  authorId: string;
  technologies?: string[];
  difficulty?: string;
  githubUrl?: string;
  liveUrl?: string;
  imageUrl?: string;
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
  likesCount: number;
  viewsCount: number;
  category?: ProjectCategory;
}

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [isShareProjectOpen, setIsShareProjectOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    categoryId: "",
    technologies: "",
    difficulty: "beginner",
    githubUrl: "",
    liveUrl: ""
  });
  const { toast } = useToast();

  // Fetch project categories
  const { data: categories = [] } = useQuery<ProjectCategory[]>({
    queryKey: ['/api/projects/categories']
  });

  // Fetch projects
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects', selectedCategory, selectedDifficulty],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCategory !== "all") params.append("category", selectedCategory);
      if (selectedDifficulty !== "all") params.append("difficulty", selectedDifficulty);
      params.append("published", "true");
      
      const response = await fetch(`/api/projects?${params}`);
      return response.json();
    }
  });

  // Create project mutation
  const shareProjectMutation = useMutation({
    mutationFn: (projectData: any) => apiRequest('POST', '/api/projects', {
      ...projectData,
      technologies: projectData.technologies ? projectData.technologies.split(',').map((tech: string) => tech.trim()).filter(Boolean) : []
      // Server will determine authorId from session
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setIsShareProjectOpen(false);
      setNewProject({
        title: "",
        description: "",
        categoryId: "",
        technologies: "",
        difficulty: "beginner",
        githubUrl: "",
        liveUrl: ""
      });
      toast({
        title: "Project shared!",
        description: "Your project has been shared with the community."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to share project. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleShareProject = () => {
    // Comprehensive validation
    // Title validation
    const trimmedTitle = newProject.title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a project title.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length < 5) {
      toast({
        title: "Title Too Short",
        description: "Project title must be at least 5 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length > 100) {
      toast({
        title: "Title Too Long",
        description: "Project title must be less than 100 characters.",
        variant: "destructive"
      });
      return;
    }

    // Description validation
    const trimmedDescription = newProject.description.trim();
    if (!trimmedDescription) {
      toast({
        title: "Description Required",
        description: "Please provide a project description.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedDescription.length < 20) {
      toast({
        title: "Description Too Short",
        description: "Project description must be at least 20 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedDescription.length > 5000) {
      toast({
        title: "Description Too Long",
        description: "Project description must be less than 5000 characters.",
        variant: "destructive"
      });
      return;
    }

    // Category validation
    if (!newProject.categoryId) {
      toast({
        title: "Category Required",
        description: "Please select a category for your project.",
        variant: "destructive"
      });
      return;
    }

    // Technologies/Tags validation (optional but limit if provided)
    if (newProject.technologies && newProject.technologies.trim()) {
      const techArray = newProject.technologies.split(',').map(tech => tech.trim()).filter(Boolean);
      if (techArray.length > 5) {
        toast({
          title: "Too Many Technologies",
          description: "You can add a maximum of 5 technologies/tags.",
          variant: "destructive"
        });
        return;
      }
    }

    // GitHub URL validation (optional but must be valid if provided)
    if (newProject.githubUrl && newProject.githubUrl.trim()) {
      const trimmedGithubUrl = newProject.githubUrl.trim();
      try {
        const url = new URL(trimmedGithubUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        toast({
          title: "Invalid GitHub URL",
          description: "Please enter a valid URL starting with http:// or https://",
          variant: "destructive"
        });
        return;
      }
    }

    // Live Demo URL validation (optional but must be valid if provided)
    if (newProject.liveUrl && newProject.liveUrl.trim()) {
      const trimmedLiveUrl = newProject.liveUrl.trim();
      try {
        const url = new URL(trimmedLiveUrl);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') {
          throw new Error('Invalid protocol');
        }
      } catch {
        toast({
          title: "Invalid Live Demo URL",
          description: "Please enter a valid URL starting with http:// or https://",
          variant: "destructive"
        });
        return;
      }
    }

    shareProjectMutation.mutate(newProject);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-projects-title">
            Project <span className="text-gradient">Showcase</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-projects-description">
            Discover amazing projects built by young coders, get inspired, and share your own creations.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-all-categories"
            >
              All Categories
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`filter-${category.name.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-[150px]" data-testid="select-difficulty">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={isShareProjectOpen} onOpenChange={setIsShareProjectOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-share-project">
                  <Plus className="mr-2 h-4 w-4" />
                  Share Project
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl" data-testid="dialog-share-project">
                <DialogHeader>
                  <DialogTitle>Share Your Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    placeholder="Project title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    data-testid="input-project-title"
                  />
                  
                  <Select 
                    value={newProject.categoryId} 
                    onValueChange={(value) => setNewProject({...newProject, categoryId: value})}
                  >
                    <SelectTrigger data-testid="select-project-category">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    placeholder="Describe your project and what it does"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    rows={4}
                    data-testid="textarea-project-description"
                  />

                  <Input
                    placeholder="Technologies used (comma separated, e.g., React, Node.js, Python)"
                    value={newProject.technologies}
                    onChange={(e) => setNewProject({...newProject, technologies: e.target.value})}
                    data-testid="input-project-technologies"
                  />

                  <Select 
                    value={newProject.difficulty} 
                    onValueChange={(value) => setNewProject({...newProject, difficulty: value})}
                  >
                    <SelectTrigger data-testid="select-project-difficulty">
                      <SelectValue placeholder="Difficulty level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Input
                    placeholder="GitHub URL (optional)"
                    value={newProject.githubUrl}
                    onChange={(e) => setNewProject({...newProject, githubUrl: e.target.value})}
                    data-testid="input-project-github"
                  />
                  
                  <Input
                    placeholder="Live demo URL (optional)"
                    value={newProject.liveUrl}
                    onChange={(e) => setNewProject({...newProject, liveUrl: e.target.value})}
                    data-testid="input-project-live-url"
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsShareProjectOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleShareProject}
                      disabled={shareProjectMutation.isPending}
                      data-testid="button-submit-project"
                    >
                      {shareProjectMutation.isPending ? "Sharing..." : "Share Project"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-gray-200 rounded mb-4"></div>
                  <div className="flex gap-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : projects.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
              <p className="text-muted-foreground">Be the first to share your amazing project!</p>
            </div>
          ) : (
            projects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow" data-testid={`project-${project.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {project.isFeatured && <Badge variant="secondary">Featured</Badge>}
                        {project.category && (
                          <Badge variant="outline" style={{ backgroundColor: project.category.color }}>
                            {project.category.name}
                          </Badge>
                        )}
                        {project.difficulty && (
                          <Badge className={getDifficultyColor(project.difficulty)}>
                            {project.difficulty}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-lg" data-testid={`project-title-${project.id}`}>
                        {project.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`project-description-${project.id}`}>
                    {project.description}
                  </p>
                  
                  {project.technologies && project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Student {project.authorId.slice(-1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4" />
                        <span>{project.likesCount || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{project.viewsCount || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {project.githubUrl && (
                      <Button size="sm" variant="outline" asChild data-testid={`project-github-${project.id}`}>
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                          <Github className="h-4 w-4 mr-1" />
                          Code
                        </a>
                      </Button>
                    )}
                    {project.liveUrl && (
                      <Button size="sm" variant="outline" asChild data-testid={`project-demo-${project.id}`}>
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          Demo
                        </a>
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>Shared {formatDate(project.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}