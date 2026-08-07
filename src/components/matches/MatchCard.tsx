import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { ItemMatch } from '@/hooks/useItemMatches';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MatchCardProps {
  match: ItemMatch;
  currentItemId?: string;
  onConfirm?: (matchId: string) => void;
  onDismiss?: (matchId: string) => void;
}

export const MatchCard = ({ match, currentItemId, onConfirm, onDismiss }: MatchCardProps) => {
  // Determine which item to show (the opposite one)
  const matchedItem = currentItemId === match.lost_item_id ? match.found_item : match.lost_item;
  
  if (!matchedItem) return null;

  const scorePercent = Math.round(match.match_score * 100);
  const scoreColor = 
    scorePercent >= 80 ? 'bg-green-500' :
    scorePercent >= 60 ? 'bg-yellow-500' :
    'bg-orange-500';

  const images = matchedItem.image_urls?.length ? matchedItem.image_urls : 
    matchedItem.image_url ? [matchedItem.image_url] : [];

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-md",
      match.status === 'confirmed' && "ring-2 ring-green-500"
    )}>
      <CardContent className="p-0">
        <div className="flex gap-4 p-4">
          {/* Image */}
          <div className="w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            {images[0] ? (
              <img
                src={images[0]}
                alt={matchedItem.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-2xl">
                📦
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <Badge variant={matchedItem.category === 'lost' ? 'destructive' : 'default'} className="mb-1">
                  {matchedItem.category === 'lost' ? '🔴 Lost' : '🟢 Found'}
                </Badge>
                <h4 className="font-semibold text-sm truncate">{matchedItem.title}</h4>
              </div>
              <div className={cn(
                "px-2 py-1 rounded text-xs font-bold text-white",
                scoreColor
              )}>
                {scorePercent}%
              </div>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {matchedItem.location}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(matchedItem.item_date), 'MMM d, yyyy')}
              </span>
            </div>

            {match.match_reason && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {match.match_reason}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 px-4 pb-4">
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            asChild
          >
            <Link to={`/items/${matchedItem.id}`}>
              <ExternalLink className="h-3 w-3 mr-1" />
              View Item
            </Link>
          </Button>
          
          {match.status === 'pending' && (
            <>
              {onConfirm && (
                <Button
                  size="sm"
                  variant="default"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => onConfirm(match.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              {onDismiss && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive"
                  onClick={() => onDismiss(match.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </>
          )}
          
          {match.status === 'confirmed' && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Check className="h-3 w-3 mr-1" />
              Confirmed
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
