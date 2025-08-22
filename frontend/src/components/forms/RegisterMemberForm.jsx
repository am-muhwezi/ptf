import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import authService from '../../services/authService';

const RegisterMemberForm = ({ onSubmit, onCancel, initialMembershipType = 'indoor' }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    idPassport: '',
    bloodGroup: '',
    membershipType: initialMembershipType,
    planType: '',
    paymentStatus: 'pending',
    location: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalConditions: '',
    dateOfBirth: '',
    address: ''
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [outdoorRateCards, setOutdoorRateCards] = useState([]);
  const [loadingRateCards, setLoadingRateCards] = useState(false);

  // Set hardcoded outdoor rate cards when membership type changes to outdoor
  useEffect(() => {
    if (formData.membershipType === 'outdoor') {
      setOutdoorRateCards([
        { id: 'outdoor_daily', plan_code: 'outdoor_daily', display_name: 'Daily Drop-in - KES 1,000', weekly_fee: 1000, sessions_per_week: 1 },
        { id: '1_week', plan_code: '1_session_week', display_name: '1x/Week - KES 3,000', weekly_fee: 3000, sessions_per_week: 1 },
        { id: '2_week', plan_code: '2_sessions_week', display_name: '2x/Week - KES 4,000', weekly_fee: 4000, sessions_per_week: 2 },
        { id: '3_week', plan_code: '3_sessions_week', display_name: '3x/Week - KES 5,000', weekly_fee: 5000, sessions_per_week: 3 },
        { id: '4_week', plan_code: '4_sessions_week', display_name: '4x/Week - KES 6,000', weekly_fee: 6000, sessions_per_week: 4 },
        { id: '5_week', plan_code: '5_sessions_week', display_name: '5x/Week - KES 7,000', weekly_fee: 7000, sessions_per_week: 5 }
      ]);
    }
  }, [formData.membershipType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }

    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }


    if (!formData.emergencyContact.trim()) {
      newErrors.emergencyContact = 'Emergency contact is required';
    }

    if (!formData.emergencyPhone.trim()) {
      newErrors.emergencyPhone = 'Emergency phone is required';
    }

    if (formData.membershipType === 'indoor' && !formData.planType) {
      newErrors.planType = 'Plan type is required for indoor membership';
    }

    if (formData.membershipType === 'outdoor' && !formData.location) {
      newErrors.location = 'Location is required for outdoor membership';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setServerError('');
    
    try {
      // Map frontend field names to backend field names  
      const memberData = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        email: formData.email,
        phone: formData.phone,
        idPassport: formData.idPassport,
        bloodGroup: formData.bloodGroup,
        membership_type: formData.membershipType,
        plan_type: formData.planType,
        location: formData.location,
        emergencyContact: formData.emergencyContact,
        emergencyPhone: formData.emergencyPhone,
        medicalConditions: formData.medicalConditions,
        dateOfBirth: formData.dateOfBirth,
        address: formData.address,
        registrationDate: new Date().toISOString(),
        status: 'active'
      };
      
      console.log('Sending member data:', memberData);
      await onSubmit(memberData);
    } catch (error) {
      console.error('Error registering member:', error);
      console.error('Error object keys:', Object.keys(error));
      console.error('Error message:', error.message);
      console.error('Error fieldErrors:', error.fieldErrors);
      
      // Handle field-level errors from backend
      if (error.fieldErrors) {
        console.log('Field errors received:', error.fieldErrors);
        // Map backend field names to frontend field names
        const mappedErrors = {};
        Object.keys(error.fieldErrors).forEach(field => {
          // Map backend field names to frontend form field names
          let frontendField = field;
          if (field === 'membership_type') frontendField = 'membershipType';
          if (field === 'plan_type') frontendField = 'planType';
          
          mappedErrors[frontendField] = Array.isArray(error.fieldErrors[field]) 
            ? error.fieldErrors[field][0] 
            : error.fieldErrors[field];
        });
        
        console.log('Mapped errors:', mappedErrors);
        setErrors(mappedErrors);
      }
      
      // Always show the error message, even if we have field errors
      const errorMessage = error.message || 'Failed to register member. Please check the form and try again.';
      console.log('Setting server error:', errorMessage);
      setServerError(errorMessage);
      
      // Scroll to top to show error
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Register New Member</h2>
        <p className="text-sm sm:text-base text-gray-600">Fill in the member's information to create their account</p>
      </div>

      {/* Server Error Display */}
      {serverError && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-red-800 font-medium mb-1">Registration Failed</h4>
              <p className="text-sm text-red-700">{serverError}</p>
            </div>
          </div>
        </div>
      )}
      

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Personal Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter first name"
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.last_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter last name"
            />
            {errors.last_name && <p className="text-red-500 text-xs mt-1">{errors.last_name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter email address"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="idPassport" className="block text-sm font-medium text-gray-700 mb-1">
              ID/Passport No
            </label>
            <input
              type="text"
              id="idPassport"
              name="idPassport"
              value={formData.idPassport}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.idPassport ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter valid ID/Passport No"
            />
            {errors.idPassport && <p className="text-red-500 text-xs mt-1">{errors.idPassport}</p>}
          </div>

          <div>
            <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-1">
              Blood Group
            </label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select blood group</option>
              <option value="A-">A(-)</option>
              <option value="A+">A(+)</option>
              <option value="B+">B(+)</option>
              <option value="B-">B(-)</option>
              <option value="AB+">AB(+)</option>
              <option value="AB-">AB(-)</option>
              <option value="O+">O(+)</option>
              <option value="O-">O(-)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
              Date of Birth
            </label>
            <input
              type="date"
              id="dateOfBirth"
              name="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
          </div>

          <div>
            <label htmlFor="membershipType" className="block text-sm font-medium text-gray-700 mb-1">
              Membership Type *
            </label>
            <select
              id="membershipType"
              name="membershipType"
              value={formData.membershipType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="indoor">Indoor Membership</option>
              <option value="outdoor">Outdoor Membership</option>
            </select>
          </div>
        </div>
        {/* Conditional Fields Based on Membership Type */}
        {formData.membershipType === 'indoor' && (
          <div>
            <label htmlFor="planType" className="block text-sm font-medium text-gray-700 mb-1">
              Plan Type *
            </label>
            <select
              id="planType"
              name="planType"
              value={formData.planType}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a plan</option>
              <option value="daily">Daily</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="bi-annual">Bi-Annual</option>
              <option value="annual">Annual</option>
            </select>
            {errors.planType && <p className="text-red-500 text-xs mt-1">{errors.planType}</p>}
          </div>
        )}

        {formData.membershipType === 'outdoor' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Dance Class Location *
              </label>
              <select
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a location</option>
                <option value="arboretum">Arboretum</option>
                <option value="boxwood">Boxwood</option>
                <option value="botanical">Botanical</option>
                <option value="karura">Karura</option>
                <option value="sagret">Sagret</option>
                <option value="mushroom">Mushroom</option>
                <option value="loreto">PCEA Loreto</option>
              </select>
              {errors.location && <p className="text-red-500 text-xs mt-1">{errors.location}</p>}
            </div>
            
            <div>
              <label htmlFor="planType" className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type *
              </label>
              <select
                id="planType"
                name="planType"
                value={formData.planType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loadingRateCards}
              >
                <option value="">{loadingRateCards ? 'Loading plans...' : 'Select a plan'}</option>
                {outdoorRateCards.map((card) => (
                  <option key={card.id || card.plan_code} value={card.plan_code}>
                    {card.display_name}
                  </option>
                ))}
              </select>
              {errors.planType && <p className="text-red-500 text-xs mt-1">{errors.planType}</p>}
              {loadingRateCards && (
                <p className="text-blue-500 text-xs mt-1">Loading available plans...</p>
              )}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Physical Address
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter full address"
          />
        </div>

        {/* Emergency Contact */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact Information</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emergencyContact" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name *
              </label>
              <input
                type="text"
                id="emergencyContact"
                name="emergencyContact"
                value={formData.emergencyContact}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyContact ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter emergency contact name"
              />
              {errors.emergencyContact && <p className="text-red-500 text-xs mt-1">{errors.emergencyContact}</p>}
            </div>

            <div>
              <label htmlFor="emergencyPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone *
              </label>
              <input
                type="tel"
                id="emergencyPhone"
                name="emergencyPhone"
                value={formData.emergencyPhone}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter emergency contact phone"
              />
              {errors.emergencyPhone && <p className="text-red-500 text-xs mt-1">{errors.emergencyPhone}</p>}
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Medical Information</h3>
          
          <div>
            <label htmlFor="medicalConditions" className="block text-sm font-medium text-gray-700 mb-1">
              Medical Conditions / Allergies
            </label>
            <textarea
              id="medicalConditions"
              name="medicalConditions"
              value={formData.medicalConditions}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="List any medical conditions, allergies, or special considerations"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isSubmitting}
            className="w-full sm:w-auto min-w-32"
          >
            {isSubmitting ? 'Registering...' : 'Register Member'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RegisterMemberForm;