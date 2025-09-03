import api from '../config/api';

class BookingService {
  // Booking CRUD operations
  async getAllBookings() {
    try {
      const response = await api.get('/bookings/');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  }

  async getBooking(id) {
    try {
      const response = await api.get(`/bookings/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  }

  async createBooking(bookingData) {
    try {
      const response = await api.post('/bookings/', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  }

  async updateBooking(id, bookingData) {
    try {
      const response = await api.patch(`/bookings/${id}/`, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  }

  async deleteBooking(id) {
    try {
      const response = await api.delete(`/bookings/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting booking:', error);
      throw error;
    }
  }

  // Booking status operations
  async confirmBooking(id) {
    try {
      const response = await api.post(`/bookings/${id}/confirm/`);
      return response.data;
    } catch (error) {
      console.error('Error confirming booking:', error);
      throw error;
    }
  }

  async cancelBooking(id) {
    try {
      const response = await api.post(`/bookings/${id}/cancel/`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  }

  async completeBooking(id) {
    try {
      const response = await api.post(`/bookings/${id}/complete/`);
      return response.data;
    } catch (error) {
      console.error('Error completing booking:', error);
      throw error;
    }
  }

  // Booking Services operations
  async getAllServices() {
    try {
      const response = await api.get('/services/');
      return response.data;
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }

  async getService(id) {
    try {
      const response = await api.get(`/services/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service:', error);
      throw error;
    }
  }

  async getServiceTimeSlots(serviceId) {
    try {
      const response = await api.get(`/services/${serviceId}/time_slots/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching service time slots:', error);
      throw error;
    }
  }

  async getServiceCategories() {
    try {
      const response = await api.get('/services/categories/');
      return response.data;
    } catch (error) {
      console.error('Error fetching service categories:', error);
      throw error;
    }
  }

  // Availability checking
  async checkAvailability(date, serviceId = null) {
    try {
      let url = `/bookings/availability/?date=${date}`;
      if (serviceId) {
        url += `&service_id=${serviceId}`;
      }
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Error checking availability:', error);
      throw error;
    }
  }

  // Time slots operations
  async getAllTimeSlots() {
    try {
      const response = await api.get('/time-slots/');
      return response.data;
    } catch (error) {
      console.error('Error fetching time slots:', error);
      throw error;
    }
  }

  // Utility functions
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatCurrency(amount) {
    return new Intl.NumberFormat('en-UG', {
      style: 'currency',
      currency: 'UGX',
      minimumFractionDigits: 0
    }).format(amount);
  }

  getStatusBadgeClass(status) {
    const statusClasses = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      no_show: 'bg-gray-100 text-gray-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  }

  getBookingTypeClass(type) {
    const typeClasses = {
      indoor: 'bg-blue-100 text-blue-800',
      outdoor: 'bg-green-100 text-green-800'
    };
    return typeClasses[type] || 'bg-gray-100 text-gray-800';
  }

  // Validation helpers
  validateBookingData(bookingData) {
    const errors = {};

    if (!bookingData.member_id) {
      errors.member_id = 'Member is required';
    }

    if (!bookingData.booking_date) {
      errors.booking_date = 'Booking date is required';
    } else {
      const bookingDate = new Date(bookingData.booking_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (bookingDate < today) {
        errors.booking_date = 'Booking date cannot be in the past';
      }
    }

    if (!bookingData.start_time) {
      errors.start_time = 'Start time is required';
    }

    if (!bookingData.end_time) {
      errors.end_time = 'End time is required';
    }

    if (bookingData.start_time && bookingData.end_time) {
      if (bookingData.start_time >= bookingData.end_time) {
        errors.end_time = 'End time must be after start time';
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export default new BookingService();