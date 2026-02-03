import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePoints, POINT_VALUES, PointTransaction } from '@/hooks/usePoints';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Award, Star, TrendingUp, Info, Clock, Gift, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, isThisWeek, isThisMonth } from 'date-fns';

type TimeFilter = 'all' | 'month' | 'week';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500 drop-shadow-md" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400 drop-shadow-md" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600 drop-shadow-md" />;
    default:
      return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/40 dark:to-amber-900/30 border-yellow-300 dark:border-yellow-700 shadow-lg shadow-yellow-200/50 dark:shadow-yellow-900/30';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-slate-100 dark:from-gray-800/40 dark:to-slate-700/30 border-gray-300 dark:border-gray-600 shadow-md';
    case 3:
      return 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-900/30 border-amber-300 dark:border-amber-700 shadow-md shadow-amber-200/30';
    default:
      return 'hover:bg-muted/50';
  }
};

const getActionIcon = (actionType: string) => {
  switch (actionType) {
    case 'found_item_posted':
      return <Gift className="h-4 w-4 text-green-500" />;
    case 'item_returned':
      return <CheckCircle className="h-4 w-4 text-primary" />;
    case 'false_claim':
    case 'reported_misuse':
      return <AlertTriangle className="h-4 w-4 text-destructive" />;
    case 'report_verified':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    default:
      return <Star className="h-4 w-4 text-muted-foreground" />;
  }
};

const getActionLabel = (actionType: string) => {
  switch (actionType) {
    case 'found_item_posted':
      return 'Posted found item';
    case 'item_returned':
      return 'Successful return';
    case 'false_claim':
      return 'False claim penalty';
    case 'reported_misuse':
      return 'Misuse penalty';
    case 'report_verified':
      return 'Report verified';
    default:
      return actionType;
  }
};

const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, userPoints, userRank, transactions, leaderboardLoading, transactionsLoading } = usePoints();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  // Filter transactions based on time
  const filteredTransactions = transactions.filter((tx: PointTransaction) => {
    if (timeFilter === 'all') return true;
    const txDate = new Date(tx.created_at);
    if (timeFilter === 'week') return isThisWeek(txDate);
    if (timeFilter === 'month') return isThisMonth(txDate);
    return true;
  });

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center gap-3 mb-3">
            <div className="p-3 rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">Community Leaderboard</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Celebrating our top contributors who help reunite people with their belongings
          </p>
        </div>

        {/* Time Filter */}
        <div className="flex justify-center mb-6">
          <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as TimeFilter)}>
            <TabsList>
              <TabsTrigger value="all">All Time</TabsTrigger>
              <TabsTrigger value="month">This Month</TabsTrigger>
              <TabsTrigger value="week">This Week</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mb-8">
          {/* User's Stats Card */}
          {user && (
            <Card className="lg:col-span-2 border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <p className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                      {userPoints}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">Total Points</p>
                  </div>
                  {userRank ? (
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {userRank <= 3 && getRankIcon(userRank)}
                        <p className="text-5xl font-bold">#{userRank}</p>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Your Rank</p>
                    </div>
                  ) : userPoints === 0 ? (
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground">
                        Post a found item to start earning points!
                      </p>
                    </div>
                  ) : null}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Point Values Info Card */}
          <Card className={user ? '' : 'lg:col-span-3 max-w-md mx-auto w-full'}>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                How to Earn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Gift className="h-4 w-4 text-green-500" />
                  <span>Post found item</span>
                </div>
                <Badge variant="secondary" className="font-mono">+{POINT_VALUES.found_item_posted}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>Successful return</span>
                </div>
                <Badge variant="secondary" className="font-mono">+{POINT_VALUES.item_returned}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <span>Report verified</span>
                </div>
                <Badge variant="secondary" className="font-mono">+{POINT_VALUES.report_verified}</Badge>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between items-center text-destructive">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>False claim</span>
                </div>
                <Badge variant="destructive" className="font-mono">{POINT_VALUES.false_claim}</Badge>
              </div>
              <div className="flex justify-between items-center text-destructive">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Reported misuse</span>
                </div>
                <Badge variant="destructive" className="font-mono">{POINT_VALUES.reported_misuse}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard List */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top Contributors
            </CardTitle>
            <CardDescription>
              Users ranked by their contribution to the community
            </CardDescription>
          </CardHeader>
          <CardContent>
            {leaderboardLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 rounded-lg border">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-4">
                  <Trophy className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No contributors yet</h3>
                <p className="text-muted-foreground mb-4">
                  Be the first to earn points by posting a found item!
                </p>
                {user && (
                  <Link 
                    to="/new" 
                    className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Post Found Item
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <Link
                    key={entry.user_id}
                    to={user?.id === entry.user_id ? '/profile' : '#'}
                    className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${getRankBg(Number(entry.rank))} ${entry.user_id === user?.id ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(Number(entry.rank))}
                    </div>
                    
                    <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
                      <AvatarImage src={entry.profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {entry.profile?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate flex items-center gap-2">
                        {entry.profile?.name || 'Anonymous User'}
                        {entry.user_id === user?.id && (
                          <Badge variant="outline" className="text-xs bg-primary/10 border-primary/30">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Community contributor
                      </p>
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger>
                        <div className="flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-4 py-2 rounded-full">
                          <Star className="h-4 w-4 fill-current" />
                          <span>{entry.total_points}</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Total contribution points</p>
                      </TooltipContent>
                    </Tooltip>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity (for logged in users) */}
        {user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Your Recent Activity
              </CardTitle>
              <CardDescription>
                Your point transactions and achievements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-40 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-6 w-16" />
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No activity {timeFilter !== 'all' ? `this ${timeFilter}` : 'yet'}</p>
                  <p className="text-sm mt-1">Post a found item to start earning!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredTransactions.slice(0, 10).map((tx: PointTransaction) => (
                    <div key={tx.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-background">
                        {getActionIcon(tx.action_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{getActionLabel(tx.action_type)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <Badge 
                        variant={tx.points > 0 ? 'secondary' : 'destructive'}
                        className="font-mono"
                      >
                        {tx.points > 0 ? '+' : ''}{tx.points}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
