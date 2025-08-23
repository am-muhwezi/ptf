import { useState, useEffect, useCallback } from 'react';
import attendanceService from '../services/attendanceService';

// Custom hook for managing auto-checkout functionality - DISABLED FOR MVP
export const useAutoCheckout = (enabled = false, intervalMinutes = 5) => {
  const [overdueMembers, setOverdueMembers] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [error, setError] = useState(null);

  // Check for members who need auto-checkout
  const checkForOverdueMembers = useCallback(async () => {
    if (!enabled || isChecking) return;

    try {
      setIsChecking(true);
      setError(null);
      
      const overdue = await attendanceService.checkForAutoCheckout();
      setOverdueMembers(overdue);
      setLastCheck(new Date());
      
      // Log the check for debugging
      if (overdue.length > 0) {
        console.log(`🕐 Auto-checkout check: Found ${overdue.length} members overdue`);
        overdue.forEach(member => {
          console.log(`   - ${member.name}: ${member.timeOverdue} minutes overdue`);
        });
      }
      
      return overdue;
    } catch (err) {
      console.error('Auto-checkout check failed:', err);
      setError(err.message);
      return [];
    } finally {
      setIsChecking(false);
    }
  }, [enabled, isChecking]);

  // Process auto-checkout for specific members
  const processAutoCheckout = useCallback(async (memberIds = []) => {
    try {
      setError(null);
      
      // If no specific members provided, use all overdue members
      const idsToCheckout = memberIds.length > 0 
        ? memberIds 
        : overdueMembers.map(m => m.id);
      
      if (idsToCheckout.length === 0) {
        return { total: 0, successful: 0, failed: 0, results: [] };
      }

      console.log(`🔄 Processing auto-checkout for ${idsToCheckout.length} members`);
      
      const result = await attendanceService.processAutoCheckout(idsToCheckout);
      
      // Update overdue members list by removing successfully checked out members
      const successfulIds = result.results
        .filter(r => r.success)
        .map(r => r.memberId);
      
      setOverdueMembers(prev => 
        prev.filter(member => !successfulIds.includes(member.id))
      );

      console.log(`✅ Auto-checkout complete: ${result.successful} successful, ${result.failed} failed`);
      
      return result;
    } catch (err) {
      console.error('Auto-checkout processing failed:', err);
      setError(err.message);
      throw err;
    }
  }, [overdueMembers]);

  // Auto-process checkout for all overdue members
  const autoProcessOverdueMembers = useCallback(async () => {
    if (overdueMembers.length === 0) return null;
    
    const memberIds = overdueMembers.map(m => m.id);
    return await processAutoCheckout(memberIds);
  }, [overdueMembers, processAutoCheckout]);

  // Set up periodic checking - DISABLED FOR MVP
  useEffect(() => {
    if (!enabled) {
      console.log('🚫 Auto-checkout disabled for MVP - use manual checkout only');
      return;
    }

    // Initial check
    checkForOverdueMembers();

    // Set up interval for periodic checks
    const intervalMs = intervalMinutes * 60 * 1000; // Convert minutes to milliseconds
    const interval = setInterval(checkForOverdueMembers, intervalMs);

    return () => clearInterval(interval);
  }, [enabled, intervalMinutes, checkForOverdueMembers]);

  // Format time for display
  const formatTimeOverdue = useCallback((minutes) => {
    if (minutes < 60) {
      return `${minutes} minutes`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }, []);

  // Get summary statistics
  const getStats = useCallback(() => {
    return {
      totalOverdue: overdueMembers.length,
      maxOverdueTime: overdueMembers.length > 0 
        ? Math.max(...overdueMembers.map(m => m.timeOverdue)) 
        : 0,
      avgOverdueTime: overdueMembers.length > 0 
        ? Math.round(overdueMembers.reduce((sum, m) => sum + m.timeOverdue, 0) / overdueMembers.length)
        : 0,
      lastCheckTime: lastCheck,
      isChecking,
      hasError: !!error
    };
  }, [overdueMembers, lastCheck, isChecking, error]);

  return {
    // State
    overdueMembers,
    isChecking,
    lastCheck,
    error,
    
    // Actions
    checkForOverdueMembers,
    processAutoCheckout,
    autoProcessOverdueMembers,
    
    // Utilities
    formatTimeOverdue,
    getStats
  };
};

export default useAutoCheckout;