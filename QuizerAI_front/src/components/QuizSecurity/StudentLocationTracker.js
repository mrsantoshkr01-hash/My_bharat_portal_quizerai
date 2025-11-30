"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MapPin, AlertTriangle, Wifi, Signal, Battery, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentLocationTracker = ({
  sessionId,
  quizId,
  allowedLocation,
  onViolation,
  onLocationUpdate,
  isActive = true,
  checkInterval = 30000, // 30 seconds default
  gracePeriod = 60000    // 60 seconds grace period
}) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [accuracy, setAccuracy] = useState(null);
  const [isOutsideArea, setIsOutsideArea] = useState(false);
  const [violationWarningActive, setViolationWarningActive] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [networkInfo, setNetworkInfo] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [violationTimer, setViolationTimer] = useState(null);

  const watchIdRef = useRef(null);
  const violationTimeoutRef = useRef(null);
  const locationHistoryRef = useRef([]);

  // Calculate distance between two coordinates
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c;
  }, []);

  // Check if current location is within allowed area
  const checkLocationCompliance = useCallback((lat, lng) => {
    if (!allowedLocation) return { compliant: true, distance: 0 };

    const distance = calculateDistance(
      lat, lng,
      allowedLocation.latitude, 
      allowedLocation.longitude
    );

    const compliant = distance <= allowedLocation.radius;
    
    return { compliant, distance };
  }, [allowedLocation, calculateDistance]);

  // Get additional device/network info
  const getDeviceInfo = useCallback(async () => {
    try {
      // Battery API
      if ('getBattery' in navigator) {
        const battery = await navigator.getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
      }

      // Network Information API
      if ('connection' in navigator) {
        const connection = navigator.connection;
        setNetworkInfo({
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt
        });
      }
    } catch (error) {
      console.warn('Could not get device info:', error);
    }
  }, []);

  // Handle location success
  const handleLocationSuccess = useCallback((position) => {
    const { latitude, longitude, accuracy, altitude, speed, heading } = position.coords;
    const timestamp = new Date();

    // Update location state
    const newLocation = {
      latitude,
      longitude,
      accuracy,
      altitude,
      speed,
      heading,
      timestamp
    };

    setCurrentLocation(newLocation);
    setAccuracy(accuracy);
    setLastUpdateTime(timestamp);

    // Add to location history (keep last 50 entries)
    locationHistoryRef.current = [
      ...locationHistoryRef.current.slice(-49),
      newLocation
    ];

    // Check compliance
    const compliance = checkLocationCompliance(latitude, longitude);
    const wasOutside = isOutsideArea;
    const isNowOutside = !compliance.compliant;

    setIsOutsideArea(isNowOutside);

    // Handle violation state changes
    if (isNowOutside && !wasOutside) {
      // Just moved outside - start grace period
      setViolationWarningActive(true);
      
      toast.error(
        `⚠️ Location Warning: You're ${Math.round(compliance.distance)}m outside the allowed area. Return within ${gracePeriod/1000} seconds.`,
        { duration: 5000 }
      );

      // Start violation timer
      violationTimeoutRef.current = setTimeout(() => {
        if (onViolation) {
          onViolation({
            violation_type: 'location_violation',
            can_continue: compliance.distance < allowedLocation.radius * 1.5,
            distance: compliance.distance,
            allowed_radius: allowedLocation.radius,
            current_location: newLocation,
            severity: compliance.distance > allowedLocation.radius * 2 ? 'critical' : 'high'
          });
        }
        setViolationTimer(null);
      }, gracePeriod);

      // Start countdown timer
      let remainingTime = gracePeriod / 1000;
      const countdownInterval = setInterval(() => {
        remainingTime--;
        setViolationTimer(remainingTime);
        
        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
        }
      }, 1000);

    } else if (!isNowOutside && wasOutside) {
      // Moved back inside - clear violation
      setViolationWarningActive(false);
      setViolationTimer(null);
      
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
        violationTimeoutRef.current = null;
      }

      toast.success('✅ Back in allowed area. Quiz continues.', { duration: 3000 });
    }

    // Send location update to parent
    if (onLocationUpdate) {
      onLocationUpdate({
        latitude,
        longitude,
        accuracy,
        altitude,
        speed,
        heading,
        timestamp,
        compliant: compliance.compliant,
        distance: compliance.distance,
        batteryLevel,
        networkInfo
      });
    }
  }, [
    isOutsideArea, checkLocationCompliance, allowedLocation, onViolation, 
    onLocationUpdate, gracePeriod, batteryLevel, networkInfo
  ]);

  // Handle location error
  const handleLocationError = useCallback((error) => {
    console.error('Location error:', error);
    
    let errorMessage = 'Location access failed';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = 'Location permission denied';
        setLocationPermission('denied');
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timeout';
        break;
    }

    toast.error(errorMessage, { duration: 5000 });

    if (onViolation) {
      onViolation({
        violation_type: 'location_violation',
        can_continue: false,
        description: errorMessage,
        severity: 'critical'
      });
    }
  }, [onViolation]);

  // Start location tracking
  const startLocationTracking = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return false;
    }

    // Request permission
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        });
      });

      setLocationPermission('granted');
      handleLocationSuccess(position);

      // Start continuous tracking
      watchIdRef.current = navigator.geolocation.watchPosition(
        handleLocationSuccess,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000 // Accept cached locations up to 30 seconds old
        }
      );

      return true;
    } catch (error) {
      handleLocationError(error);
      return false;
    }
  }, [handleLocationSuccess, handleLocationError]);

  // Stop location tracking
  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (violationTimeoutRef.current) {
      clearTimeout(violationTimeoutRef.current);
      violationTimeoutRef.current = null;
    }

    setViolationWarningActive(false);
    setViolationTimer(null);
  }, []);

  // Initialize tracking
  useEffect(() => {
    if (isActive && allowedLocation) {
      getDeviceInfo();
      startLocationTracking();
    } else {
      stopLocationTracking();
    }

    return () => stopLocationTracking();
  }, [isActive, allowedLocation, startLocationTracking, stopLocationTracking, getDeviceInfo]);

  // Render location status indicator
  const renderLocationStatus = () => {
    if (!currentLocation) {
      return (
        <div className="flex items-center gap-2 text-yellow-600">
          <MapPin className="w-4 h-4 animate-pulse" />
          <span className="text-sm">Getting location...</span>
        </div>
      );
    }

    const distanceFromCenter = allowedLocation ? 
      calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        allowedLocation.latitude,
        allowedLocation.longitude
      ) : 0;

    return (
      <div className={`flex items-center gap-2 ${
        isOutsideArea ? 'text-red-600' : 'text-green-600'
      }`}>
        <MapPin className="w-4 h-4" />
        <span className="text-sm">
          {isOutsideArea ? 
            `Outside area (${Math.round(distanceFromCenter)}m away)` :
            `Inside area (${Math.round(distanceFromCenter)}m from center)`
          }
        </span>
      </div>
    );
  };

  // Render accuracy indicator
  const renderAccuracyIndicator = () => {
    if (!accuracy) return null;

    let accuracyColor = 'text-gray-500';
    let accuracyText = 'Unknown';

    if (accuracy <= 10) {
      accuracyColor = 'text-green-600';
      accuracyText = 'High';
    } else if (accuracy <= 50) {
      accuracyColor = 'text-yellow-600';
      accuracyText = 'Medium';
    } else {
      accuracyColor = 'text-red-600';
      accuracyText = 'Low';
    }

    return (
      <div className={`flex items-center gap-1 ${accuracyColor}`}>
        <Signal className="w-3 h-3" />
        <span className="text-xs">
          {accuracyText} ({Math.round(accuracy)}m)
        </span>
      </div>
    );
  };

  // Don't render if not active or no allowed location
  if (!isActive || !allowedLocation) {
    return null;
  }

  return (
    <>
      {/* Location Status Bar */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {renderLocationStatus()}
              {renderAccuracyIndicator()}
            </div>

            <div className="flex items-center gap-4 text-xs text-gray-500">
              {/* Battery Level */}
              {batteryLevel !== null && (
                <div className="flex items-center gap-1">
                  <Battery className="w-3 h-3" />
                  <span>{batteryLevel}%</span>
                </div>
              )}

              {/* Network Info */}
              {networkInfo && (
                <div className="flex items-center gap-1">
                  <Wifi className="w-3 h-3" />
                  <span>{networkInfo.type}</span>
                </div>
              )}

              {/* Last Update */}
              {lastUpdateTime && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>
                    Updated {Math.round((Date.now() - lastUpdateTime) / 1000)}s ago
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Violation Warning Modal */}
      {violationWarningActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 text-center">
            <AlertTriangle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Location Violation Warning
            </h3>
            
            <p className="text-gray-600 mb-4">
              You have moved outside the allowed area for this quiz. 
              Please return immediately to continue.
            </p>

            {violationTimer && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <div className="text-red-800 font-semibold">
                  Time remaining: {violationTimer} seconds
                </div>
                <div className="text-red-600 text-sm mt-1">
                  Quiz will be auto-submitted if you don&apos;t return
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500">
              Current distance from allowed area: {
                currentLocation && allowedLocation ? 
                Math.round(calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  allowedLocation.latitude,
                  allowedLocation.longitude
                ) - allowedLocation.radius) : '?'
              } meters
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentLocationTracker;