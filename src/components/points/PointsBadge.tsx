import { usePoints } from '@/hooks/usePoints';
import { Badge } from '@/components/ui/badge';
import { Star, Trophy } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

interface PointsBadgeProps {
  showRank?: boolean;
  className?: string;
}

export const PointsBadge = ({ showRank = false, className = '' }: PointsBadgeProps) => {
  const { userPoints, userRank, pointsLoading } = usePoints();

  if (pointsLoading) {
    return null;
  }

  const isTopThree = userRank && userRank <= 3;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/leaderboard" className={className}>
          <Badge 
            variant="secondary" 
            className={`cursor-pointer hover:bg-secondary/80 transition-all flex items-center gap-1.5 ${isTopThree ? 'ring-1 ring-yellow-400/50 bg-yellow-50 dark:bg-yellow-950/30 hover:bg-yellow-100 dark:hover:bg-yellow-950/50' : ''}`}
          >
            {isTopThree ? (
              <Trophy className="h-3.5 w-3.5 text-yellow-500" />
            ) : (
              <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
            )}
            <span className="font-semibold">{userPoints}</span>
            {showRank && userRank && (
              <span className="text-muted-foreground text-xs">#{userRank}</span>
            )}
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">Your contribution points</p>
        {userRank ? (
          <p className="text-xs text-muted-foreground">Rank #{userRank} on leaderboard</p>
        ) : (
          <p className="text-xs text-muted-foreground">Post found items to earn points!</p>
        )}
      </TooltipContent>
    </Tooltip>
  );
};
