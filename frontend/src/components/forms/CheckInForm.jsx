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

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setError('');
    setSuccessMessage('');
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
  };

  // FIXED: Proper search function with error handling
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      
      const response = await searchMembers(query);
      

      // Handle the response from your Django backend
      const results = response?.results || [];
      setSearchResults(results);

      if (results.length === 0) {
        setError(`No members found matching "${query}"`);
      }

    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
      setError('Search failed. Please try again.');
    }
  }, [searchMembers]);


  const handleCheckIn = async () => {
    if (!selectedMember) {
      setError('Please select a member to check in');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setSuccessMessage('');

      // Use attendance service for check-in with basic indoor visit
      const response = await attendanceService.checkIn({
        memberId: selectedMember.id,
        visitType: 'indoor', // Default to indoor for simplicity
        activities: ['General Workout'], // Simple default activity
        notes: ''
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
      console.error('Check-in error:', error);
      setError(error.message || 'Failed to check in member. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // FIXED: Debounced search effect with proper cleanup
  useEffect(() => {
    if (debouncedSearchQuery && !selectedMember) {
      performSearch(debouncedSearchQuery);
    } else if (!debouncedSearchQuery) {
      setSearchResults([]);
      setError('');
    }
  }, [debouncedSearchQuery, selectedMember]);

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

        {/* Search Input */}
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
            placeholder="Enter name, email, or member ID"
            disabled={isSubmitting}
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
                      <p className="text-xs text-gray-500">ID: {member.id}</p>
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
            <div className="absolute right-3 top-11 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

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
                <span className="text-sm font-medium text-gray-900">{selectedMember.id}</span>
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
        {selectedMember && selectedMember.status === 'active' && !successMessage && (
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
            disabled={isSubmitting}
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