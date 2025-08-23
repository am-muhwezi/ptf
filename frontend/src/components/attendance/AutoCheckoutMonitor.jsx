import React, { useState } from 'react';
import Button from '../ui/Button';
import useAutoCheckout from '../../hooks/useAutoCheckout';

const AutoCheckoutMonitor = ({ className = "", onAutoCheckout = null }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [processing, setProcessing] = useState(false);
  
  const {
    overdueMembers,
    isChecking,
    lastCheck,
    error,
    checkForOverdueMembers,
    autoProcessOverdueMembers,
    formatTimeOverdue,
    getStats
  } = useAutoCheckout(false, 5); // DISABLED for MVP - use manual checkout only

  const stats = getStats();

  const handleAutoCheckout = async () => {
    if (processing || overdueMembers.length === 0) return;
    
    try {
      setProcessing(true);
      const result = await autoProcessOverdueMembers();
      
      if (result && onAutoCheckout) {
        onAutoCheckout(result);
      }

      // Show success message
      if (result && result.successful > 0) {
        alert(`✅ Successfully checked out ${result.successful} members`);
      }
    } catch (err) {
      alert(`❌ Auto-checkout failed: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleManualCheck = async () => {
    try {
      await checkForOverdueMembers();
    } catch (err) {
      console.error('Manual check failed:', err);
    }
  };

  if (!overdueMembers.length && !error) {
    return (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-green-800">
              ✅ All members within session time limits
            </p>
            {lastCheck && (
              <p className="text-xs text-green-600 mt-1">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="text-green-700 border-green-300 hover:bg-green-100"
            >
              {isChecking ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                  Checking...
                </>
              ) : (
                'Check Now'
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-800">Auto-checkout check failed</p>
            <p className="text-xs text-red-600 mt-1">{error}</p>
          </div>
          <div className="ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleManualCheck}
              disabled={isChecking}
              className="text-red-700 border-red-300 hover:bg-red-100"
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">
              ⏰ Members Overdue for Checkout ({overdueMembers.length})
            </h3>
            <div className="mt-1 text-xs text-yellow-700">
              <p>Session limit: 2hr 20min • Max overdue: {formatTimeOverdue(stats.maxOverdueTime)}</p>
              {lastCheck && (
                <p className="mt-1">Last checked: {lastCheck.toLocaleTimeString()}</p>
              )}
            </div>
            
            {showDetails && (
              <div className="mt-3 space-y-2">
                {overdueMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-yellow-100 rounded p-2 text-xs">
                    <div>
                      <span className="font-medium">{member.name}</span>
                      <span className="text-yellow-600 ml-2">
                        Checked in: {new Date(member.check_in_time).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                        +{formatTimeOverdue(member.timeOverdue)} over
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="flex space-x-2 ml-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
          >
            {showDetails ? 'Hide' : 'Details'}
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            onClick={handleAutoCheckout}
            disabled={processing || overdueMembers.length === 0}
            className="bg-yellow-600 hover:bg-yellow-700 text-white"
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Checking Out...
              </>
            ) : (
              `Auto Checkout (${overdueMembers.length})`
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AutoCheckoutMonitor;