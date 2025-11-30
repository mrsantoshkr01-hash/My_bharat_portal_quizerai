"use client"
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import toast from 'react-hot-toast';
import { MapPin, Maximize2 } from 'lucide-react';

// Import the FullscreenGeofenceMap component
// Make sure to create FullscreenGeofenceMap.jsx in the same folder
import FullscreenGeofenceMap from '@/components/QuizSecurity/FullScreenGeofencMap'

// Set your Mapbox access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || 'your-mapbox-access-token';

const GeofenceSetup = ({ quizId, onSettingsUpdate, isAssignmentMode = false, onClose }) => {
  const mapContainer = useRef(null);
  const map = useRef(null);

  const [settings, setSettings] = useState({
    geofencing_enabled: false,
    geofence_center_lat: null,
    geofence_center_lng: null,
    geofence_radius_meters: 50,
    require_teacher_presence: false,
    teacher_geofence_radius: 20,
    anti_cheating_enabled: false,
    max_tab_violations: 3,
    prevent_multiple_devices: true,
    location_check_interval: 30,
    auto_submit_on_violation: true,
    warning_before_submission: true
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showFullscreenMap, setShowFullscreenMap] = useState(false);

  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentLocation({ lat: latitude, lng: longitude });

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [longitude, latitude],
          zoom: 16
        });

        map.current.on('load', () => {
          setIsLoading(false);
        });

        // Add click handler
        map.current.on('click', (e) => {
          if (settings.geofencing_enabled) {
            updateGeofenceCenter(e.lngLat.lat, e.lngLat.lng);
          }
        });
      },
      (error) => {
        setError("Unable to get your location. Please enable location services.");
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  }, []);

  // Load existing settings
  useEffect(() => {
    if (quizId) {
      loadExistingSettings();
    }
  }, [quizId]);

  // Update geofence circle when settings change
  useEffect(() => {
    if (map.current && settings.geofencing_enabled &&
      settings.geofence_center_lat && settings.geofence_center_lng) {
      updateGeofenceCircle();
    }
  }, [settings.geofence_center_lat, settings.geofence_center_lng, settings.geofence_radius_meters]);

  const loadExistingSettings = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/quiz-security/config/${quizId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.data) {
        // Map backend field names to frontend field names
        const mappedSettings = {
          ...settings,
          geofencing_enabled: response.data.geofencing_enabled,
          geofence_center_lat: response.data.allowed_latitude,  // Map this field
          geofence_center_lng: response.data.allowed_longitude, // Map this field
          geofence_radius_meters: response.data.allowed_radius,
          location_check_interval: response.data.location_check_interval,
          require_teacher_presence: response.data.require_teacher_location,
          anti_cheating_enabled: response.data.prevent_tab_switching,
          prevent_multiple_devices: response.data.block_multiple_devices,
          max_tab_violations: response.data.violation_warnings_allowed,
          auto_submit_on_violation: response.data.auto_submit_on_violation
        };

        setSettings(mappedSettings);

        if (response.data.allowed_latitude && response.data.allowed_longitude) {
          map.current?.flyTo({
            center: [response.data.allowed_longitude, response.data.allowed_latitude],
            zoom: 16
          });
        }
      }
    } catch (error) {
      console.error('Failed to load existing settings:', error);
      if (error.response?.status !== 404) {
        toast.error('Failed to load existing settings');
      }
    }
  };

  const updateGeofenceCenter = (lat, lng) => {
    setSettings(prev => ({
      ...prev,
      geofence_center_lat: lat,
      geofence_center_lng: lng
    }));
  };

  const updateGeofenceCircle = () => {
    if (!map.current) return;

    if (map.current.getSource('geofence-circle')) {
      map.current.removeLayer('geofence-circle-fill');
      map.current.removeLayer('geofence-circle-stroke');
      map.current.removeSource('geofence-circle');
    }

    const center = [settings.geofence_center_lng, settings.geofence_center_lat];
    const radiusInKm = settings.geofence_radius_meters / 1000;

    const circleData = createCircle(center, radiusInKm);

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
        'line-width': 2
      }
    });

    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat(center)
      .addTo(map.current);
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

  const useCurrentLocationAsCenter = () => {
    if (currentLocation) {
      updateGeofenceCenter(currentLocation.lat, currentLocation.lng);
      map.current?.flyTo({
        center: [currentLocation.lng, currentLocation.lat],
        zoom: 16
      });
    }
  };

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);

      const backendData = {
        quiz_id: quizId,
        geofencing_enabled: settings.geofencing_enabled,
        allowed_latitude: settings.geofence_center_lat,  // Map this field
        allowed_longitude: settings.geofence_center_lng, // Map this field
        allowed_radius: settings.geofence_radius_meters,
        location_check_interval: settings.location_check_interval,
        require_teacher_location: settings.require_teacher_presence,

        // Anti-cheating settings
        prevent_tab_switching: settings.anti_cheating_enabled,
        prevent_copy_paste: settings.anti_cheating_enabled,
        prevent_right_click: settings.anti_cheating_enabled,
        prevent_keyboard_shortcuts: settings.anti_cheating_enabled,
        block_multiple_devices: settings.prevent_multiple_devices,

        // Violation settings
        violation_warnings_allowed: settings.max_tab_violations,
        auto_submit_on_violation: settings.auto_submit_on_violation,
        location_grace_period_seconds: 60 // Add default value
      };
      console.log('Sending data to backend:', backendData);

      const url = settings.id
        ? `${API_BASE_URL}/api/quiz-security/config/${quizId}`
        : `${API_BASE_URL}/api/quiz-security/config`;

      const method = settings.id ? 'put' : 'post';


      const response = await axios[method](url, backendData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      // const response = await axios[method](url, {
      //   ...settings,
      //   quiz_id: quizId
      // }, {
      //   headers: {
      //     'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      //   }
      // });

      if (response.data) {
        setSettings(response.data);
        onSettingsUpdate?.(response.data);
        toast.success('Security settings saved successfully!');

        if (onClose) {
          onClose();
        }
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to save settings. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const content = (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">
            {isAssignmentMode ? 'Assignment Security Settings' : 'Quiz Security Settings'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Configure location tracking and anti-cheating measures
          </p>
        </div>
        <div className="flex gap-3">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              disabled={isSaving}
            >
              Cancel
            </button>
          )}
          <button
            onClick={saveSettings}
            disabled={isSaving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Settings Panel */}
        <div className="space-y-6 order-2 xl:order-1">
          {/* Geofencing Settings */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold mb-4">Geofencing</h4>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.geofencing_enabled}
                  onChange={(e) => handleSettingChange('geofencing_enabled', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">Enable location-based restrictions</span>
              </label>

              {settings.geofencing_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allowed Radius (meters)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="1000"
                      value={settings.geofence_radius_meters}
                      onChange={(e) => handleSettingChange('geofence_radius_meters', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended: 5-10m for classroom, 50-100m for building
                    </p>
                  </div>

                  <button
                    onClick={useCurrentLocationAsCenter}
                    className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Use My Current Location as Center
                  </button>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.require_teacher_presence}
                      onChange={(e) => handleSettingChange('require_teacher_presence', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">Require teacher presence in area</span>
                  </label>

                  {settings.require_teacher_presence && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Teacher Presence Radius (meters)
                      </label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={settings.teacher_geofence_radius}
                        onChange={(e) => handleSettingChange('teacher_geofence_radius', parseInt(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Check Interval (seconds)
                    </label>
                    <select
                      value={settings.location_check_interval}
                      onChange={(e) => handleSettingChange('location_check_interval', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={10}>Every 10 seconds (High accuracy)</option>
                      <option value={30}>Every 30 seconds (Balanced)</option>
                      <option value={60}>Every minute (Battery efficient)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Anti-Cheating Settings */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h4 className="text-lg font-semibold mb-4">Anti-Cheating</h4>

            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.anti_cheating_enabled}
                  onChange={(e) => handleSettingChange('anti_cheating_enabled', e.target.checked)}
                  className="mr-3 h-4 w-4 text-blue-600"
                />
                <span className="text-gray-700">Enable anti-cheating measures</span>
              </label>

              {settings.anti_cheating_enabled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Tab Violations
                    </label>
                    <select
                      value={settings.max_tab_violations}
                      onChange={(e) => handleSettingChange('max_tab_violations', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>1 violation (Strict)</option>
                      <option value={2}>2 violations (Moderate)</option>
                      <option value={3}>3 violations (Lenient)</option>
                      <option value={5}>5 violations (Very Lenient)</option>
                    </select>
                  </div>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.prevent_multiple_devices}
                      onChange={(e) => handleSettingChange('prevent_multiple_devices', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">Prevent multiple device logins</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.auto_submit_on_violation}
                      onChange={(e) => handleSettingChange('auto_submit_on_violation', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">Auto-submit on violation limit</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.warning_before_submission}
                      onChange={(e) => handleSettingChange('warning_before_submission', e.target.checked)}
                      className="mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="text-gray-700">Show warnings before auto-submission</span>
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Map Panel */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 order-1 xl:order-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold">Geofence Area</h4>
            {settings.geofencing_enabled && (
              <button
                onClick={() => setShowFullscreenMap(true)}
                className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
                Open Full Map
              </button>
            )}
          </div>

          <div className="relative">
            <div
              ref={mapContainer}
              className={`w-full h-80 xl:h-96 rounded-lg border-2 ${settings.geofencing_enabled
                ? 'border-blue-300 cursor-pointer'
                : 'border-gray-300 opacity-50 pointer-events-none cursor-not-allowed'
                }`}
              style={{
                minHeight: '320px',
                zIndex: 1
              }}
              onClick={() => {
                if (settings.geofencing_enabled) {
                  setShowFullscreenMap(true);
                }
              }}
            />

            {/* Fullscreen Map Button Overlay */}
            {settings.geofencing_enabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-20 rounded-lg opacity-0 hover:opacity-100 transition-opacity cursor-pointer"
                onClick={() => setShowFullscreenMap(true)}>
                <div className="bg-white rounded-lg p-4 shadow-lg">
                  <div className="flex items-center gap-2 text-blue-600">
                    <Maximize2 className="w-6 h-6" />
                    <span className="font-medium">Open Fullscreen Map</span>
                  </div>
                </div>
              </div>
            )}

            {!settings.geofencing_enabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 bg-opacity-80 rounded-lg">
                <div className="text-center p-4">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">Enable geofencing to set location restrictions</p>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600 text-sm">Loading map...</p>
                </div>
              </div>
            )}
          </div>

          {settings.geofencing_enabled && settings.geofence_center_lat && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-blue-900 font-medium">Geofence Center:</p>
                  <p className="text-blue-700">
                    {settings.geofence_center_lat.toFixed(6)}, {settings.geofence_center_lng.toFixed(6)}
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Radius: {settings.geofence_radius_meters}m
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // Main component return
  return (
    <>
      {/* Main content */}
      {onClose ? (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>
            <div className="relative inline-block w-full max-w-6xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
              {content}
            </div>
          </div>
        </div>
      ) : (
        content
      )}

      {/* Fullscreen Map Modal */}
      {showFullscreenMap && (
        <FullscreenGeofenceMap
          initialCenter={settings.geofence_center_lat && settings.geofence_center_lng ? {
            lat: settings.geofence_center_lat,
            lng: settings.geofence_center_lng
          } : null}
          initialRadius={settings.geofence_radius_meters}
          onLocationSelect={(location) => {
            setSettings(prev => ({
              ...prev,
              geofence_center_lat: location.lat,
              geofence_center_lng: location.lng,
              geofence_radius_meters: location.radius
            }));
            setShowFullscreenMap(false);
          }}
          onClose={() => setShowFullscreenMap(false)}
        />
      )}
    </>
  );
};

export default GeofenceSetup;