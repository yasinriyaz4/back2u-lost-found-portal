import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Loader } from '@/components/ui/loader';
import { useToast } from '@/hooks/use-toast';
import { 
  Users, 
  Package, 
  Flag, 
  Trash2, 
  Eye,
  Shield,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import { Profile, Item, Report } from '@/types/database';

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<Profile[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const [usersRes, itemsRes, reportsRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('items').select('*, profiles(*)').order('created_at', { ascending: false }),
          supabase.from('reports').select('*, profiles(*), items(*)').order('created_at', { ascending: false }),
        ]);

        setUsers((usersRes.data as Profile[]) || []);
        setItems((itemsRes.data as unknown as Item[]) || []);
        setReports((reportsRes.data as unknown as Report[]) || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, navigate]);

  const handleDeleteUser = async () => {
    if (!deleteUserId) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', deleteUserId);
      if (error) throw error;

      setUsers(users.filter(u => u.id !== deleteUserId));
      toast({ title: 'User deleted', description: 'User has been removed.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete user', variant: 'destructive' });
    } finally {
      setDeleteUserId(null);
    }
  };

  const handleDeleteItem = async () => {
    if (!deleteItemId) return;

    try {
      const { error } = await supabase.from('items').delete().eq('id', deleteItemId);
      if (error) throw error;

      setItems(items.filter(i => i.id !== deleteItemId));
      toast({ title: 'Item deleted', description: 'Item has been removed.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete item', variant: 'destructive' });
    } finally {
      setDeleteItemId(null);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);
      
      if (error) throw error;

      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      toast({ title: 'Report resolved' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to resolve report', variant: 'destructive' });
    }
  };

  if (!isAdmin) {
    return null;
  }

  const lostItems = items.filter(i => i.category === 'lost');
  const foundItems = items.filter(i => i.category === 'found');
  const pendingReports = reports.filter(r => r.status === 'pending');

  return (
    <Layout showFooter={false}>
      <div className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Admin Panel</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader size="lg" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Total Users
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{users.length}</div>
                </CardContent>
              </Card>
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
                    Lost/Found Ratio
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {lostItems.length}:{foundItems.length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Pending Reports
                  </CardTitle>
                  <Flag className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pendingReports.length}</div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users">
              <TabsList className="mb-6">
                <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
                <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
                <TabsTrigger value="reports">
                  Reports 
                  {pendingReports.length > 0 && (
                    <Badge className="ml-2" variant="destructive">{pendingReports.length}</Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users">
                <Card>
                  <CardHeader>
                    <CardTitle>All Users</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>{format(new Date(u.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              {u.id !== user?.id && (
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setDeleteUserId(u.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="items">
                <Card>
                  <CardHeader>
                    <CardTitle>All Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Category</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={
                                item.category === 'lost' 
                                  ? 'bg-red-500/10 text-red-600' 
                                  : 'bg-green-500/10 text-green-600'
                              }>
                                {item.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{item.status}</Badge>
                            </TableCell>
                            <TableCell>{item.profiles?.name || 'Unknown'}</TableCell>
                            <TableCell>{format(new Date(item.created_at), 'MMM d, yyyy')}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="icon" asChild>
                                  <Link to={`/items/${item.id}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon"
                                  onClick={() => setDeleteItemId(item.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reports">
                <Card>
                  <CardHeader>
                    <CardTitle>Reports</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {reports.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No reports yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reports.map((report) => (
                            <TableRow key={report.id}>
                              <TableCell className="font-medium">{report.item?.title || 'Deleted'}</TableCell>
                              <TableCell className="max-w-xs truncate">{report.reason}</TableCell>
                              <TableCell>{report.reporter?.name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge variant={report.status === 'pending' ? 'destructive' : 'secondary'}>
                                  {report.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(report.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {report.item_id && (
                                    <Button variant="ghost" size="icon" asChild>
                                      <Link to={`/items/${report.item_id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}
                                  {report.status === 'pending' && (
                                    <Button 
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleResolveReport(report.id)}
                                    >
                                      Resolve
                                    </Button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>

      <ConfirmDialog
        open={!!deleteUserId}
        onOpenChange={(open) => !open && setDeleteUserId(null)}
        title="Delete User"
        description="This will permanently delete this user and all their data. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteUser}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteItemId}
        onOpenChange={(open) => !open && setDeleteItemId(null)}
        title="Delete Item"
        description="This will permanently delete this item. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteItem}
        variant="destructive"
      />
    </Layout>
  );
};

export default Admin;
