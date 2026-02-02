import { usePoints } from '@/hooks/usePoints';
import { Badge } from '@/components/ui/badge';
import { Star } from 'lucide-react';
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

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link to="/leaderboard" className={className}>
          <Badge 
            variant="secondary" 
            className="cursor-pointer hover:bg-secondary/80 transition-colors flex items-center gap-1"
          >
            <Star className="h-3 w-3 text-yellow-500" />
            <span>{userPoints}</span>
            {showRank && userRank && (
              <span className="text-muted-foreground">#{userRank}</span>
            )}
          </Badge>
        </Link>
      </TooltipTrigger>
      <TooltipContent>
        <p>Your contribution points</p>
        {userRank && <p className="text-xs text-muted-foreground">Rank #{userRank}</p>}
      </TooltipContent>
    </Tooltip>
  );
};
