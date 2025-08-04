import React, { useState } from 'react';
import Button from '../ui/Button';

const RegisterMemberForm = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    idPassport: '',
    bloodGroup: '',
    membershipType: 'indoor',
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
    
    try {
      const memberData = {
        ...formData,
        registrationDate: new Date().toISOString(),
        status: 'active'
      };

      await onSubmit(memberData);
    } catch (error) {
      console.error('Error registering member:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg max-h-[90vh] overflow-y-auto">
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Register New Member</h2>
        <p className="text-sm sm:text-base text-gray-600">Fill in the member's information to create their account</p>
      </div>

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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700 mb-1">
              Payment Status
            </label>
            <select
              id="paymentStatus"
              name="paymentStatus"
              value={formData.paymentStatus}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
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
              <option value="daily">Daily - KES 500</option>
              <option value="monthly">Monthly - KES 8,000</option>
              <option value="bi-annual">Bi-Annual - KES 40,000</option>
              <option value="annual">Annual - KES 70,000</option>
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
              >
                <option value="">Select a plan</option>
                <option value="daily">Daily - KES 1,000</option>
              </select>
              {errors.planType && <p className="text-red-500 text-xs mt-1">{errors.planType}</p>}
            </div>
          </div>
        )}

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Address
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