import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useItem } from '@/hooks/useItems';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Calendar, 
  User, 
  Phone, 
  MessageSquare, 
  Flag,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { item, loading, error } = useItem(id);
  const { toast } = useToast();
  
  const [messageOpen, setMessageOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [sending, setSending] = useState(false);

  const isOwner = user?.id === item?.user_id;

  const handleSendMessage = async () => {
    if (!user || !item || !message.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        from_user_id: user.id,
        to_user_id: item.user_id,
        item_id: item.id,
        content: message.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Message sent!',
        description: 'The owner has been notified.',
      });
      setMessage('');
      setMessageOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    if (!user || !item || !reportReason.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        item_id: item.id,
        reason: reportReason.trim(),
      });

      if (error) throw error;

      toast({
        title: 'Report submitted',
        description: 'Thank you for helping keep our community safe.',
      });
      setReportReason('');
      setReportOpen(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to submit report',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', item.id);
      if (error) throw error;

      toast({
        title: 'Item deleted',
        description: 'Your item has been removed.',
      });
      navigate('/dashboard');
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    }
  };

  const handleStatusChange = async (newStatus: 'active' | 'claimed' | 'resolved') => {
    if (!item) return;

    try {
      const { error } = await supabase
        .from('items')
        .update({ status: newStatus })
        .eq('id', item.id);
      
      if (error) throw error;

      toast({
        title: 'Status updated',
        description: `Item marked as ${newStatus}`,
      });
      window.location.reload();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container py-12 flex justify-center">
          <Loader size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !item) {
    return (
      <Layout>
        <div className="container py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Item not found</h1>
          <Button asChild>
            <Link to="/items">Browse Items</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const statusColors = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    claimed: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    resolved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const categoryColors = {
    lost: 'bg-red-500/10 text-red-600 border-red-500/20',
    found: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  return (
    <Layout>
      <div className="container py-8">
        <Button 
          variant="ghost" 
          className="mb-6" 
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image */}
            <div className="aspect-video rounded-xl overflow-hidden bg-muted">
              {item.image_url ? (
                <img
                  src={item.image_url}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  <span className="text-8xl">📦</span>
                </div>
              )}
            </div>

            {/* Details */}
            <Card>
              <CardHeader>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge className={categoryColors[item.category]} variant="outline">
                    {item.category === 'lost' ? '🔴 Lost Item' : '🟢 Found Item'}
                  </Badge>
                  <Badge className={statusColors[item.status]} variant="outline">
                    {item.status === 'active' && <Clock className="mr-1 h-3 w-3" />}
                    {item.status === 'resolved' && <CheckCircle className="mr-1 h-3 w-3" />}
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground whitespace-pre-wrap">{item.description}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{item.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Date</p>
                      <p className="font-medium">{format(new Date(item.item_date), 'MMMM d, yyyy')}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Posted By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{item.profiles?.name || 'Unknown'}</p>
                    <p className="text-sm text-muted-foreground">
                      Posted {format(new Date(item.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>

                {item.contact_number && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{item.contact_number}</span>
                  </div>
                )}

                {user && !isOwner && (
                  <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Contact Owner
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Message</DialogTitle>
                        <DialogDescription>
                          Send a message to the owner about this item
                        </DialogDescription>
                      </DialogHeader>
                      <Textarea
                        placeholder="Write your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="min-h-32"
                      />
                      <Button onClick={handleSendMessage} disabled={sending || !message.trim()}>
                        {sending ? <Loader size="sm" className="mr-2" /> : null}
                        Send Message
                      </Button>
                    </DialogContent>
                  </Dialog>
                )}

                {!user && (
                  <Button asChild className="w-full">
                    <Link to="/auth">Sign in to Contact</Link>
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Owner Actions */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Manage Item</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link to={`/items/${item.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Item
                    </Link>
                  </Button>

                  {item.status !== 'resolved' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange('resolved')}
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark as Resolved
                    </Button>
                  )}

                  {item.status !== 'claimed' && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => handleStatusChange('claimed')}
                    >
                      <Clock className="mr-2 h-4 w-4" />
                      Mark as Claimed
                    </Button>
                  )}

                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Item
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Report */}
            {user && !isOwner && (
              <Dialog open={reportOpen} onOpenChange={setReportOpen}>
                <DialogTrigger asChild>
                  <Button variant="ghost" className="w-full text-muted-foreground">
                    <Flag className="mr-2 h-4 w-4" />
                    Report Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Report Item</DialogTitle>
                    <DialogDescription>
                      Report inappropriate or misleading content
                    </DialogDescription>
                  </DialogHeader>
                  <Textarea
                    placeholder="Please describe the issue..."
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="min-h-32"
                  />
                  <Button 
                    onClick={handleReport} 
                    disabled={sending || !reportReason.trim()}
                    variant="destructive"
                  >
                    {sending ? <Loader size="sm" className="mr-2" /> : null}
                    Submit Report
                  </Button>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          onConfirm={handleDelete}
          variant="destructive"
        />
      </div>
    </Layout>
  );
};

export default ItemDetail;
