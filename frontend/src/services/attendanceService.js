import api from '../config/api';

const ENDPOINTS = {
  CHECK_IN: '/check-in/',
  CHECK_OUT: '/check-out/',
  STATUS: '/status/',
  TODAY: '/today/',
};

export const attendanceService = {
  // Check-in a member - simplified to only require member ID
  async checkIn(data) {
    try {
      // Use the correct check-in endpoint that matches production
      const response = await api.post(`/member/checkin/${data.memberId}/`);
      return response.data;
    } catch (error) {
      // Extract the specific error message from the backend
      const backendError = error.response?.data?.error;
      if (backendError) {
        throw new Error(backendError);
      }

      // Fallback to generic error
      throw new Error('Check-in failed');
    }
  },

  // Check-out a member
  async checkOut(data) {
    try {
      const response = await api.post(ENDPOINTS.CHECK_OUT, {
        member_id: data.memberId,
        attendance_id: data.attendanceId || null,
        notes: data.notes || ''
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Check-out failed');
    }
  },

  // Get member's attendance status
  async getMemberStatus(memberId) {
    try {
      const response = await api.get(ENDPOINTS.STATUS, {
        params: { member_id: memberId }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get member status');
    }
  },

  // Get today's attendance overview
  async getTodaysAttendance() {
    try {
      const response = await api.get(ENDPOINTS.TODAY);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Failed to get attendance data');
    }
  },

  // Helper function to format attendance data for frontend
  formatAttendanceLog(log) {
    return {
      id: log.id,
      memberId: log.member?.id || log.member_id,
      memberName: log.member_name || (log.member ? `${log.member.first_name} ${log.member.last_name}` : 'Unknown'),
      memberEmail: log.member_email || log.member?.email,
      memberPhone: log.member_phone || log.member?.phone,
      membershipType: log.member_type || 'unknown', // Added membershipType
      checkInTime: log.check_in_time,
      checkOutTime: log.check_out_time,
      duration: log.formatted_duration || this.calculateDuration(log.check_in_time, log.check_out_time),
      status: log.status,
      activities: log.activities || [],
      notes: log.notes || '',
      isActive: log.is_active || (!log.check_out_time && log.status !== 'checked_out')
    };
  },

  // Calculate duration between check-in and check-out
  calculateDuration(checkInTime, checkOutTime) {
    if (!checkOutTime) return 'Active';
    
    const start = new Date(checkInTime);
    const end = new Date(checkOutTime);
    const diffMs = end - start;
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  },

  // Get attendance logs with filtering - now uses cached data to avoid redundant calls
  async getAttendanceLogs(filters = {}, cachedTodaysData = null) {
    try {
      // Use cached data if provided, otherwise fetch fresh data
      const todaysData = cachedTodaysData || await this.getTodaysAttendance();

      // Convert the active members data to attendance log format
      const logs = todaysData.active_members.map(member => ({
        id: member.id,
        member_id: member.id,
        member_name: member.name,
        member_type: member.member_type, // Added member_type
        check_in_time: member.check_in_time,
        check_out_time: null, // Active members don't have checkout time
        status: 'active',
        activities: member.activities || [],
        notes: '',
        is_active: true
      }));

      // Apply filters
      let filteredLogs = logs;

      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        filteredLogs = filteredLogs.filter(log =>
          log.member_name.toLowerCase().includes(searchTerm) ||
          log.activities.some(activity =>
            activity.toLowerCase().includes(searchTerm)
          )
        );
      }


      return filteredLogs.map(log => this.formatAttendanceLog(log));
    } catch (error) {
      throw new Error('Failed to get attendance logs');
    }
  }
};

export default attendanceService;