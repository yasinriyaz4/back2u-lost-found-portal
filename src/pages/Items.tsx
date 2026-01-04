import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { ItemGrid } from '@/components/items/ItemGrid';
import { ItemFilters } from '@/components/items/ItemFilters';
import { useItems } from '@/hooks/useItems';
import { ItemCategory, ItemStatus } from '@/types/database';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const Items = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  const [status, setStatus] = useState<ItemStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const limit = 12;

  const { items, loading, totalCount } = useItems({
    filters: { 
      search: search || undefined, 
      category, 
      status 
    },
    page,
    limit,
  });

  const totalPages = Math.ceil(totalCount / limit);

  const handleClear = () => {
    setSearch('');
    setCategory('all');
    setStatus('all');
    setPage(1);
  };

  return (
    <Layout>
      <div className="container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Items</h1>
          <p className="text-muted-foreground">
            Search through {totalCount} lost and found items
          </p>
        </div>

        <div className="mb-6">
          <ItemFilters
            search={search}
            category={category}
            status={status}
            onSearchChange={(v) => { setSearch(v); setPage(1); }}
            onCategoryChange={(v) => { setCategory(v); setPage(1); }}
            onStatusChange={(v) => { setStatus(v); setPage(1); }}
            onClear={handleClear}
          />
        </div>

        <ItemGrid items={items} loading={loading} />

        {/* Pagination */}
        {totalPages > 1 && (
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
      </div>
    </Layout>
  );
};

export default Items;
