import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useItems } from '@/hooks/useItems';
import { usePoints } from '@/hooks/usePoints';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader } from '@/components/ui/loader';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, 
  Package, 
  Search as SearchIcon, 
  CheckCircle,
  Edit,
  Trash2,
  Eye,
  Star,
  Trophy
} from 'lucide-react';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { userPoints, userRank } = usePoints();
  
  const { items, loading, refetch } = useItems({
    filters: { userId: user?.id },
    limit: 50,
  });

  const lostItems = items.filter(i => i.category === 'lost');
  const foundItems = items.filter(i => i.category === 'found');
  const activeItems = items.filter(i => i.status === 'active');
  const resolvedItems = items.filter(i => i.status === 'resolved');

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', deleteId);
      if (error) throw error;

      toast({
        title: 'Item deleted',
        description: 'Your item has been removed.',
      });
      refetch();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete item',
        variant: 'destructive',
      });
    } finally {
      setDeleteId(null);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {profile?.name || 'User'}!</p>
          </div>
          <Button asChild>
            <Link to="/items/new">
              <Plus className="mr-2 h-4 w-4" />
              Post New Item
            </Link>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Items
              </CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{items.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Lost Items
              </CardTitle>
              <SearchIcon className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lostItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Found Items
              </CardTitle>
              <Package className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{foundItems.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{resolvedItems.length}</div>
            </CardContent>
          </Card>
          <Link to="/leaderboard" className="block">
            <Card className="h-full hover:bg-muted/50 transition-colors cursor-pointer border-primary/20 bg-primary/5">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Your Points
                </CardTitle>
                <Star className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">{userPoints}</div>
                {userRank && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Rank #{userRank}
                  </p>
                )}
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Items Table */}
        <Card>
          <CardHeader>
            <CardTitle>Your Items</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader size="lg" />
              </div>
            ) : items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-muted-foreground mb-4">You haven't posted any items yet</p>
                <Button asChild>
                  <Link to="/items/new">Post Your First Item</Link>
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-3">
                            {item.image_url && (
                              <img 
                                src={item.image_url} 
                                alt="" 
                                className="h-10 w-10 rounded object-cover"
                              />
                            )}
                            <span className="line-clamp-1">{item.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            item.category === 'lost' 
                              ? 'bg-red-500/10 text-red-600 border-red-500/20' 
                              : 'bg-green-500/10 text-green-600 border-green-500/20'
                          }>
                            {item.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={
                            item.status === 'active' 
                              ? 'bg-green-500/10 text-green-600 border-green-500/20'
                              : item.status === 'claimed'
                              ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/20'
                          }>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {format(new Date(item.created_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/items/${item.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                              <Link to={`/items/${item.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => setDeleteId(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </Layout>
  );
};

export default Dashboard;
