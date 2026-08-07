import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/hooks/use-toast';
import { ClaimRequest } from '@/hooks/useClaimRequests';
import { User, CheckCircle, XCircle, Clock, HandMetal } from 'lucide-react';
import { format } from 'date-fns';

interface ClaimRequestsListProps {
  claimRequests: ClaimRequest[];
  loading: boolean;
  onApprove: (id: string) => Promise<{ error: string | null }>;
  onReject: (id: string) => Promise<{ error: string | null }>;
}

export const ClaimRequestsList = ({ claimRequests, loading, onApprove, onReject }: ClaimRequestsListProps) => {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: 'approved' | 'rejected' } | null>(null);
  const { toast } = useToast();

  const pendingRequests = claimRequests.filter(r => r.status === 'pending');
  const otherRequests = claimRequests.filter(r => r.status !== 'pending');

  const handleAction = async () => {
    if (!confirmAction) return;
    setProcessingId(confirmAction.id);
    
    const fn = confirmAction.action === 'approved' ? onApprove : onReject;
    const { error } = await fn(confirmAction.id);
    
    setProcessingId(null);
    setConfirmAction(null);

    if (error) {
      toast({ title: 'Error', description: error, variant: 'destructive' });
    } else {
      toast({
        title: confirmAction.action === 'approved' ? '✅ Claim Approved' : 'Claim Rejected',
        description: confirmAction.action === 'approved'
          ? 'The claimer has been notified.'
          : 'The request has been rejected.',
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader size="sm" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HandMetal className="h-5 w-5 text-primary" />
            Claim Requests
            {pendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-auto">{pendingRequests.length} pending</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {claimRequests.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No claim requests yet.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <ClaimRequestItem
                  key={request.id}
                  request={request}
                  processing={processingId === request.id}
                  onApprove={() => setConfirmAction({ id: request.id, action: 'approved' })}
                  onReject={() => setConfirmAction({ id: request.id, action: 'rejected' })}
                />
              ))}
              {otherRequests.map(request => (
                <ClaimRequestItem key={request.id} request={request} processing={false} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title={confirmAction?.action === 'approved' ? 'Approve Claim' : 'Reject Claim'}
        description={
          confirmAction?.action === 'approved'
            ? 'Are you sure you want to approve this claim? The item will be marked as claimed.'
            : 'Are you sure you want to reject this claim request?'
        }
        confirmText={confirmAction?.action === 'approved' ? 'Approve' : 'Reject'}
        onConfirm={handleAction}
        variant={confirmAction?.action === 'rejected' ? 'destructive' : undefined}
      />
    </>
  );
};

interface ClaimRequestItemProps {
  request: ClaimRequest;
  processing: boolean;
  onApprove?: () => void;
  onReject?: () => void;
}

const ClaimRequestItem = ({ request, processing, onApprove, onReject }: ClaimRequestItemProps) => {
  const statusConfig = {
    pending: { icon: Clock, color: 'text-yellow-600' },
    approved: { icon: CheckCircle, color: 'text-green-600' },
    rejected: { icon: XCircle, color: 'text-red-600' },
  };
  const config = statusConfig[request.status];
  const StatusIcon = config.icon;

  return (
    <div className="p-3 rounded-lg border bg-card space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{request.claimer?.name || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground">{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</p>
          </div>
        </div>
        <StatusIcon className={`h-4 w-4 flex-shrink-0 ${config.color}`} />
      </div>

      {request.message && (
        <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{request.message}</p>
      )}

      {request.status === 'pending' && onApprove && onReject && (
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onApprove} disabled={processing}>
            {processing ? <Loader size="sm" /> : <><CheckCircle className="mr-1 h-3 w-3" /> Approve</>}
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={onReject} disabled={processing}>
            <XCircle className="mr-1 h-3 w-3" /> Reject
          </Button>
        </div>
      )}
    </div>
  );
};
