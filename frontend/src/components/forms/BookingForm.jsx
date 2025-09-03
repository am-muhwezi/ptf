import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import Toast from '../ui/Toast';
import bookingService from '../../services/bookingService';

const BookingForm = ({ onSubmit, onCancel, initialData = null, members = [] }) => {
  const [formData, setFormData] = useState({
    member_id: '',
    service: '',
    booking_date: '',
    start_time: '',
    end_time: '',
    booking_type: 'indoor',
    notes: '',
    ...initialData
  });

  const [services, setServices] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => {
    if (formData.member_id) {
      const member = members.find(m => m.id === parseInt(formData.member_id));
      setSelectedMember(member);
    }
  }, [formData.member_id, members]);

  useEffect(() => {
    if (formData.booking_date && formData.service) {
      checkAvailability();
    } else {
      setAvailableSlots([]);
    }
  }, [formData.booking_date, formData.service]);

  const loadServices = async () => {
    try {
      const servicesData = await bookingService.getAllServices();
      // Filter for indoor-appropriate services (fitness, group classes, personal training)
      const indoorServices = servicesData.filter(service => 
        ['fitness', 'group_class', 'personal_training', 'consultation'].includes(service.category)
      );
      setServices(indoorServices);
    } catch (error) {
      showToast('Error loading services', 'error');
    }
  };

  const checkAvailability = async () => {
    if (!formData.booking_date || !formData.service) return;

    setCheckingAvailability(true);
    try {
      const availability = await bookingService.checkAvailability(
        formData.booking_date, 
        formData.service
      );
      setAvailableSlots(availability.available_slots || []);
    } catch (error) {
      showToast('Error checking availability', 'error');
      setAvailableSlots([]);
    }
    setCheckingAvailability(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear specific error when field is updated
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleTimeSlotSelect = (slot) => {
    setFormData(prev => ({
      ...prev,
      start_time: slot.start_time,
      end_time: slot.end_time
    }));
  };

  const validateForm = () => {
    const validation = bookingService.validateBookingData(formData);
    setErrors(validation.errors);
    return validation.isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const bookingData = {
        ...formData,
        member_id: parseInt(formData.member_id),
        service: formData.service ? parseInt(formData.service) : null
      };
      
      await onSubmit(bookingData);
      showToast('Booking created successfully!', 'success');
    } catch (error) {
      console.error('Error creating booking:', error);
      showToast(error.response?.data?.detail || 'Error creating booking', 'error');
    }
    setLoading(false);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const selectedService = services.find(s => s.id === parseInt(formData.service));
  const isEdit = !!initialData;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Member Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Member *
          </label>
          <select
            name="member_id"
            value={formData.member_id}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.member_id ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Choose a member...</option>
            {members.map(member => (
              <option key={member.id} value={member.id}>
                {member.first_name} {member.last_name} ({member.member_id})
              </option>
            ))}
          </select>
          {errors.member_id && (
            <p className="text-red-500 text-xs mt-1">{errors.member_id}</p>
          )}
          {selectedMember && (
            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Email:</strong> {selectedMember.email}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Phone:</strong> {selectedMember.phone_number}
              </p>
            </div>
          )}
        </div>

        {/* Service Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Service Type *
          </label>
          <select
            name="service"
            value={formData.service}
            onChange={handleInputChange}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.service ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          >
            <option value="">Choose a service...</option>
            {services.map(service => (
              <option key={service.id} value={service.id}>
                {service.name} - {bookingService.formatCurrency(service.price)} 
                ({service.duration_minutes} min)
              </option>
            ))}
          </select>
          {errors.service && (
            <p className="text-red-500 text-xs mt-1">{errors.service}</p>
          )}
          {selectedService && (
            <div className="mt-2 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Description:</strong> {selectedService.description}
              </p>
              <p className="text-sm text-blue-800">
                <strong>Duration:</strong> {selectedService.duration_minutes} minutes
              </p>
              <p className="text-sm text-blue-800">
                <strong>Max Participants:</strong> {selectedService.max_participants}
              </p>
            </div>
          )}
        </div>

        {/* Booking Type - Fixed to Indoor for indoor members */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Booking Type
          </label>
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center">
              <input
                type="radio"
                name="booking_type"
                value="indoor"
                checked={true}
                readOnly
                className="mr-2"
              />
              <span className="text-blue-800 font-medium">Indoor</span>
              <span className="ml-2 text-sm text-blue-600">(Indoor members can only book indoor sessions)</span>
            </div>
          </div>
          <input type="hidden" name="booking_type" value="indoor" />
        </div>

        {/* Date Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Booking Date *
          </label>
          <input
            type="date"
            name="booking_date"
            value={formData.booking_date}
            onChange={handleInputChange}
            min={new Date().toISOString().split('T')[0]}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.booking_date ? 'border-red-500' : 'border-gray-300'
            }`}
            required
          />
          {errors.booking_date && (
            <p className="text-red-500 text-xs mt-1">{errors.booking_date}</p>
          )}
        </div>

        {/* Available Time Slots */}
        {formData.booking_date && formData.service && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Available Time Slots
            </label>
            {checkingAvailability ? (
              <div className="flex items-center justify-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-sm text-gray-600">Checking availability...</span>
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {availableSlots.map((slot, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleTimeSlotSelect(slot)}
                    className={`p-3 border rounded-lg text-sm transition-colors ${
                      formData.start_time === slot.start_time && formData.end_time === slot.end_time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-medium">
                      {formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </div>
                    <div className="text-xs opacity-75">
                      {slot.available_spots} spots available
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No available time slots for the selected date and service.</p>
                <p className="text-xs mt-1">Try selecting a different date or service.</p>
              </div>
            )}
          </div>
        )}

        {/* Manual Time Selection (if no slots available) */}
        {(!availableSlots.length && formData.booking_date && formData.service && !checkingAvailability) && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time *
              </label>
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.start_time ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.start_time && (
                <p className="text-red-500 text-xs mt-1">{errors.start_time}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time *
              </label>
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.end_time ? 'border-red-500' : 'border-gray-300'
                }`}
                required
              />
              {errors.end_time && (
                <p className="text-red-500 text-xs mt-1">{errors.end_time}</p>
              )}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Special Notes (Optional)
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Any special requests or notes for this booking..."
          />
        </div>

        {/* Booking Summary */}
        {selectedService && formData.start_time && formData.end_time && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Service:</strong> {selectedService.name}</p>
              <p><strong>Duration:</strong> {selectedService.duration_minutes} minutes</p>
              <p><strong>Price:</strong> {bookingService.formatCurrency(selectedService.price)}</p>
              <p><strong>Date:</strong> {formData.booking_date}</p>
              <p><strong>Time:</strong> {formatTime(formData.start_time)} - {formatTime(formData.end_time)}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-4 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isEdit ? 'Updating...' : 'Creating...'}
              </div>
            ) : (
              isEdit ? 'Update Booking' : 'Create Booking'
            )}
          </Button>
        </div>
      </form>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </div>
  );
};

export default BookingForm;