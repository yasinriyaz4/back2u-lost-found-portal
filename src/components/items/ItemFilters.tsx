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
import { Search, X, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface ItemFiltersProps {
  search: string;
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  dateRange?: { from: Date | undefined; to: Date | undefined };
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ItemCategory | 'all') => void;
  onStatusChange: (value: ItemStatus | 'all') => void;
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onClear: () => void;
}

export const ItemFilters = ({
  search,
  category,
  status,
  dateRange,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onDateRangeChange,
  onClear,
}: ItemFiltersProps) => {
  const hasFilters = search || category !== 'all' || status !== 'all' || dateRange?.from || dateRange?.to;

  return (
    <div className="space-y-4">
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

        {onDateRangeChange && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-auto gap-2">
                <Calendar className="h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  'Date Range'
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <CalendarComponent
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={{ from: dateRange?.from, to: dateRange?.to }}
                onSelect={(range) => onDateRangeChange({ from: range?.from, to: range?.to })}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        )}

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
