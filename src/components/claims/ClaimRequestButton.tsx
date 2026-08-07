import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader } from '@/components/ui/loader';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ClaimRequest } from '@/hooks/useClaimRequests';
import { HandMetal, X, Clock, CheckCircle, XCircle } from 'lucide-react';

interface ClaimRequestButtonProps {
  userClaimRequest: ClaimRequest | null;
  onSubmit: (message: string) => Promise<{ error: string | null }>;
  onCancel: (id: string) => Promise<{ error: string | null }>;
}

export const ClaimRequestButton = ({ userClaimRequest, onSubmit, onCancel }: ClaimRequestButtonProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    setSubmitting(true);
    const { error } = await onSubmit(message);
    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Claim request sent!', description: 'The owner will review your request.' });
      setMessage('');
      setOpen(false);
    }
  };

  const handleCancel = async () => {
    if (!userClaimRequest) return;
    setSubmitting(true);
    const { error } = await onCancel(userClaimRequest.id);
    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({ title: 'Request cancelled' });
    }
  };

  if (userClaimRequest) {
    const statusConfig = {
      pending: { icon: Clock, label: 'Pending Review', color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      approved: { icon: CheckCircle, label: 'Approved', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
      rejected: { icon: XCircle, label: 'Rejected', color: 'bg-red-500/10 text-red-600 border-red-500/20' },
    };
    const config = statusConfig[userClaimRequest.status];
    const Icon = config.icon;

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">Your Claim</span>
          </div>
          <Badge variant="outline" className={config.color}>{config.label}</Badge>
        </div>
        {userClaimRequest.status === 'pending' && (
          <Button variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleCancel} disabled={submitting}>
            {submitting ? <Loader size="sm" className="mr-2" /> : <X className="mr-2 h-4 w-4" />}
            Cancel Request
          </Button>
        )}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full" variant="default">
          <HandMetal className="mr-2 h-4 w-4" />
          Claim This Item
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Claim This Item</DialogTitle>
          <DialogDescription>
            Describe why you believe this item belongs to you. The owner will review your request.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Provide details to prove this is your item (e.g., identifying marks, when/where you lost it)..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="min-h-32"
        />
        <Button onClick={handleSubmit} disabled={submitting || !message.trim()}>
          {submitting ? <Loader size="sm" className="mr-2" /> : null}
          Submit Claim Request
        </Button>
      </DialogContent>
    </Dialog>
  );
};
