import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, ArrowLeft, MessageSquare, User, Eye } from 'lucide-react';
import { db } from '@/db/api';
import { toast } from 'sonner';
import type { Conversation } from '@/types/types';
import { formatDistanceToNow } from 'date-fns';

export default function ConversationManagement() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    filterConversations();
  }, [searchQuery, conversations]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      // Get all users and their conversations
      const users = await db.profiles.listAll();
      const allConversations: Conversation[] = [];
      
      // Sample first 20 users to avoid timeout
      for (const user of users.slice(0, 20)) {
        try {
          const userConversations = await db.conversations.list(user.id, 1);
          allConversations.push(...userConversations);
        } catch (error) {
          console.error(`Error loading conversations for user ${user.id}:`, error);
        }
      }
      
      // Sort by most recent
      allConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      
      setConversations(allConversations);
      setFilteredConversations(allConversations);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) =>
      conv.title?.toLowerCase().includes(query) ||
      conv.id.toLowerCase().includes(query)
    );
    setFilteredConversations(filtered);
  };

  return (
    <div className="min-h-screen relative">
      <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-primary/5" />
      
      <div className="relative container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl font-bold mb-2">Conversation Management</h1>
          <p className="text-muted-foreground">
            View and manage all user conversations with NewMe
          </p>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>All Conversations</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Loading conversations...</div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 'No conversations found matching your search' : 'No conversations yet'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Messages</TableHead>
                      <TableHead>Last Updated</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredConversations.map((conv) => (
                      <TableRow key={conv.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-muted-foreground" />
                            <span className="font-medium">{conv.title || 'Untitled Conversation'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">{conv.user_id.slice(0, 8)}...</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Array.isArray(conv.messages) ? conv.messages.length : 0} messages
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                        </TableCell>
                        <TableCell>
                          <Badge variant={conv.is_archived ? 'secondary' : 'default'}>
                            {conv.is_archived ? 'Archived' : 'Active'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedConversation(conv);
                              setDetailsOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Conversation Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedConversation?.title || 'Untitled Conversation'}
              </DialogTitle>
              <DialogDescription>
                Conversation details and message history
              </DialogDescription>
            </DialogHeader>
            {selectedConversation && (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">User ID</p>
                    <p className="text-sm">{selectedConversation.user_id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant={selectedConversation.is_archived ? 'secondary' : 'default'}>
                      {selectedConversation.is_archived ? 'Archived' : 'Active'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Created</p>
                    <p className="text-sm">
                      {new Date(selectedConversation.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                    <p className="text-sm">
                      {formatDistanceToNow(new Date(selectedConversation.updated_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">Messages</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {Array.isArray(selectedConversation.messages) && selectedConversation.messages.length > 0 ? (
                      selectedConversation.messages.map((msg: any, idx: number) => (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${
                            msg.sender === 'user'
                              ? 'bg-primary/10 ml-4'
                              : 'bg-muted mr-4'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-medium">
                              {msg.sender === 'user' ? 'User' : 'NewMe'}
                            </span>
                            {msg.created_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.created_at).toLocaleTimeString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm">{msg.message || msg.content || ''}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground">No messages in this conversation</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

