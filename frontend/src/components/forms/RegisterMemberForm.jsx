import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { useForm } from '../../hooks/useForm';
import { validateKenyanPhone } from '../../utils/validation';

const RegisterMemberForm = ({ onSubmit, onCancel, initialMembershipType = 'indoor' }) => {
  const initialValues = {
    first_name: '',
    other_names: '',
    last_name: '',
    email: '',
    phone: '',
    idPassport: '',
    bloodGroup: '',
    membershipType: initialMembershipType,
    planType: '',
    paymentStatus: 'pending',
    location: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    medicalConditions: '',
    dateOfBirth: '',
    address: ''
  };

  const validateMemberForm = (values) => {
    const errors = {};
    
    // Only validate essential fields: name, phone, and location (for outdoor)
    if (!values.first_name?.trim()) {
      errors.first_name = 'First name is required';
    }
    
    if (!values.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    }
    
    if (!values.phone?.trim()) {
      errors.phone = 'Phone number is required';
    } else {
      const phoneValidation = validateKenyanPhone(values.phone);
      if (!phoneValidation.isValid) {
        errors.phone = phoneValidation.message;
      }
    }
    
    // Email validation only if provided (optional)
    if (values.email?.trim() && !/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Plan type validation (still needed for system to work)
    if (values.membershipType === 'indoor' && !values.planType) {
      errors.planType = 'Plan type is required for indoor membership';
    }
    
    if (values.membershipType === 'outdoor' && !values.location) {
      errors.location = 'Location is required for outdoor membership';
    }

    // Emergency contact phone validation (optional, but if provided, must be valid)
    if (values.emergency_contact_phone?.trim()) {
      const emergencyPhoneValidation = validateKenyanPhone(values.emergency_contact_phone);
      if (!emergencyPhoneValidation.isValid) {
        errors.emergency_contact_phone = emergencyPhoneValidation.message;
      }
    }

    return errors;
  };

  const handleFormSubmit = async (values) => {
    const memberData = {
      first_name: values.first_name,
      other_names: values.other_names,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      id_passport_no: values.idPassport,
      blood_group: values.bloodGroup,
      membership_type: values.membershipType,
      plan_type: values.planType,
      dance_location: values.location,
      emergency_contact_name: values.emergency_contact_name,
      emergency_contact_phone: values.emergency_contact_phone,
      medical_conditions: values.medicalConditions,
      date_of_birth: values.dateOfBirth,
      physical_address: values.address,
      registrationDate: new Date().toISOString(),
      status: 'active',
      payment_status: values.paymentStatus
    };
    
    await onSubmit(memberData);
  };

  const {
    values: formData,
    errors,
    isSubmitting,
    submitError: serverError,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue
  } = useForm(initialValues, validateMemberForm, handleFormSubmit);

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
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.first_name ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter first name"
            />
            {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
          </div>

          <div>
            <label htmlFor="other_names" className="block text-sm font-medium text-gray-700 mb-1">
              Other Names
            </label>
            <input
              type="text"
              id="other_names"
              name="other_names"
              value={formData.other_names}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter other names (optional)"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
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
              onBlur={handleBlur}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="e.g., 0722 123 456 or +254 722 123 456"
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
              Blood Group (Optional)
            </label>
            <select
              id="bloodGroup"
              name="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select blood group</option>
              <option value="A(-)">A(-)</option>
              <option value="A(+)">A(+)</option>
              <option value="B(+)">B(+)</option>
              <option value="B(-)">B(-)</option>
              <option value="AB(+)">AB(+)</option>
              <option value="AB(-)">AB(-)</option>
              <option value="O(+)">O(+)</option>
              <option value="O(-)">O(-)</option>
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
                <option value="karura">Karura</option>
                <option value="sagret">Sagret</option>
                <option value="mushroom">Mushroom</option>
                <option value="pcea_loreto">PCEA Loreto</option>
                <option value="bethany">Bethany</option>
                <option value="5star">5Star</option>
                <option value="kijani">Kijani</option>
                <option value="rustique">Rustique</option>
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
              <label htmlFor="emergency_contact_name" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Name (Optional)
              </label>
              <input
                type="text"
                id="emergency_contact_name"
                name="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergency_contact_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter emergency contact name"
              />
              {errors.emergency_contact_name && <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_name}</p>}
            </div>

            <div>
              <label htmlFor="emergency_contact_phone" className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact Phone (Optional)
              </label>
              <input
                type="tel"
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                onBlur={handleBlur}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.emergency_contact_phone ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="e.g., 0722 123 456 or +254 722 123 456"
              />
              {errors.emergency_contact_phone && <p className="text-red-500 text-xs mt-1">{errors.emergency_contact_phone}</p>}
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