"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Shield, Eye, AlertTriangle, Settings, Map,
  Clock, Users, Wifi, Monitor, Keyboard, Mouse,
  Copy, RotateCcw, Save, Check, X, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { quizSecurityApi } from '@/utils/api/quizSecurityApi';

const QuizSecuritySetup = ({ 
  quizId, 
  existingConfig = null, 
  onSave, 
  onCancel,
  isAssignment = false 
}) => {
  const [config, setConfig] = useState({
    // Geofencing settings
    geofencing_enabled: false,
    allowed_latitude: null,
    allowed_longitude: null,
    allowed_radius: 100,
    location_check_interval: 30,
    require_teacher_location: false,
    
    // Anti-cheating settings
    prevent_tab_switching: false,
    prevent_copy_paste: false,
    prevent_right_click: false,
    prevent_keyboard_shortcuts: false,
    block_multiple_devices: true,
    
    // Monitoring settings
    capture_screen_activity: false,
    monitor_network_changes: false,
    require_webcam_access: false,
    
    // Grace periods and warnings
    location_grace_period_seconds: 60,
    violation_warnings_allowed: 2,
    auto_submit_on_violation: true
  });

  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('geofencing');

  // Load existing configuration
  useEffect(() => {
    if (existingConfig) {
      setConfig(existingConfig);
    } else if (quizId) {
      loadExistingConfig();
    }
  }, [existingConfig, quizId]);

  const loadExistingConfig = async () => {
    try {
      const existingConfig = await quizSecurityApi.getSecurityConfig(quizId);
      if (existingConfig) {
        setConfig(existingConfig);
      }
    } catch (error) {
      console.log('No existing config found, using defaults');
    }
  };

  // Get current location for geofencing setup
  const getCurrentLocation = async () => {
    setIsGettingLocation(true);
    
    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported');
      }

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { 
            enableHighAccuracy: true, 
            timeout: 10000, 
            maximumAge: 0 
          }
        );
      });

      const location = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy
      };

      setCurrentLocation(location);
      setLocationPermission('granted');
      
      // Update config with current location
      setConfig(prev => ({
        ...prev,
        allowed_latitude: location.latitude,
        allowed_longitude: location.longitude
      }));

      toast.success(`Location set: ${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`);

    } catch (error) {
      setLocationPermission('denied');
      toast.error('Failed to get location: ' + error.message);
    } finally {
      setIsGettingLocation(false);
    }
  };

  // Handle configuration change
  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save configuration
  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Validate configuration
      if (config.geofencing_enabled) {
        if (!config.allowed_latitude || !config.allowed_longitude) {
          throw new Error('Location coordinates are required when geofencing is enabled');
        }
        
        if (config.allowed_radius < 10 || config.allowed_radius > 1000) {
          throw new Error('Allowed radius must be between 10 and 1000 meters');
        }
      }

      // Create or update security configuration
      let savedConfig;
      if (existingConfig) {
        savedConfig = await quizSecurityApi.updateSecurityConfig(quizId, config);
      } else {
        savedConfig = await quizSecurityApi.createSecurityConfig({
          ...config,
          quiz_id: quizId
        });
      }

      toast.success('Security configuration saved successfully!');
      
      if (onSave) {
        onSave(savedConfig);
      }

    } catch (error) {
      toast.error('Failed to save configuration: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setConfig({
      geofencing_enabled: false,
      allowed_latitude: null,
      allowed_longitude: null,
      allowed_radius: 100,
      location_check_interval: 30,
      require_teacher_location: false,
      prevent_tab_switching: false,
      prevent_copy_paste: false,
      prevent_right_click: false,
      prevent_keyboard_shortcuts: false,
      block_multiple_devices: true,
      capture_screen_activity: false,
      monitor_network_changes: false,
      require_webcam_access: false,
      location_grace_period_seconds: 60,
      violation_warnings_allowed: 2,
      auto_submit_on_violation: true
    });
    setCurrentLocation(null);
    toast.success('Configuration reset to defaults');
  };

  // Tab configuration
  const tabs = [
    { id: 'geofencing', name: 'Location Control', icon: MapPin },
    { id: 'monitoring', name: 'Activity Monitoring', icon: Eye },
    { id: 'prevention', name: 'Cheating Prevention', icon: Shield },
    { id: 'settings', name: 'Advanced Settings', icon: Settings }
  ];

  const renderGeofencingTab = () => (
    <div className="space-y-6">
      {/* Enable Geofencing Toggle */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div className="flex items-center gap-3">
          <MapPin className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="font-semibold text-slate-800">Enable Geofencing</h3>
            <p className="text-sm text-slate-600">Restrict quiz to specific location</p>
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.geofencing_enabled}
            onChange={(e) => handleConfigChange('geofencing_enabled', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>

      {/* Location Settings */}
      {config.geofencing_enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-4"
        >
          {/* Set Location */}
          <div className="p-4 border border-slate-200 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-slate-800">Quiz Location</h4>
              <button
                onClick={getCurrentLocation}
                disabled={isGettingLocation}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Map className="w-4 h-4" />
                {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
              </button>
            </div>

            {(config.allowed_latitude && config.allowed_longitude) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-green-800 mb-1">
                  <Check className="w-4 h-4" />
                  <span className="font-medium">Location Set</span>
                </div>
                <p className="text-sm text-green-700">
                  Lat: {config.allowed_latitude.toFixed(6)}, 
                  Lng: {config.allowed_longitude.toFixed(6)}
                </p>
                {currentLocation?.accuracy && (
                  <p className="text-xs text-green-600 mt-1">
                    Accuracy: ±{Math.round(currentLocation.accuracy)} meters
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={config.allowed_latitude || ''}
                  onChange={(e) => handleConfigChange('allowed_latitude', parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter latitude"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={config.allowed_longitude || ''}
                  onChange={(e) => handleConfigChange('allowed_longitude', parseFloat(e.target.value) || null)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter longitude"
                />
              </div>
            </div>
          </div>

          {/* Radius Setting */}
          <div className="p-4 border border-slate-200 rounded-xl">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Allowed Radius: {config.allowed_radius} meters
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              value={config.allowed_radius}
              onChange={(e) => handleConfigChange('allowed_radius', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>10m (Classroom)</span>
              <span>100m (Building)</span>
              <span>1000m (Campus)</span>
            </div>
          </div>

          {/* Advanced Geofencing Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
              <div>
                <span className="font-medium text-slate-800">Require Teacher Presence</span>
                <p className="text-sm text-slate-600">Teacher must also be in location</p>
              </div>
              <input
                type="checkbox"
                checked={config.require_teacher_location}
                onChange={(e) => handleConfigChange('require_teacher_location', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <label className="block font-medium text-slate-800 mb-2">
                Location Check Interval: {config.location_check_interval} seconds
              </label>
              <input
                type="range"
                min="5"
                max="300"
                value={config.location_check_interval}
                onChange={(e) => handleConfigChange('location_check_interval', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>5s (Frequent)</span>
                <span>30s (Balanced)</span>
                <span>300s (Minimal)</span>
              </div>
            </div>

            <div className="p-3 border border-slate-200 rounded-lg">
              <label className="block font-medium text-slate-800 mb-2">
                Grace Period: {config.location_grace_period_seconds} seconds
              </label>
              <input
                type="range"
                min="0"
                max="300"
                value={config.location_grace_period_seconds}
                onChange={(e) => handleConfigChange('location_grace_period_seconds', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <p className="text-xs text-slate-500 mt-1">
                Time allowed outside area before violation
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );

  const renderMonitoringTab = () => (
    <div className="space-y-4">
      {[
        {
          key: 'prevent_tab_switching',
          title: 'Monitor Tab Switching',
          description: 'Detect when student switches tabs or windows',
          icon: Monitor,
          severity: 'high'
        },
        {
          key: 'block_multiple_devices',
          title: 'Block Multiple Devices',
          description: 'Prevent login from multiple devices simultaneously',
          icon: Users,
          severity: 'high'
        },
        {
          key: 'monitor_network_changes',
          title: 'Monitor Network Changes',
          description: 'Detect changes in internet connection',
          icon: Wifi,
          severity: 'medium'
        },
        {
          key: 'capture_screen_activity',
          title: 'Screen Activity Monitoring',
          description: 'Monitor screen capture attempts (experimental)',
          icon: Monitor,
          severity: 'high'
        },
        {
          key: 'require_webcam_access',
          title: 'Require Webcam Access',
          description: 'Student must enable webcam during quiz',
          icon: Eye,
          severity: 'medium'
        }
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <setting.icon className="w-5 h-5 text-slate-600" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-800">{setting.title}</h3>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  setting.severity === 'high' ? 'bg-red-100 text-red-700' :
                  setting.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {setting.severity}
                </span>
              </div>
              <p className="text-sm text-slate-600">{setting.description}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config[setting.key]}
            onChange={(e) => handleConfigChange(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );

  const renderPreventionTab = () => (
    <div className="space-y-4">
      {[
        {
          key: 'prevent_copy_paste',
          title: 'Disable Copy/Paste',
          description: 'Prevent copying and pasting text',
          icon: Copy
        },
        {
          key: 'prevent_right_click',
          title: 'Disable Right Click',
          description: 'Prevent access to context menu',
          icon: Mouse
        },
        {
          key: 'prevent_keyboard_shortcuts',
          title: 'Block Keyboard Shortcuts',
          description: 'Disable common shortcuts (F12, Ctrl+U, etc.)',
          icon: Keyboard
        }
      ].map((setting) => (
        <div key={setting.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
          <div className="flex items-center gap-3">
            <setting.icon className="w-5 h-5 text-slate-600" />
            <div>
              <h3 className="font-medium text-slate-800">{setting.title}</h3>
              <p className="text-sm text-slate-600">{setting.description}</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={config[setting.key]}
            onChange={(e) => handleConfigChange(setting.key, e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
      ))}
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      {/* Violation Handling */}
      <div className="p-4 border border-slate-200 rounded-xl">
        <h3 className="font-medium text-slate-800 mb-4">Violation Handling</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Warnings Allowed: {config.violation_warnings_allowed}
            </label>
            <input
              type="range"
              min="0"
              max="5"
              value={config.violation_warnings_allowed}
              onChange={(e) => handleConfigChange('violation_warnings_allowed', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>0 (Strict)</span>
              <span>2 (Balanced)</span>
              <span>5 (Lenient)</span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
            <div>
              <span className="font-medium text-slate-800">Auto-submit on Violation</span>
              <p className="text-sm text-slate-600">Automatically submit quiz when violations exceed limit</p>
            </div>
            <input
              type="checkbox"
              checked={config.auto_submit_on_violation}
              onChange={(e) => handleConfigChange('auto_submit_on_violation', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="p-4 border border-slate-200 rounded-xl">
        <h3 className="font-medium text-slate-800 mb-4">Security Presets</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => {
              const basicConfig = {
                ...config,
                geofencing_enabled: false,
                prevent_tab_switching: true,
                prevent_copy_paste: false,
                prevent_right_click: false,
                prevent_keyboard_shortcuts: false,
                block_multiple_devices: true,
                violation_warnings_allowed: 3
              };
              setConfig(basicConfig);
              toast.success('Basic security preset applied');
            }}
            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left"
          >
            <div className="font-medium text-slate-800">Basic</div>
            <div className="text-sm text-slate-600">Essential monitoring only</div>
          </button>

          <button
            onClick={() => {
              const standardConfig = {
                ...config,
                geofencing_enabled: true,
                prevent_tab_switching: true,
                prevent_copy_paste: true,
                prevent_right_click: true,
                prevent_keyboard_shortcuts: true,
                block_multiple_devices: true,
                violation_warnings_allowed: 2
              };
              setConfig(standardConfig);
              toast.success('Standard security preset applied');
            }}
            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left"
          >
            <div className="font-medium text-slate-800">Standard</div>
            <div className="text-sm text-slate-600">Balanced security measures</div>
          </button>

          <button
            onClick={() => {
              const strictConfig = {
                ...config,
                geofencing_enabled: true,
                require_teacher_location: true,
                prevent_tab_switching: true,
                prevent_copy_paste: true,
                prevent_right_click: true,
                prevent_keyboard_shortcuts: true,
                block_multiple_devices: true,
                monitor_network_changes: true,
                violation_warnings_allowed: 1,
                auto_submit_on_violation: true,
                location_grace_period_seconds: 30
              };
              setConfig(strictConfig);
              toast.success('Strict security preset applied');
            }}
            className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 text-left"
          >
            <div className="font-medium text-slate-800">Strict</div>
            <div className="text-sm text-slate-600">Maximum security enforcement</div>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200">
      {/* Header */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Quiz Security Configuration
            </h2>
            <p className="text-slate-600 mt-1">
              Configure anti-cheating and location-based restrictions
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-transparent text-slate-600 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'geofencing' && renderGeofencingTab()}
        {activeTab === 'monitoring' && renderMonitoringTab()}
        {activeTab === 'prevention' && renderPreventionTab()}
        {activeTab === 'settings' && renderSettingsTab()}
      </div>

      {/* Security Summary */}
      <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
        <h3 className="font-medium text-slate-800 mb-3">Security Summary</h3>
        <div className="flex flex-wrap gap-2">
          {config.geofencing_enabled && (
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              Location-based
            </span>
          )}
          {config.prevent_tab_switching && (
            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              Tab monitoring
            </span>
          )}
          {config.prevent_copy_paste && (
            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
              Copy/paste blocked
            </span>
          )}
          {config.block_multiple_devices && (
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              Single device
            </span>
          )}
          {config.require_teacher_location && (
            <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
              Teacher presence required
            </span>
          )}
          {!config.geofencing_enabled && 
           !config.prevent_tab_switching && 
           !config.prevent_copy_paste && 
           !config.block_multiple_devices && (
            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
              No restrictions
            </span>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-6 border-t border-slate-200 bg-white rounded-b-xl">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {config.geofencing_enabled && !config.allowed_latitude && (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="w-4 h-4" />
                <span>Set location coordinates to enable geofencing</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || (config.geofencing_enabled && (!config.allowed_latitude || !config.allowed_longitude))}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Configuration
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="p-4 bg-blue-50 border-t border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Security Configuration Tips:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Enable geofencing for classroom/exam hall restrictions</li>
              <li>• Use &quot;Standard&quot; preset for most academic assessments</li>
              <li>• Test security settings with a practice quiz first</li>
              <li>• Consider grace periods for network connectivity issues</li>
              <li>• Monitor violation reports to adjust settings as needed</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizSecuritySetup;