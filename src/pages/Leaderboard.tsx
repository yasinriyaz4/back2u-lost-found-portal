import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { usePoints, POINT_VALUES } from '@/hooks/usePoints';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Trophy, Medal, Award, Star, TrendingUp, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-6 w-6 text-yellow-500" />;
    case 2:
      return <Medal className="h-6 w-6 text-gray-400" />;
    case 3:
      return <Medal className="h-6 w-6 text-amber-600" />;
    default:
      return <Award className="h-5 w-5 text-muted-foreground" />;
  }
};

const getRankBg = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950/30 dark:to-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    case 2:
      return 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800/30 dark:to-gray-700/20 border-gray-200 dark:border-gray-700';
    case 3:
      return 'bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/20 border-amber-200 dark:border-amber-800';
    default:
      return '';
  }
};

const Leaderboard = () => {
  const { user } = useAuth();
  const { leaderboard, userPoints, userRank, leaderboardLoading } = usePoints();

  return (
    <Layout>
      <div className="container py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Leaderboard</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Top contributors helping reunite people with their belongings
        </p>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {/* User's Stats Card */}
          {user && (
            <Card className="md:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-4xl font-bold text-primary">{userPoints}</p>
                    <p className="text-sm text-muted-foreground">Total Points</p>
                  </div>
                  {userRank && (
                    <div className="text-center">
                      <p className="text-4xl font-bold">#{userRank}</p>
                      <p className="text-sm text-muted-foreground">Your Rank</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Point Values Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5" />
                How to Earn
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Post found item</span>
                <Badge variant="secondary">+{POINT_VALUES.found_item_posted}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Successful return</span>
                <Badge variant="secondary">+{POINT_VALUES.item_returned}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Report verified</span>
                <Badge variant="secondary">+{POINT_VALUES.report_verified}</Badge>
              </div>
              <div className="flex justify-between text-destructive">
                <span>False claim</span>
                <Badge variant="destructive">{POINT_VALUES.false_claim}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leaderboard List */}
        <Card>
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
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                    <Skeleton className="h-6 w-16" />
                  </div>
                ))}
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No contributors yet. Be the first!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {leaderboard.map((entry) => (
                  <Link
                    key={entry.user_id}
                    to={user?.id === entry.user_id ? '/profile' : '#'}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-colors hover:bg-muted/50 ${getRankBg(Number(entry.rank))} ${entry.user_id === user?.id ? 'ring-2 ring-primary' : ''}`}
                  >
                    <div className="flex items-center justify-center w-10">
                      {getRankIcon(Number(entry.rank))}
                    </div>
                    
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={entry.profile?.avatar_url || undefined} />
                      <AvatarFallback>
                        {entry.profile?.name?.charAt(0).toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {entry.profile?.name || 'Anonymous User'}
                        {entry.user_id === user?.id && (
                          <Badge variant="outline" className="ml-2 text-xs">You</Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Rank #{entry.rank}
                      </p>
                    </div>
                    
                    <Tooltip>
                      <TooltipTrigger>
                        <Badge className="text-base px-3 py-1">
                          {entry.total_points} pts
                        </Badge>
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
      </div>
    </Layout>
  );
};

export default Leaderboard;
