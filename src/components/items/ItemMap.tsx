import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Item } from '@/types/database';
import { useNavigate } from 'react-router-dom';

// Fix for default marker icons in Leaflet with Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface ItemMapProps {
  items: Item[];
  className?: string;
  userLocation?: { lat: number; lon: number };
}

// Get coordinates from item's stored lat/lng
const getItemCoordinates = (item: Item): [number, number] | null => {
  const itemAny = item as any;
  if (itemAny.latitude && itemAny.longitude) {
    return [itemAny.latitude, itemAny.longitude];
  }
  return null;
};

// Custom marker icons
const lostIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#ef4444" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

const foundIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#22c55e" width="32" height="32">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
    </svg>
  `),
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32],
});

// User location icon
const userIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#3b82f6" width="32" height="32">
      <circle cx="12" cy="12" r="8" stroke="#ffffff" stroke-width="2"/>
    </svg>
  `),
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export const ItemMap = ({ items, className = '', userLocation }: ItemMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([39.8283, -98.5795], 4);
    mapInstanceRef.current = map;

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const map = mapInstanceRef.current;

    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    // Add markers for each item
    const markers: L.Marker[] = [];
    items.forEach((item) => {
      const coords = getItemCoordinates(item);
      if (!coords) return; // Skip items without coordinates
      const icon = item.category === 'lost' ? lostIcon : foundIcon;
      
      const marker = L.marker(coords, { icon }).addTo(map);
      
      const popupContent = `
        <div style="min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600;">${item.title}</h3>
          <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">${item.location}</p>
          <span style="
            display: inline-block;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 12px;
            font-weight: 500;
            background: ${item.category === 'lost' ? '#fef2f2' : '#f0fdf4'};
            color: ${item.category === 'lost' ? '#dc2626' : '#16a34a'};
          ">
            ${item.category === 'lost' ? '🔴 Lost' : '🟢 Found'}
          </span>
          <button 
            onclick="window.location.href='/items/${item.id}'"
            style="
              display: block;
              width: 100%;
              margin-top: 12px;
              padding: 8px 16px;
              background: hsl(222.2 47.4% 11.2%);
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 14px;
            "
          >
            View Details
          </button>
        </div>
      `;
      
      marker.bindPopup(popupContent);
      markers.push(marker);
    });

    // Add user location marker if available
    if (userLocation) {
      const userMarker = L.marker([userLocation.lat, userLocation.lon], { icon: userIcon }).addTo(map);
      userMarker.bindPopup('<div style="text-align: center; font-weight: 500;">📍 Your Location</div>');
      markers.push(userMarker);
    }

    // Fit bounds if there are markers
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.1));
    }
  }, [items, navigate, userLocation]);

  return (
    <div 
      ref={mapRef} 
      className={`w-full h-[500px] rounded-lg border border-border overflow-hidden ${className}`}
    />
  );
};
