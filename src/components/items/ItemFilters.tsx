import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ItemCategory, ItemStatus } from '@/types/database';
import { Search, X, Calendar, MapPin, SlidersHorizontal } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState } from 'react';

interface ItemFiltersProps {
  search: string;
  category: ItemCategory | 'all';
  status: ItemStatus | 'all';
  dateRange?: { from: Date | undefined; to: Date | undefined };
  nearbyRadius?: number;
  nearbyMode?: boolean;
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: ItemCategory | 'all') => void;
  onStatusChange: (value: ItemStatus | 'all') => void;
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  onNearbyRadiusChange?: (radius: number) => void;
  onClear: () => void;
}

export const ItemFilters = ({
  search,
  category,
  status,
  dateRange,
  nearbyRadius = 50,
  nearbyMode = false,
  onSearchChange,
  onCategoryChange,
  onStatusChange,
  onDateRangeChange,
  onNearbyRadiusChange,
  onClear,
}: ItemFiltersProps) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
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

        <Button 
          variant="outline" 
          size="icon"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={showAdvanced ? 'bg-accent' : ''}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>

        {hasFilters && (
          <Button variant="ghost" size="icon" onClick={onClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="p-4 bg-muted/50 rounded-lg space-y-4">
          <h4 className="text-sm font-medium">Advanced Filters</h4>
          
          {/* Distance Radius - only show when nearby mode is active */}
          {nearbyMode && onNearbyRadiusChange && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Search Radius
                </label>
                <span className="text-sm font-medium">{nearbyRadius} km</span>
              </div>
              <Slider
                value={[nearbyRadius]}
                onValueChange={(values) => onNearbyRadiusChange(values[0])}
                min={5}
                max={200}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5 km</span>
                <span>200 km</span>
              </div>
            </div>
          )}

          {!nearbyMode && (
            <p className="text-sm text-muted-foreground">
              Enable "Nearby" mode to filter by distance radius.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
