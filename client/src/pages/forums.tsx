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
import { MessageSquare, Plus, Clock, User, Tag } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ForumCategory {
  id: string;
  name: string;
  description?: string;
  color?: string;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  authorId: string;
  categoryId: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  replyCount: number;
  isLocked: boolean;
  isPinned: boolean;
  category?: ForumCategory;
}

export default function Forums() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    title: "",
    content: "",
    categoryId: "",
    tags: ""
  });
  const { toast } = useToast();

  // Fetch forum categories
  const { data: categories = [] } = useQuery<ForumCategory[]>({
    queryKey: ['/api/forum/categories']
  });

  // Fetch forum posts
  const { data: posts = [], isLoading } = useQuery<ForumPost[]>({
    queryKey: ['/api/forum/posts', selectedCategory],
    queryFn: async () => {
      const params = selectedCategory !== "all" ? `?category=${selectedCategory}` : "";
      const response = await fetch(`/api/forum/posts${params}`);
      return response.json();
    }
  });

  // Create post mutation
  const createPostMutation = useMutation({
    mutationFn: (postData: any) => apiRequest('POST', '/api/forum/posts', {
      ...postData,
      tags: postData.tags ? postData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean) : []
      // Server will determine authorId from session
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setIsCreatePostOpen(false);
      setNewPost({ title: "", content: "", categoryId: "", tags: "" });
      toast({
        title: "Post created!",
        description: "Your forum post has been created successfully."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
    }
  });

  const handleCreatePost = () => {
    // Comprehensive validation
    // Title validation
    const trimmedTitle = newPost.title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Title Required",
        description: "Please enter a post title.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length < 5) {
      toast({
        title: "Title Too Short",
        description: "Post title must be at least 5 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedTitle.length > 150) {
      toast({
        title: "Title Too Long",
        description: "Post title must be less than 150 characters.",
        variant: "destructive"
      });
      return;
    }

    // Content validation
    const trimmedContent = newPost.content.trim();
    if (!trimmedContent) {
      toast({
        title: "Content Required",
        description: "Please provide content for your post.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedContent.length < 10) {
      toast({
        title: "Content Too Short",
        description: "Post content must be at least 10 characters long.",
        variant: "destructive"
      });
      return;
    }

    if (trimmedContent.length > 10000) {
      toast({
        title: "Content Too Long",
        description: "Post content must be less than 10,000 characters.",
        variant: "destructive"
      });
      return;
    }

    // Category validation
    if (!newPost.categoryId) {
      toast({
        title: "Category Required",
        description: "Please select a category for your post.",
        variant: "destructive"
      });
      return;
    }

    // Tags validation (optional but limit total number)
    if (newPost.tags && newPost.tags.trim()) {
      const tagsArray = newPost.tags.split(',').map(tag => tag.trim()).filter(Boolean);
      if (tagsArray.length > 5) {
        toast({
          title: "Too Many Tags",
          description: "You can add a maximum of 5 tags.",
          variant: "destructive"
        });
        return;
      }
    }

    createPostMutation.mutate(newPost);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen">
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-6" data-testid="text-forums-title">
            Discussion <span className="text-gradient">Forums</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto" data-testid="text-forums-description">
            Connect with fellow coders, ask questions, share knowledge, and get help from the community.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={selectedCategory === "all" ? "default" : "outline"}
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-all"
            >
              All Posts
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

          <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-post">
                <Plus className="mr-2 h-4 w-4" />
                Create Post
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl" data-testid="dialog-create-post">
              <DialogHeader>
                <DialogTitle>Create New Forum Post</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Post title"
                  value={newPost.title}
                  onChange={(e) => setNewPost({...newPost, title: e.target.value})}
                  data-testid="input-post-title"
                />
                
                <Select 
                  value={newPost.categoryId} 
                  onValueChange={(value) => setNewPost({...newPost, categoryId: value})}
                >
                  <SelectTrigger data-testid="select-category">
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
                  placeholder="What would you like to discuss?"
                  value={newPost.content}
                  onChange={(e) => setNewPost({...newPost, content: e.target.value})}
                  rows={6}
                  data-testid="textarea-post-content"
                />
                
                <Input
                  placeholder="Tags (comma separated)"
                  value={newPost.tags}
                  onChange={(e) => setNewPost({...newPost, tags: e.target.value})}
                  data-testid="input-post-tags"
                />
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreatePostOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                    data-testid="button-submit-post"
                  >
                    {createPostMutation.isPending ? "Creating..." : "Create Post"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">Loading posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No posts yet</h3>
              <p className="text-muted-foreground">Be the first to start a discussion!</p>
            </div>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-md transition-shadow" data-testid={`post-${post.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {post.isPinned && <Badge variant="secondary">Pinned</Badge>}
                        {post.isLocked && <Badge variant="destructive">Locked</Badge>}
                        {post.category && (
                          <Badge variant="outline" style={{ backgroundColor: post.category.color }}>
                            {post.category.name}
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl" data-testid={`post-title-${post.id}`}>
                        {post.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 line-clamp-3" data-testid={`post-content-${post.id}`}>
                    {post.content}
                  </p>
                  
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          <Tag className="mr-1 h-3 w-3" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>Student {post.authorId.slice(-1)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{post.replyCount} replies</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
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