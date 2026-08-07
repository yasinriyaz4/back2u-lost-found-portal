import { Item } from '@/types/database';
import { ItemCard } from './ItemCard';
import { Loader } from '@/components/ui/loader';

interface ItemGridProps {
  items: Item[];
  loading?: boolean;
  emptyMessage?: string;
}

export const ItemGrid = ({ items, loading, emptyMessage = 'No items found' }: ItemGridProps) => {
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader size="lg" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📭</div>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} />
      ))}
    </div>
  );
};
