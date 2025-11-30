"use client"
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { X, MapPin, Target, Navigation } from 'lucide-react';

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-access-token';

const FullscreenGeofenceMap = ({ 
  initialCenter = null, 
  initialRadius = 50,
  onLocationSelect,
  onClose 
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [selectedLocation, setSelectedLocation] = useState(initialCenter);
  const [radius, setRadius] = useState(initialRadius);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMapLoaded, setIsMapLoaded] = useState(false); // Add map loaded state
  const [error, setError] = useState(null);

  useEffect(() => {
    initializeMap();
    getCurrentLocation();
    
    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Only update geofence when map is loaded and location is available
  useEffect(() => {
    if (map.current && isMapLoaded && selectedLocation) {
      updateGeofenceCircle();
    }
  }, [selectedLocation, radius, isMapLoaded]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCurrentLocation(location);
          
          // If no initial center provided, use current location
          if (!selectedLocation) {
            setSelectedLocation(location);
          }
        },
        (error) => {
          setError('Unable to get your current location');
          console.error('Geolocation error:', error);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const initializeMap = () => {
    if (map.current) return;

    // Check if token exists
    console.log('Mapbox token exists:', !!mapboxgl.accessToken);
    console.log('Container element:', mapContainer.current);

    // Default to a central location if no initial center
    const defaultCenter = initialCenter 
      ? [initialCenter.lng, initialCenter.lat]
      : [77.2090, 28.6139]; // Delhi, India

    try {
      // Check if we have a valid access token
      if (!mapboxgl.accessToken || mapboxgl.accessToken === 'your-mapbox-access-token') {
        setError('Mapbox access token is missing. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to your .env.local file.');
        setIsLoading(false);
        return;
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: defaultCenter,
        zoom: 15,
        attributionControl: false
      });

      console.log('Map instance created:', map.current);

      // Add navigation controls
      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add geolocate control
      const geolocate = new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true,
        showUserHeading: true
      });
      map.current.addControl(geolocate, 'top-right');

      map.current.on('load', () => {
        setIsLoading(false);
        setIsMapLoaded(true); // Set map as loaded
        
        // Add click handler
        map.current.on('click', handleMapClick);
        
        // If we have an initial center, show it after map is loaded
        if (selectedLocation) {
          // Use setTimeout to ensure map is fully ready
          setTimeout(() => {
            updateGeofenceCircle();
          }, 100);
        }
      });

      map.current.on('error', (e) => {
        console.error('Map error:', e);
        setError('Failed to load map');
        setIsLoading(false);
      });

      // Handle style loading errors
      map.current.on('style.load', () => {
        console.log('Map style loaded successfully');
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
      setIsLoading(false);
    }
  };

  const handleMapClick = (e) => {
    const { lat, lng } = e.lngLat;
    console.log('Map clicked at:', lat, lng);
    setSelectedLocation({ lat, lng });
  };

  const updateGeofenceCircle = () => {
    // Comprehensive checks before updating
    if (!map.current || !selectedLocation || !isMapLoaded) {
      console.log('Map not ready for geofence update:', {
        hasMap: !!map.current,
        hasLocation: !!selectedLocation,
        isMapLoaded
      });
      return;
    }

    // Check if map is still valid and style is loaded
    if (!map.current.getContainer()) {
      console.warn('Map container not available');
      return;
    }

    // Check if map style is loaded
    if (!map.current.isStyleLoaded()) {
      console.log('Map style not loaded yet, retrying...');
      setTimeout(() => {
        updateGeofenceCircle();
      }, 500);
      return;
    }

    const center = [selectedLocation.lng, selectedLocation.lat];
    
    try {
      // Remove existing circle and marker
      if (map.current.getSource('geofence-circle')) {
        try {
          map.current.removeLayer('geofence-circle-fill');
          map.current.removeLayer('geofence-circle-stroke');
          map.current.removeSource('geofence-circle');
        } catch (removeError) {
          console.log('Error removing existing layers (this is usually fine):', removeError);
        }
      }

      // Remove existing markers
      const existingMarkers = document.querySelectorAll('.geofence-marker');
      existingMarkers.forEach(marker => marker.remove());

      // Create circle data
      const radiusInKm = radius / 1000;
      const circleData = createCircle(center, radiusInKm);

      // Add circle source and layers
      map.current.addSource('geofence-circle', {
        type: 'geojson',
        data: circleData
      });

      map.current.addLayer({
        id: 'geofence-circle-fill',
        type: 'fill',
        source: 'geofence-circle',
        paint: {
          'fill-color': '#3b82f6',
          'fill-opacity': 0.2
        }
      });

      map.current.addLayer({
        id: 'geofence-circle-stroke',
        type: 'line',
        source: 'geofence-circle',
        paint: {
          'line-color': '#3b82f6',
          'line-width': 3
        }
      });

      // Add center marker
      const markerEl = document.createElement('div');
      markerEl.className = 'geofence-marker';
      markerEl.style.cssText = `
        width: 40px;
        height: 40px;
        background: #ef4444;
        border: 3px solid white;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 18px;
      `;
      markerEl.innerHTML = '📍';

      new mapboxgl.Marker({ element: markerEl })
        .setLngLat(center)
        .addTo(map.current);

      // Fly to the location
      map.current.flyTo({
        center: center,
        zoom: 16,
        duration: 1000
      });

    } catch (error) {
      console.error('Error updating geofence circle:', error);
    }
  };

  const createCircle = (center, radiusInKm) => {
    const points = 64;
    const coords = [];
    
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * 2 * Math.PI;
      const dx = radiusInKm * Math.cos(angle);
      const dy = radiusInKm * Math.sin(angle);
      
      const lat = center[1] + (dy / 111.32);
      const lng = center[0] + (dx / (111.32 * Math.cos(center[1] * Math.PI / 180)));
      
      coords.push([lng, lat]);
    }
    
    coords.push(coords[0]);
    
    return {
      type: 'Feature',
      geometry: {
        type: 'Polygon',
        coordinates: [coords]
      }
    };
  };

  const useCurrentLocation = () => {
    if (currentLocation) {
      setSelectedLocation(currentLocation);
    }
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      onLocationSelect({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius: radius
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-white shadow-lg z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Set Geofence Location</h2>
              <p className="text-sm text-gray-600">Click anywhere on the map to set the center point</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Map */}
      <div ref={mapContainer} className="w-full h-full pt-20" />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error overlay with fallback option */}
      {error && (
        <div className="absolute inset-0 bg-red-50 flex items-center justify-center z-20">
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-bold text-red-900 mb-2">Map Error</h3>
            <p className="text-red-700 mb-4">{error}</p>
            
            {error.includes('token') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-yellow-800">
                  <strong>Setup Required:</strong> Add your Mapbox access token to your .env.local file:
                </p>
                <code className="block text-xs bg-yellow-100 p-2 rounded mt-2">
                  NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_token_here
                </code>
                <p className="text-xs text-yellow-700 mt-2">
                  Get a free token at <a href="https://mapbox.com" target="_blank" className="underline">mapbox.com</a>
                </p>
              </div>
            )}
            
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setError(null);
                  setIsLoading(true);
                  setIsMapLoaded(false);
                  // Retry initialization
                  if (map.current) {
                    map.current.remove();
                    map.current = null;
                  }
                  setTimeout(() => {
                    initializeMap();
                  }, 1000);
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Retry
              </button>
              <button
                onClick={onClose}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Controls Panel */}
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-xl p-4 z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Radius Control */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Geofence Radius
            </label>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="1000"
                value={radius}
                onChange={(e) => setRadius(parseInt(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-medium text-gray-900 min-w-[60px]">
                {radius}m
              </span>
            </div>
          </div>

          {/* Current Location Button */}
          <div className="flex justify-center">
            <button
              onClick={useCurrentLocation}
              disabled={!currentLocation}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Target className="w-4 h-4" />
              Use Current Location
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedLocation}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Confirm Location
            </button>
          </div>
        </div>

        {/* Selected Location Info */}
        {selectedLocation && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <span className="font-medium text-blue-900">Selected Location: </span>
                <span className="text-blue-700">
                  {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
                </span>
                <span className="text-blue-600 ml-2">
                  (Radius: {radius}m)
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FullscreenGeofenceMap;