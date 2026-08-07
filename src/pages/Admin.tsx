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
  Bell,
  Link2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Profile, Item, Report, Notification, ItemMatch, AppRole } from '@/types/database';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type AdminMatch = { id: string; lost_item_id: string; found_item_id: string; match_score: number; match_reason?: string | null; status: string; created_at: string; lost_item?: Item; found_item?: Item };
type UserWithRole = Profile & { role?: AppRole };

const Admin = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [notifications, setNotifications] = useState<(Notification & { profile?: Profile })[]>([]);
  const [matches, setMatches] = useState<AdminMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteNotificationId, setDeleteNotificationId] = useState<string | null>(null);
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch data without profile joins (no FK relationships)
        const [usersRes, rolesRes, itemsRes, reportsRes, notificationsRes, matchesRes] = await Promise.all([
          supabase.from('profiles').select('*').order('created_at', { ascending: false }),
          supabase.from('user_roles').select('user_id, role'),
          supabase.from('items').select('*').order('created_at', { ascending: false }),
          supabase.from('reports').select('*').order('created_at', { ascending: false }),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }),
          supabase.from('item_matches').select('*, lost_item:items!item_matches_lost_item_id_fkey(*), found_item:items!item_matches_found_item_id_fkey(*)').order('created_at', { ascending: false }),
        ]);

        // Create a map of profiles for joining
        const profilesMap = new Map<string, Profile>();
        ((usersRes.data as Profile[]) || []).forEach(p => profilesMap.set(p.id, p));

        // Map roles to users
        const rolesMap = new Map<string, AppRole>();
        (rolesRes.data || []).forEach((r: { user_id: string; role: AppRole }) => {
          rolesMap.set(r.user_id, r.role);
        });

        const usersWithRoles: UserWithRole[] = ((usersRes.data as Profile[]) || []).map(u => ({
          ...u,
          role: rolesMap.get(u.id) || 'user'
        }));

        // Enrich items with profile data
        const itemsWithProfiles = ((itemsRes.data || []) as Item[]).map(item => ({
          ...item,
          profiles: profilesMap.get(item.user_id)
        }));

        // Enrich reports with profile and item data
        const itemsMap = new Map<string, Item>();
        itemsWithProfiles.forEach(item => itemsMap.set(item.id, item));
        
        const reportsWithData = ((reportsRes.data || []) as Report[]).map(report => ({
          ...report,
          reporter: profilesMap.get(report.reporter_id),
          item: itemsMap.get(report.item_id)
        }));

        // Enrich notifications with profile data
        const notificationsWithProfiles = ((notificationsRes.data || []) as Notification[]).map(n => ({
          ...n,
          profile: profilesMap.get(n.user_id)
        }));

        setUsers(usersWithRoles);
        setItems(itemsWithProfiles);
        setReports(reportsWithData as unknown as Report[]);
        setNotifications(notificationsWithProfiles as unknown as (Notification & { profile?: Profile })[]);
        setMatches((matchesRes.data as unknown as AdminMatch[]) || []);
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

  const handleDeleteNotification = async () => {
    if (!deleteNotificationId) return;

    try {
      const { error } = await supabase.from('notifications').delete().eq('id', deleteNotificationId);
      if (error) throw error;

      setNotifications(notifications.filter(n => n.id !== deleteNotificationId));
      toast({ title: 'Notification deleted', description: 'Notification has been removed.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' });
    } finally {
      setDeleteNotificationId(null);
    }
  };

  const handleDeleteMatch = async () => {
    if (!deleteMatchId) return;

    try {
      const { error } = await supabase.from('item_matches').delete().eq('id', deleteMatchId);
      if (error) throw error;

      setMatches(matches.filter(m => m.id !== deleteMatchId));
      toast({ title: 'Match deleted', description: 'Match has been removed.' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete match', variant: 'destructive' });
    } finally {
      setDeleteMatchId(null);
    }
  };

  const handleUpdateMatchStatus = async (matchId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('item_matches')
        .update({ status: newStatus as ItemMatch['status'] })
        .eq('id', matchId);
      
      if (error) throw error;

      setMatches(prev => prev.map(m => m.id === matchId ? { ...m, status: newStatus } : m));
      toast({ title: `Match ${newStatus}` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update match', variant: 'destructive' });
    }
  };

  const handleUpdateRole = async (userId: string, newRole: AppRole) => {
    if (userId === user?.id) {
      toast({ title: 'Error', description: 'You cannot change your own role', variant: 'destructive' });
      return;
    }

    setUpdatingRole(userId);
    try {
      // First check if a role exists
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();

      if (existingRole) {
        // Update existing role
        const { error } = await supabase
          .from('user_roles')
          .update({ role: newRole })
          .eq('user_id', userId);
        if (error) throw error;
      } else {
        // Insert new role
        const { error } = await supabase
          .from('user_roles')
          .insert({ user_id: userId, role: newRole });
        if (error) throw error;
      }

      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast({ title: 'Role updated', description: `User role changed to ${newRole}` });
    } catch (err) {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to update role', variant: 'destructive' });
    } finally {
      setUpdatingRole(null);
    }
  };

  if (!isAdmin) {
    return null;
  }

  const lostItems = items.filter(i => i.category === 'lost');
  const foundItems = items.filter(i => i.category === 'found');
  const pendingReports = reports.filter(r => r.status === 'pending');
  const pendingMatches = matches.filter(m => m.status === 'pending');
  const unreadNotifications = notifications.filter(n => !n.is_read);

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
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
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
                    Lost/Found
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Notifications
                  </CardTitle>
                  <Bell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{notifications.length}</div>
                  {unreadNotifications.length > 0 && (
                    <p className="text-xs text-muted-foreground">{unreadNotifications.length} unread</p>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Matches
                  </CardTitle>
                  <Link2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{matches.length}</div>
                  {pendingMatches.length > 0 && (
                    <p className="text-xs text-muted-foreground">{pendingMatches.length} pending</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="users">
              <TabsList className="mb-6 flex-wrap">
                <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
                <TabsTrigger value="items">Items ({items.length})</TabsTrigger>
                <TabsTrigger value="reports">
                  Reports 
                  {pendingReports.length > 0 && (
                    <Badge className="ml-2" variant="destructive">{pendingReports.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="notifications">
                  Notifications
                  {unreadNotifications.length > 0 && (
                    <Badge className="ml-2" variant="secondary">{unreadNotifications.length}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="matches">
                  Matches
                  {pendingMatches.length > 0 && (
                    <Badge className="ml-2" variant="outline">{pendingMatches.length}</Badge>
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
                          <TableHead>Role</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.id}>
                            <TableCell className="font-medium">{u.name}</TableCell>
                            <TableCell>{u.email}</TableCell>
                            <TableCell>
                              {u.id === user?.id ? (
                                <Badge variant="secondary" className="bg-primary/10 text-primary">
                                  {u.role || 'user'} (you)
                                </Badge>
                              ) : (
                                <Select
                                  value={u.role || 'user'}
                                  onValueChange={(value) => handleUpdateRole(u.id, value as AppRole)}
                                  disabled={updatingRole === u.id}
                                >
                                  <SelectTrigger className="w-[120px] h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="moderator">Moderator</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
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

              <TabsContent value="notifications">
                <Card>
                  <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {notifications.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No notifications yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notifications.map((notification) => (
                            <TableRow key={notification.id}>
                              <TableCell className="font-medium">{notification.title}</TableCell>
                              <TableCell className="max-w-xs truncate">{notification.message}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{notification.type}</Badge>
                              </TableCell>
                              <TableCell>{notification.profile?.name || 'Unknown'}</TableCell>
                              <TableCell>
                                <Badge variant={notification.is_read ? 'secondary' : 'default'}>
                                  {notification.is_read ? 'Read' : 'Unread'}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(notification.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  {notification.item_id && (
                                    <Button variant="ghost" size="icon" asChild>
                                      <Link to={`/items/${notification.item_id}`}>
                                        <Eye className="h-4 w-4" />
                                      </Link>
                                    </Button>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setDeleteNotificationId(notification.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
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

              <TabsContent value="matches">
                <Card>
                  <CardHeader>
                    <CardTitle>AI-Detected Matches</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {matches.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">No matches yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Lost Item</TableHead>
                            <TableHead>Found Item</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead>Reason</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {matches.map((match) => (
                            <TableRow key={match.id}>
                              <TableCell>
                                <Link 
                                  to={`/items/${match.lost_item_id}`} 
                                  className="font-medium text-primary hover:underline"
                                >
                                  {match.lost_item?.title || 'Deleted'}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Link 
                                  to={`/items/${match.found_item_id}`} 
                                  className="font-medium text-primary hover:underline"
                                >
                                  {match.found_item?.title || 'Deleted'}
                                </Link>
                              </TableCell>
                              <TableCell>
                                <Badge variant={match.match_score >= 0.8 ? 'default' : match.match_score >= 0.5 ? 'secondary' : 'outline'}>
                                  {Math.round(match.match_score * 100)}%
                                </Badge>
                              </TableCell>
                              <TableCell className="max-w-xs truncate">{match.match_reason || 'N/A'}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    match.status === 'confirmed' ? 'default' : 
                                    match.status === 'dismissed' ? 'destructive' : 
                                    'outline'
                                  }
                                >
                                  {match.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{format(new Date(match.created_at), 'MMM d, yyyy')}</TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-1">
                                  {match.status === 'pending' && (
                                    <>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleUpdateMatchStatus(match.id, 'confirmed')}
                                        title="Confirm match"
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon"
                                        onClick={() => handleUpdateMatchStatus(match.id, 'dismissed')}
                                        title="Dismiss match"
                                      >
                                        <XCircle className="h-4 w-4 text-orange-600" />
                                      </Button>
                                    </>
                                  )}
                                  <Button 
                                    variant="ghost" 
                                    size="icon"
                                    onClick={() => setDeleteMatchId(match.id)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
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

      <ConfirmDialog
        open={!!deleteNotificationId}
        onOpenChange={(open) => !open && setDeleteNotificationId(null)}
        title="Delete Notification"
        description="This will permanently delete this notification. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteNotification}
        variant="destructive"
      />

      <ConfirmDialog
        open={!!deleteMatchId}
        onOpenChange={(open) => !open && setDeleteMatchId(null)}
        title="Delete Match"
        description="This will permanently delete this match record. This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDeleteMatch}
        variant="destructive"
      />
    </Layout>
  );
};

export default Admin;
