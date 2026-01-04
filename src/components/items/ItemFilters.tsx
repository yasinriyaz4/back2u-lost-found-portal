import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ItemCategory, ItemStatus } from '@/types/database';
import { Search, X } from 'lucide-react';

interface ItemFiltersProps {
  search: string;
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ItemCategory | 'all') => void;
  onStatusChange: (value: ItemStatus | 'all') => void;
  onClear: () => void;
}

export const ItemFilters = ({
  search,
  category,
  status,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onClear,
}: ItemFiltersProps) => {
  const hasFilters = search || category !== 'all' || status !== 'all';

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search items by title, description, or location..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select value={category} onValueChange={(v) => onCategoryChange(v as ItemCategory | 'all')}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Items</SelectItem>
          <SelectItem value="lost">🔴 Lost</SelectItem>
          <SelectItem value="found">🟢 Found</SelectItem>
        </SelectContent>
      </Select>

      <Select value={status} onValueChange={(v) => onStatusChange(v as ItemStatus | 'all')}>
        <SelectTrigger className="w-full md:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="claimed">Claimed</SelectItem>
          <SelectItem value="resolved">Resolved</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button variant="ghost" size="icon" onClick={onClear}>
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};
