import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Trash2, AlertCircle, Plus } from 'lucide-react';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const createWhitelistSchema = z.object({
  contentPattern: z.string().min(3, 'Pattern must be at least 3 characters'),
  modality: z.enum(['text', 'audio', 'chat', 'video', 'screen']),
  subjectName: z.string().min(2, 'Subject name is required'),
  reason: z.string().min(10, 'Please provide a detailed reason (min 10 characters)'),
});

interface WhitelistEntry {
  id: number;
  contentPattern: string;
  modality: 'text' | 'audio' | 'chat' | 'video' | 'screen';
  subjectName: string;
  reason: string;
  createdAt: string;
  originalLogId: number;
}

export default function WhitelistManagement() {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<WhitelistEntry | null>(null);

  const form = useForm<z.infer<typeof createWhitelistSchema>>({
    resolver: zodResolver(createWhitelistSchema),
    defaultValues: {
      contentPattern: '',
      modality: 'text',
      subjectName: '',
      reason: '',
    },
  });

  const { data: whitelistEntries, isLoading } = useQuery<WhitelistEntry[]>({
    queryKey: ['/api/admin/moderation-whitelist'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof createWhitelistSchema>) => {
      return apiRequest('POST', '/api/admin/moderation-whitelist', {
        ...data,
        originalLogId: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation-whitelist'] });
      toast({
        title: 'Whitelist Entry Created',
        description: 'The content pattern has been added to the whitelist.',
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create whitelist entry',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/moderation-whitelist/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation-whitelist'] });
      toast({
        title: 'Whitelist Entry Removed',
        description: 'The entry has been removed from the moderation whitelist.',
      });
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete whitelist entry',
        variant: 'destructive',
      });
    },
  });

  const handleDelete = (entry: WhitelistEntry) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (entryToDelete) {
      deleteMutation.mutate(entryToDelete.id);
    }
  };

  const getModalityBadgeColor = (modality: string) => {
    switch (modality) {
      case 'text': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'audio': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'chat': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'video': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'screen': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const onSubmit = (data: z.infer<typeof createWhitelistSchema>) => {
    createMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2" data-testid="text-page-title">Moderation Whitelist Management</h1>
        <p className="text-muted-foreground" data-testid="text-page-description">
          Manage benign content patterns that should not trigger moderation alerts
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Whitelist Entry
          </CardTitle>
          <CardDescription>
            Manually add content patterns that should be allowed in educational contexts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="contentPattern"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content Pattern</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., anatomy diagram, medical terminology" 
                        {...field} 
                        data-testid="input-content-pattern"
                      />
                    </FormControl>
                    <FormDescription>
                      The content or keyword pattern to whitelist
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="modality"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modality</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-modality">
                            <SelectValue placeholder="Select modality" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="audio">Audio</SelectItem>
                          <SelectItem value="chat">Chat</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="screen">Screen</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Content type
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="subjectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., Biology, Medicine" 
                          {...field} 
                          data-testid="input-subject-name"
                        />
                      </FormControl>
                      <FormDescription>
                        Educational subject
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Explain why this content should be whitelisted..."
                        {...field}
                        data-testid="textarea-reason"
                      />
                    </FormControl>
                    <FormDescription>
                      Provide a detailed explanation for whitelisting this pattern
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                disabled={createMutation.isPending}
                data-testid="button-create-whitelist"
              >
                {createMutation.isPending ? 'Adding...' : 'Add to Whitelist'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Whitelisted Content Patterns</CardTitle>
          <CardDescription>
            Content patterns marked as benign for educational purposes will not trigger alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground" data-testid="text-loading">
              Loading whitelist entries...
            </div>
          ) : !whitelistEntries || whitelistEntries.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-muted-foreground" data-testid="text-no-entries">
                No whitelist entries found. Add entries using the form above or the "Mark as Benign" button in the moderation review page.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Content Pattern</TableHead>
                  <TableHead>Modality</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Log ID</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {whitelistEntries.map((entry) => (
                  <TableRow key={entry.id} data-testid={`row-whitelist-${entry.id}`}>
                    <TableCell className="font-mono text-sm max-w-xs truncate" data-testid={`text-pattern-${entry.id}`}>
                      {entry.contentPattern}
                    </TableCell>
                    <TableCell>
                      <Badge className={getModalityBadgeColor(entry.modality)} data-testid={`badge-modality-${entry.id}`}>
                        {entry.modality}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`text-subject-${entry.id}`}>{entry.subjectName}</TableCell>
                    <TableCell className="max-w-xs truncate" data-testid={`text-reason-${entry.id}`}>
                      {entry.reason}
                    </TableCell>
                    <TableCell data-testid={`text-created-${entry.id}`}>
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell data-testid={`text-log-id-${entry.id}`}>{entry.originalLogId}</TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(entry)}
                        disabled={deleteMutation.isPending}
                        data-testid={`button-delete-${entry.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent data-testid="dialog-delete-confirm">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Whitelist Entry?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the following pattern from the whitelist. Content matching this pattern will be subject to normal moderation again.
              {entryToDelete && (
                <div className="mt-4 p-3 bg-muted rounded-md space-y-2">
                  <div><strong>Pattern:</strong> {entryToDelete.contentPattern}</div>
                  <div><strong>Subject:</strong> {entryToDelete.subjectName}</div>
                  <div><strong>Modality:</strong> {entryToDelete.modality}</div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? 'Removing...' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
