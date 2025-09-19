import React, { useState, useEffect, useCallback } from 'react';
import Button from '../ui/Button';
import { useApiMutation } from '../../hooks/useApi';
import { memberService } from '../../services/memberService';
import attendanceService from '../../services/attendanceService';

const CheckInForm = ({ onSubmit, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [memberIdInput, setMemberIdInput] = useState('');
  const [showAdvancedMode, setShowAdvancedMode] = useState(false);

  // Use separate mutations for search only (check-in moved to attendance service)
  const { mutate: searchMembers, loading: isSearching } = useApiMutation(memberService.searchMembers);

  // Debounce hook for search optimization
  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    
    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);
      
      return () => clearTimeout(handler);
    }, [value, delay]);
    
    return debouncedValue;
  };

  useEffect(() => {
    const timerId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => {
      clearInterval(timerId);
    };
  }, []);

  const debouncedSearchQuery = useDebounce(searchQuery, 200); // Optimized debounce for faster user experience

  // Handle search input changes
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    setError('');
    setSuccessMessage('');

    // Clear selected member when typing to allow new search
    if (selectedMember) {
      setSelectedMember(null);
    }
  };

  // Handle member selection from dropdown
  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setSearchQuery(`${member.first_name} ${member.last_name}`);
    setSearchResults([]);
    setError('');
  };

  // Clear selected member
  const clearSelection = () => {
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
    setError('');
    setSuccessMessage('');
    setMemberIdInput('');
  };

  // Handle member ID input and lookup - Enhanced with PTF prefix support
  const handleMemberIdLookup = async () => {
    if (!memberIdInput.trim()) {
      setError('Please enter a valid member ID');
      return;
    }

    try {
      setError('');

      // Extract numeric ID from input (handles both "12" and "PTF000012" formats)
      let numericId = memberIdInput.trim();

      // Remove PTF prefix if present (case insensitive)
      if (numericId.toLowerCase().startsWith('ptf')) {
        numericId = numericId.substring(3);
      }

      // Remove leading zeros
      numericId = numericId.replace(/^0+/, '') || '0';

      // Validate that we have a numeric ID
      if (!/^\d+$/.test(numericId)) {
        setError('Please enter a valid member ID (numbers only)');
        return;
      }


      const member = await memberService.getMemberById(numericId);
      if (member) {
        setSelectedMember(member);
        setSearchQuery(`${member.first_name} ${member.last_name}`);
        setSearchResults([]);
        setMemberIdInput('');
      }
    } catch (error) {
      const errorMessage = error.message.includes('404') || error.message.includes('not found')
        ? `Member ID ${memberIdInput} not found. Please check the ID and try again.`
        : error.message || 'Failed to lookup member. Please try again.';
      setError(errorMessage);
      setMemberIdInput('');
    }
  };

  // Handle member ID input change - Allow PTF prefix and numbers
  const handleMemberIdChange = (e) => {
    let value = e.target.value.toUpperCase(); // Convert to uppercase for consistency

    // Allow PTF prefix + numbers, or just numbers
    if (value.startsWith('PTF')) {
      // Remove any non-digits after PTF
      value = 'PTF' + value.substring(3).replace(/\D/g, '');
    } else {
      // For non-PTF input, only allow numbers
      value = value.replace(/\D/g, '');
    }

    setMemberIdInput(value);
    setError('');
    setSuccessMessage('');
  };

  // Handle Enter key press in member ID input
  const handleMemberIdKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleMemberIdLookup();
    }
  };

  // Optimized search function with better error handling and loading states
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setError('');
      return;
    }

    // Clear previous results and errors
    setError('');
    setSearchResults([]);

    try {
      const response = await searchMembers(query);

      // Handle the response from your Django backend
      const results = response?.results || [];
      setSearchResults(results);

      if (results.length === 0) {
        setError(`No members found matching "${query}". Try searching by name, email, or phone.`);
      }

    } catch (error) {
      setSearchResults([]);
      setError('Search failed. Please check your connection and try again.');
    }
  }, [searchMembers]);


  const handleCheckIn = async () => {
    if (!selectedMember) {
      setError('Please select a member to check in');
      return;
    }

    // Check payment status before allowing check-in
    if (selectedMember.payment_status !== 'paid') {
      setError(`Cannot check in ${selectedMember.first_name} ${selectedMember.last_name}. Payment status: ${selectedMember.payment_status}. Please update payment before check-in.`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      // Simple check-in with just member ID
      const response = await attendanceService.checkIn({
        memberId: selectedMember.id
      });

      // Show success message
      setSuccessMessage(response?.message || 'Member checked in successfully!');

      // Optional: Call parent onSubmit if needed for additional processing
      if (onSubmit) {
        const checkInData = {
          memberId: selectedMember.id,
          memberName: `${selectedMember.first_name} ${selectedMember.last_name}`,
          membershipType: selectedMember.membershipType,
          checkInTime: new Date().toISOString(),
          date: new Date().toISOString().split('T')[0],
          response: response // Include the backend response
        };
        
        await onSubmit(checkInData);
      }

      // Reset form after successful check-in
      setTimeout(() => {
        clearSelection();
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      // Always use the specific backend error message when available
      const errorMessage = error.message || error.response?.data?.error || 'Failed to check in member. Please try again.';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Optimized debounced search effect
  useEffect(() => {
    if (debouncedSearchQuery && debouncedSearchQuery.length >= 2 && !selectedMember) {
      performSearch(debouncedSearchQuery);
    } else if (!debouncedSearchQuery) {
      // Clear everything when search is empty
      setSearchResults([]);
      setError('');
    } else if (debouncedSearchQuery.length > 0 && debouncedSearchQuery.length < 2) {
      // Show hint for minimum characters
      setSearchResults([]);
      setError('Type at least 2 characters to search');
    }
  }, [debouncedSearchQuery, selectedMember, performSearch]);

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Check-In</h2>
        <p className="text-gray-600">Search for a member to check them in</p>
      </div>

      <div className="space-y-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Search Mode Toggle */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Find Member</h3>
          <button
            type="button"
            onClick={() => {
              setShowAdvancedMode(!showAdvancedMode);
              clearSelection();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            {showAdvancedMode ? 'Use Name Search' : 'Use Member ID'}
          </button>
        </div>

        {/* Member ID Input (Advanced Mode) */}
        {showAdvancedMode ? (
          <div className="relative">
            <label htmlFor="memberIdInput" className="block text-sm font-medium text-gray-700 mb-2">
              Member ID (Power User Mode)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="memberIdInput"
                value={memberIdInput}
                onChange={handleMemberIdChange}
                onKeyPress={handleMemberIdKeyPress}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter member ID (e.g., 12 or PTF0012)"
                disabled={isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={handleMemberIdLookup}
                disabled={isSubmitting || !memberIdInput.trim()}
                className="px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Lookup
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Fast lookup for experienced users. Supports both numeric (12) and PTF format (PTF0012). Press Enter or click Lookup.
            </p>
          </div>
        ) : (
          /* Search Input (Default Mode) */
          <div className="relative">
            <label htmlFor="memberSearch" className="block text-sm font-medium text-gray-700 mb-2">
              Search Member
            </label>
            <input
              type="text"
              id="memberSearch"
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={isSearching ? "Searching..." : "Search by name, email, or phone (min 2 chars)"}
              disabled={isSubmitting}
              autoFocus
            />

            {/* Search Results Dropdown */}
            {searchResults.length > 0 && !selectedMember && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  onClick={() => handleMemberSelect(member)}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">
                        {member.first_name} {member.last_name}
                      </p>
                      <p className="text-sm text-gray-600">{member.email}</p>
                      <p className="text-xs text-gray-500">ID: PTF{String(member.id).padStart(4, '0')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                        member.membership_type === 'indoor' ? 'bg-blue-100 text-blue-800' :
                        member.membership_type === 'outdoor' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {member.membership_type}
                      </span>
                      <div className="mt-1">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                          member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {member.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              </div>
            )}

            {/* Loading indicator */}
            {(isSearching || isSubmitting) && (
              <div className="absolute right-3 top-11 transform -translate-y-1/2" title={isSearching ? "Searching members..." : "Processing check-in..."}>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>
        )}

        {/* Selected Member Details */}
        {selectedMember && (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium text-gray-900">Selected Member</h3>
              <button
                onClick={clearSelection}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Name:</span>
                <span className="text-sm font-medium text-gray-900">
                  {selectedMember.first_name} {selectedMember.last_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Member ID:</span>
                <span className="text-sm font-medium text-gray-900">PTF{String(selectedMember.id).padStart(4, '0')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="text-sm font-medium text-gray-900">{selectedMember.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Membership:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  selectedMember.membership_type === 'indoor' ? 'bg-blue-100 text-blue-800' :
                  selectedMember.membership_type === 'outdoor' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedMember.membership_type}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  selectedMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedMember.status === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Check-in Time Display */}
        {selectedMember && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Check-in Details</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Date:</span>
                <span className="text-sm font-medium text-blue-900">
                  {currentTime.toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Time:</span>
                <span className="text-sm font-medium text-blue-900">
                  {currentTime.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Ready to Check-in Message */}
        {selectedMember && selectedMember.status === 'active' && selectedMember.payment_status === 'paid' && !successMessage && !error && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">
                  Ready to check in <strong>{selectedMember.first_name} {selectedMember.last_name}</strong>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Inactive Member Warning */}
        {selectedMember && selectedMember.status !== 'active' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  <strong>{selectedMember.first_name} {selectedMember.last_name}</strong> has an inactive membership. Please contact administration.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Payment Status Warning */}
        {selectedMember && selectedMember.status === 'active' && selectedMember.payment_status !== 'paid' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">
                  <strong>{selectedMember.first_name} {selectedMember.last_name}</strong> cannot check in. Payment status: <strong>{selectedMember.payment_status}</strong>. Please update payment before check-in.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={handleCheckIn}
            disabled={isSubmitting || !selectedMember || selectedMember.status !== 'active' || selectedMember.payment_status !== 'paid'}
            className="min-w-32"
          >
            {isSubmitting ? 'Checking In...' : 'Check In Member'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CheckInForm;