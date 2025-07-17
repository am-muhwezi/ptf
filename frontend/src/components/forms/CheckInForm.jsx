import React, { useState } from 'react';
import Button from '../ui/Button';
import { useApiMutation } from '../../hooks/useApi';
import { memberService } from '../../services/memberService';

const CheckInForm = ({ onSubmit, onCancel }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { mutate: searchMembers, loading: isSearching } = useApiMutation(memberService.searchMembers);

  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await searchMembers(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Debounce search
    const timeoutId = setTimeout(() => {
      handleSearch(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleMemberSelect = (member) => {
    setSelectedMember(member);
    setSearchQuery(`${member.first_name} ${member.last_name} (${member.id})`);
    setSearchResults([]);
  };

  const handleCheckIn = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
  
    
    try {
      await onSubmit(selectedMember);

    }catch (err) {
    console.error('Error checking in member:', err);

  } finally {
    setIsSubmitting(false);
  }
};

  const clearSelection = () => {
    setSelectedMember(null);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <div className="max-w-lg mx-auto bg-white p-8 rounded-xl shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Member Check-In</h2>
        <p className="text-gray-600">Search for a member to check them in</p>
      </div>

      <div className="space-y-6">
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
          />
          
          {/* Search Results Dropdown */}
          {searchResults.length > 0 && (
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
                        member.membershipType === 'indoor' ? 'bg-blue-100 text-blue-800' :
                        member.membershipType === 'outdoor' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {member.membershipType}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Loading indicator */}
          {isSearching && (
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
                  selectedMember.membershipType === 'indoor' ? 'bg-blue-100 text-blue-800' :
                  selectedMember.membershipType === 'outdoor' ? 'bg-green-100 text-green-800' :
                  'bg-purple-100 text-purple-800'
                }`}>
                  {selectedMember.membershipType}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                  selectedMember.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {selectedMember.status}
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
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Time:</span>
                <span className="text-sm font-medium text-blue-900">
                  {new Date().toLocaleTimeString()}
                </span>
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
            disabled={!selectedMember || isSubmitting}
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