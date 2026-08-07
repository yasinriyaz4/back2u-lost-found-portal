import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout } from '@/components/layout/Layout';
import { ItemGrid } from '@/components/items/ItemGrid';
import { useItems } from '@/hooks/useItems';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ItemCategory } from '@/types/database';
import { Search, Plus, ArrowRight, MapPin, Shield, Users } from 'lucide-react';

const Home = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ItemCategory | 'all'>('all');
  
  const { items, loading } = useItems({
    filters: { 
      search: search || undefined,
      category: category === 'all' ? undefined : category,
      status: 'active'
    },
    limit: 8,
  });

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Reunite with What Matters
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Lost something precious? Found an item? Back2U connects people to help reunite lost belongings with their rightful owners.
            </p>
            
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for lost or found items..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-12 text-lg"
                />
              </div>
              <Button asChild size="lg" className="h-12">
                <Link to="/items">
                  <Search className="mr-2 h-5 w-5" />
                  Search
                </Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild variant="default" size="lg">
                <Link to="/items/new">
                  <Plus className="mr-2 h-5 w-5" />
                  Post Lost Item
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/items/new">
                  Report Found Item
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Category Tabs */}
      <section className="container py-8">
        <div className="flex flex-wrap justify-center gap-3 mb-8">
          <Button
            variant={category === 'all' ? 'default' : 'outline'}
            onClick={() => setCategory('all')}
          >
            All Items
          </Button>
          <Button
            variant={category === 'lost' ? 'default' : 'outline'}
            onClick={() => setCategory('lost')}
            className={category === 'lost' ? '' : 'border-red-500/50 text-red-600 hover:bg-red-500/10'}
          >
            🔴 Lost Items
          </Button>
          <Button
            variant={category === 'found' ? 'default' : 'outline'}
            onClick={() => setCategory('found')}
            className={category === 'found' ? '' : 'border-green-500/50 text-green-600 hover:bg-green-500/10'}
          >
            🟢 Found Items
          </Button>
        </div>
      </section>

      {/* Recent Items */}
      <section className="container pb-16">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Items</h2>
          <Button asChild variant="ghost">
            <Link to="/items">
              View All
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        
        <ItemGrid items={items} loading={loading} emptyMessage="No items found. Be the first to post!" />
      </section>

      {/* Features */}
      <section className="bg-muted/30 py-16">
        <div className="container">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Post Your Item</h3>
              <p className="text-muted-foreground">
                Describe your lost or found item with photos, location, and details to help others identify it.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Connect</h3>
              <p className="text-muted-foreground">
                Browse listings, search by location, and contact item owners directly through our messaging system.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Reunite</h3>
              <p className="text-muted-foreground">
                Safely arrange to return items to their rightful owners and mark items as resolved.
              </p>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Home;
