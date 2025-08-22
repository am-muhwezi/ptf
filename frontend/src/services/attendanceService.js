import api from '../config/api';

const ENDPOINTS = {
  CHECK_IN: 'attendance/check-in/',
  CHECK_OUT: 'attendance/check-out/',
  STATUS: 'attendance/status/',
  TODAY: 'attendance/today/',
};

export const attendanceService = {
  // Check-in a member
  async checkIn(data) {
    try {
      const response = await api.post(ENDPOINTS.CHECK_IN, {
        member_id: data.memberId,
        visit_type: data.visitType, // 'indoor' or 'outdoor'
        activities: data.activities || [],
        notes: data.notes || ''
      });
      return response.data;
    } catch (error) {
      console.error('Check-in failed:', error);
      throw new Error(error.response?.data?.error || 'Check-in failed');
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
      console.error('Check-out failed:', error);
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
      console.error('Failed to get member status:', error);
      throw new Error(error.response?.data?.error || 'Failed to get member status');
    }
  },

  // Get today's attendance overview
  async getTodaysAttendance() {
    try {
      const response = await api.get(ENDPOINTS.TODAY);
      return response.data;
    } catch (error) {
      console.error('Failed to get today\'s attendance:', error);
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
      visitType: log.visit_type,
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

  // Get attendance logs with filtering (mock for now, replace with real API)
  async getAttendanceLogs(filters = {}) {
    try {
      // For now, we'll use today's attendance and extend it
      // In the future, you'd have a dedicated endpoint for historical logs
      const todaysData = await this.getTodaysAttendance();
      
      // Convert the active members data to attendance log format
      const logs = todaysData.active_members.map(member => ({
        id: member.id,
        member_id: member.id,
        member_name: member.name,
        visit_type: member.visit_type,
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

      if (filters.visitType && filters.visitType !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.visit_type === filters.visitType);
      }

      return filteredLogs.map(log => this.formatAttendanceLog(log));
    } catch (error) {
      console.error('Failed to get attendance logs:', error);
      throw new Error('Failed to get attendance logs');
    }
  }
};

export default attendanceService;