import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Item } from '@/types/database';
import { MapPin, Calendar, User, Images } from 'lucide-react';
import { format } from 'date-fns';

interface ItemCardProps {
  item: Item;
}

export const ItemCard = ({ item }: ItemCardProps) => {
  const statusColors = {
    active: 'bg-green-500/10 text-green-600 border-green-500/20',
    claimed: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    resolved: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  };

  const categoryColors = {
    lost: 'bg-red-500/10 text-red-600 border-red-500/20',
    found: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  };

  // Get image URLs - prefer image_urls array, fallback to single image_url
  const imageUrls = (item as any).image_urls?.length > 0 
    ? (item as any).image_urls 
    : item.image_url 
      ? [item.image_url] 
      : [];

  const displayImage = imageUrls[0];

  return (
    <Link to={`/items/${item.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
        <div className="aspect-video relative overflow-hidden bg-muted">
          {displayImage ? (
            <img
              src={displayImage}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <span className="text-4xl">📦</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <Badge className={categoryColors[item.category]} variant="outline">
              {item.category === 'lost' ? '🔴 Lost' : '🟢 Found'}
            </Badge>
          </div>
          <div className="absolute top-3 right-3 flex gap-2">
            {imageUrls.length > 1 && (
              <Badge variant="secondary" className="bg-black/60 text-white border-0">
                <Images className="h-3 w-3 mr-1" />
                {imageUrls.length}
              </Badge>
            )}
            <Badge className={statusColors[item.status]} variant="outline">
              {item.status}
            </Badge>
          </div>
        </div>
        
        <CardHeader className="pb-2">
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {item.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {item.description}
          </p>
        </CardHeader>

        <CardContent className="pb-2">
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="line-clamp-1">{item.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0" />
              <span>{format(new Date(item.item_date), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </CardContent>

        <CardFooter className="pt-2 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span>{item.profiles?.name || 'Unknown'}</span>
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
};
