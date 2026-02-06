import { useState, useEffect } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ItemFilters } from '@/components/items/ItemFilters';
import { ItemMap } from '@/components/items/ItemMap';
import { useItems } from '@/hooks/useItems';
import { useGeolocation, calculateDistance } from '@/hooks/useGeolocation';
import { ItemCategory, ItemStatus, Item } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Grid, Map, Navigation, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Get coordinates from item - uses stored coordinates, falls back to null
const getItemCoordinates = (item: Item): [number, number] | null => {
  const itemAny = item as any;
  if (itemAny.latitude && itemAny.longitude) {
    return [itemAny.latitude, itemAny.longitude];
  }
  return null;
};

const Items = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [status, setStatus] = useState<ItemStatus | 'all'>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [nearbyMode, setNearbyMode] = useState(false);
  const [nearbyRadius, setNearbyRadius] = useState(50); // km
  const limit = 12;

  const { latitude, longitude, loading: geoLoading, getCurrentPosition, error: geoError } = useGeolocation();

  const { items, loading, totalCount } = useItems({
    filters: { 
      search: search || undefined, 
      category, 
      status,
      dateFrom: dateRange.from?.toISOString().split('T')[0],
      dateTo: dateRange.to?.toISOString().split('T')[0],
    },
    page: nearbyMode ? 1 : page,
    limit: viewMode === 'map' || nearbyMode ? 500 : limit, // Load more for map/nearby
  });

  // Filter items by distance when nearby mode is active
  const filteredItems = nearbyMode && latitude && longitude
    ? items.filter((item) => {
        const coords = getItemCoordinates(item);
        if (!coords) return false;
        const distance = calculateDistance(latitude, longitude, coords[0], coords[1]);
        return distance <= nearbyRadius;
      }).sort((a, b) => {
        const coordsA = getItemCoordinates(a);
        const coordsB = getItemCoordinates(b);
        if (!coordsA || !coordsB) return 0;
        const distA = calculateDistance(latitude!, longitude!, coordsA[0], coordsA[1]);
        const distB = calculateDistance(latitude!, longitude!, coordsB[0], coordsB[1]);
        return distA - distB;
      })
    : items;

  const displayItems = viewMode === 'grid' && !nearbyMode 
    ? filteredItems 
    : filteredItems;

  const totalPages = Math.ceil(totalCount / limit);

  const handleClear = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setDateRange({ from: undefined, to: undefined });
    setPage(1);
    setNearbyMode(false);
  };

  const handleNearbyToggle = () => {
    if (!nearbyMode && !latitude) {
      getCurrentPosition();
    }
    setNearbyMode(!nearbyMode);
    setPage(1);
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Browse Items</h1>
            <p className="text-muted-foreground">
              Search through {totalCount} lost and found items
              {nearbyMode && latitude && (
                <span className="ml-2">
                  • <Badge variant="secondary" className="ml-1">
                    {filteredItems.length} items within {nearbyRadius}km
                  </Badge>
                </span>
              )}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Nearby Button */}
            <Button
              variant={nearbyMode ? 'default' : 'outline'}
              size="sm"
              onClick={handleNearbyToggle}
              disabled={geoLoading}
              className="gap-2"
            >
              {geoLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4" />
              )}
              Nearby
            </Button>

            {/* View Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'grid' | 'map')}>
              <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                  <Grid className="h-4 w-4" />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="h-4 w-4" />
                  Map
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {geoError && nearbyMode && (
          <div className="mb-4 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
            {geoError}. Please enable location access in your browser settings.
          </div>
        )}

        <div className="mb-6">
          <ItemFilters
            search={search}
            category={category}
            status={status}
            dateRange={dateRange}
            nearbyRadius={nearbyRadius}
            nearbyMode={nearbyMode}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onCategoryChange={(v) => { setCategory(v); setPage(1); }}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            onDateRangeChange={(range) => { setDateRange(range); setPage(1); }}
            onNearbyRadiusChange={(radius) => setNearbyRadius(radius)}
            onClear={handleClear}
          />
        </div>

        {viewMode === 'grid' ? (
          <>
            <ItemGrid items={displayItems} loading={loading} />

            {/* Pagination - only show when not in nearby mode */}
            {!nearbyMode && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={page === totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-red-500" />
                Lost Items
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded-full bg-green-500" />
                Found Items
              </div>
              {nearbyMode && latitude && longitude && (
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
                  Your Location
                </div>
              )}
            </div>
            <ItemMap 
              items={displayItems} 
              userLocation={nearbyMode && latitude && longitude ? { lat: latitude, lon: longitude } : undefined}
            />
            <p className="text-sm text-muted-foreground text-center">
              Showing {displayItems.length} items on the map. Click a marker to see details.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Items;
