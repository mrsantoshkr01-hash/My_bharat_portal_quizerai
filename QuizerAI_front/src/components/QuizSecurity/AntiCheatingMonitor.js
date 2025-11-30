"use client";

import React, { useEffect, useCallback, useRef, useState } from 'react';
import toast from 'react-hot-toast';

const AntiCheatingMonitor = ({
  sessionId,
  securityConfig,
  onViolation,
  isActive = true
}) => {
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [violations, setViolations] = useState([]);
  
  const lastActiveTime = useRef(Date.now());
  const isFullScreen = useRef(false);

  // Report violation to parent and backend
  const reportViolation = useCallback(async (violationType, description, severity = 'medium') => {
    const violationData = {
      violation_type: violationType,
      description,
      severity,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      session_id: sessionId
    };

    // Add to local violations list
    setViolations(prev => [violationData, ...prev.slice(0, 9)]); // Keep last 10

    // Show user notification
    let message = '';
    switch (violationType) {
      case 'tab_change':
        message = '⚠️ Tab switching detected! Stay on the quiz page.';
        setTabSwitchCount(prev => prev + 1);
        break;
      case 'window_blur':
        message = '⚠️ Window focus lost! Keep the quiz window active.';
        setWindowBlurCount(prev => prev + 1);
        break;
      case 'copy_paste':
        message = '⚠️ Copy/paste is not allowed during the quiz.';
        break;
      case 'right_click':
        message = '⚠️ Right-click is disabled during the quiz.';
        break;
      case 'keyboard_shortcut':
        message = '⚠️ Keyboard shortcuts are disabled during the quiz.';
        break;
      case 'fullscreen_exit':
        message = '⚠️ Please return to fullscreen mode.';
        break;
      default:
        message = '⚠️ Suspicious activity detected.';
    }

    toast.error(message, { duration: 4000 });

    // Notify parent component
    if (onViolation) {
      onViolation(violationData);
    }

    return violationData;
  }, [sessionId, onViolation]);

  // Tab/Window visibility change handler
  const handleVisibilityChange = useCallback(() => {
    if (!isActive || !securityConfig) return;

    if (document.hidden || document.visibilityState === 'hidden') {
      lastActiveTime.current = Date.now();
      
      if (securityConfig.prevent_tab_switching) {
        reportViolation(
          'tab_change',
          'Student switched tabs or minimized browser window',
          'high'
        );
      }
    }
  }, [isActive, securityConfig, reportViolation]);

  // Window blur/focus handler
  const handleWindowBlur = useCallback(() => {
    if (!isActive || !securityConfig) return;

    if (securityConfig.prevent_tab_switching) {
      reportViolation(
        'window_blur',
        'Quiz window lost focus',
        'medium'
      );
    }
  }, [isActive, securityConfig, reportViolation]);

  const handleWindowFocus = useCallback(() => {
    const timeAway = Date.now() - lastActiveTime.current;
    if (timeAway > 5000) { // If away for more than 5 seconds
      console.log(`Window regained focus after ${timeAway}ms`);
    }
  }, []);

  // Copy/Paste prevention
  const handleCopy = useCallback((e) => {
    if (!isActive || !securityConfig?.prevent_copy_paste) return;

    e.preventDefault();
    reportViolation(
      'copy_paste',
      'Attempted to copy content',
      'medium'
    );
  }, [isActive, securityConfig, reportViolation]);

  const handlePaste = useCallback((e) => {
    if (!isActive || !securityConfig?.prevent_copy_paste) return;

    e.preventDefault();
    reportViolation(
      'copy_paste',
      'Attempted to paste content',
      'medium'
    );
  }, [isActive, securityConfig, reportViolation]);

  const handleCut = useCallback((e) => {
    if (!isActive || !securityConfig?.prevent_copy_paste) return;

    e.preventDefault();
    reportViolation(
      'copy_paste',
      'Attempted to cut content',
      'medium'
    );
  }, [isActive, securityConfig, reportViolation]);

  // Right-click prevention
  const handleContextMenu = useCallback((e) => {
    if (!isActive || !securityConfig?.prevent_right_click) return;

    e.preventDefault();
    reportViolation(
      'right_click',
      'Attempted to open context menu',
      'low'
    );
  }, [isActive, securityConfig, reportViolation]);

  // Keyboard shortcut prevention
  const handleKeyDown = useCallback((e) => {
    if (!isActive || !securityConfig?.prevent_keyboard_shortcuts) return;

    // List of prevented shortcuts
    const preventedShortcuts = [
      // Developer tools
      { key: 'F12' },
      { ctrlKey: true, shiftKey: true, key: 'I' }, // Chrome DevTools
      { ctrlKey: true, shiftKey: true, key: 'J' }, // Console
      { ctrlKey: true, shiftKey: true, key: 'C' }, // Element inspector
      { ctrlKey: true, key: 'U' }, // View source
      
      // Browser navigation
      { ctrlKey: true, key: 'R' }, // Refresh
      { key: 'F5' }, // Refresh
      { ctrlKey: true, shiftKey: true, key: 'R' }, // Hard refresh
      { ctrlKey: true, key: 'H' }, // History
      { ctrlKey: true, key: 'J' }, // Downloads
      { ctrlKey: true, key: 'D' }, // Bookmark
      
      // Window/Tab management
      { ctrlKey: true, key: 'T' }, // New tab
      { ctrlKey: true, key: 'W' }, // Close tab
      { ctrlKey: true, shiftKey: true, key: 'T' }, // Reopen tab
      { ctrlKey: true, key: 'N' }, // New window
      { ctrlKey: true, shiftKey: true, key: 'N' }, // Incognito
      { altKey: true, key: 'Tab' }, // Alt+Tab
      
      // Search and find
      { ctrlKey: true, key: 'F' }, // Find
      { ctrlKey: true, key: 'G' }, // Find next
      
      // Zoom
      { ctrlKey: true, key: '=' }, // Zoom in
      { ctrlKey: true, key: '-' }, // Zoom out
      { ctrlKey: true, key: '0' }, // Reset zoom
    ];

    // Check if current key combination is prevented
    const isPreventedShortcut = preventedShortcuts.some(shortcut => {
      return (!shortcut.ctrlKey || e.ctrlKey === shortcut.ctrlKey) &&
             (!shortcut.altKey || e.altKey === shortcut.altKey) &&
             (!shortcut.shiftKey || e.shiftKey === shortcut.shiftKey) &&
             (!shortcut.key || e.key === shortcut.key);
    });

    if (isPreventedShortcut) {
      e.preventDefault();
      e.stopPropagation();
      
      reportViolation(
        'keyboard_shortcut',
        `Attempted to use blocked shortcut: ${
          e.ctrlKey ? 'Ctrl+' : ''
        }${
          e.altKey ? 'Alt+' : ''
        }${
          e.shiftKey ? 'Shift+' : ''
        }${e.key}`,
        'medium'
      );
    }
  }, [isActive, securityConfig, reportViolation]);

  // Fullscreen monitoring
  const handleFullscreenChange = useCallback(() => {
    if (!isActive || !securityConfig?.require_fullscreen) return;

    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    if (isFullScreen.current && !isCurrentlyFullscreen) {
      reportViolation(
        'fullscreen_exit',
        'Student exited fullscreen mode',
        'high'
      );
    }

    isFullScreen.current = isCurrentlyFullscreen;
  }, [isActive, securityConfig, reportViolation]);

  // Print prevention
  const handleBeforePrint = useCallback((e) => {
    if (!isActive) return;

    e.preventDefault();
    reportViolation(
      'print_attempt',
      'Attempted to print quiz content',
      'medium'
    );
  }, [isActive, reportViolation]);

  // Screen recording detection (basic)
  const checkForScreenRecording = useCallback(async () => {
    if (!isActive || typeof navigator.mediaDevices?.getDisplayMedia !== 'function') return;

    try {
      // This is a basic check - more sophisticated detection would be needed for production
      const devices = await navigator.mediaDevices.enumerateDevices();
      const screenRecordingDevices = devices.filter(device => 
        device.kind === 'videoinput' && 
        (device.label.includes('screen') || device.label.includes('display'))
      );

      if (screenRecordingDevices.length > 0) {
        reportViolation(
          'screen_recording',
          'Potential screen recording detected',
          'high'
        );
      }
    } catch (error) {
      // Permission denied or other error - this is expected
      console.log('Screen recording check failed:', error);
    }
  }, [isActive, reportViolation]);

  // Request fullscreen mode
  const requestFullscreen = useCallback(() => {
    const element = document.documentElement;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!isActive || !securityConfig) return;

    const events = [
      // Visibility and focus events
      ['visibilitychange', handleVisibilityChange, document],
      ['blur', handleWindowBlur, window],
      ['focus', handleWindowFocus, window],
      
      // Copy/paste events
      ['copy', handleCopy, document],
      ['paste', handlePaste, document],
      ['cut', handleCut, document],
      
      // Right-click prevention
      ['contextmenu', handleContextMenu, document],
      
      // Keyboard events
      ['keydown', handleKeyDown, document],
      
      // Fullscreen events
      ['fullscreenchange', handleFullscreenChange, document],
      ['webkitfullscreenchange', handleFullscreenChange, document],
      ['mozfullscreenchange', handleFullscreenChange, document],
      ['MSFullscreenChange', handleFullscreenChange, document],
      
      // Print prevention
      ['beforeprint', handleBeforePrint, window],
    ];

    // Add event listeners
    events.forEach(([event, handler, target]) => {
      target.addEventListener(event, handler, { passive: false });
    });

    // Periodic screen recording check
    const screenRecordingInterval = setInterval(checkForScreenRecording, 30000); // Every 30 seconds

    // Request fullscreen if required
    if (securityConfig.require_fullscreen && !isFullScreen.current) {
      // Give user a moment to see the interface before going fullscreen
      setTimeout(() => {
        if (isActive) {
          requestFullscreen();
        }
      }, 2000);
    }

    return () => {
      // Remove event listeners
      events.forEach(([event, handler, target]) => {
        target.removeEventListener(event, handler);
      });
      
      clearInterval(screenRecordingInterval);
    };
  }, [
    isActive,
    securityConfig,
    handleVisibilityChange,
    handleWindowBlur,
    handleWindowFocus,
    handleCopy,
    handlePaste,
    handleCut,
    handleContextMenu,
    handleKeyDown,
    handleFullscreenChange,
    handleBeforePrint,
    checkForScreenRecording,
    requestFullscreen
  ]);

  // Render violation summary (can be shown in quiz interface)
  const renderViolationSummary = () => {
    if (violations.length === 0) return null;

    return (
      <div className="fixed bottom-4 right-4 z-40 bg-red-50 border border-red-200 rounded-lg p-3 max-w-sm">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-red-800 text-sm">Security Violations</h4>
          <span className="text-red-600 text-xs">{violations.length}</span>
        </div>
        
        <div className="space-y-1 text-xs text-red-700">
          <div>Tab switches: {tabSwitchCount}</div>
          <div>Window blur events: {windowBlurCount}</div>
        </div>
        
        {violations.length > 0 && (
          <div className="mt-2 text-xs text-red-600">
            Latest: {violations[0].description}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Violation Summary */}
      {renderViolationSummary()}
      
      {/* Fullscreen prompt if required but not active */}
      {securityConfig?.require_fullscreen && !isFullScreen.current && isActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white rounded-xl p-6 max-w-md mx-4 text-center">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Fullscreen Required
            </h3>
            <p className="text-gray-600 mb-6">
              This quiz requires fullscreen mode for security. Click below to enter fullscreen.
            </p>
            <button
              onClick={requestFullscreen}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AntiCheatingMonitor;