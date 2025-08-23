import api from '../config/api';

// Consolidated attendance API endpoint
const ATTENDANCE_API = 'attendance/';

export const attendanceService = {
  // Check-in a member
  async checkIn(data) {
    try {
      const requestData = {
        action: 'check_in',
        member_id: data.memberId,
        visit_type: data.visitType, // 'indoor' or 'outdoor'
        activities: data.activities || [],
        notes: data.notes || ''
      };
      
      console.log('Check-in request data:', requestData);
      
      const response = await api.post(ATTENDANCE_API, requestData);
      return {
        action: 'check_in',
        success: response.data.success,
        message: response.data.message,
        data: response.data.log
      };
    } catch (error) {
      console.error('Check-in failed:', error);
      console.error('Error response:', error.response?.data);
      
      // Handle already checked-in error specifically
      if (error.response?.status === 400 && 
          error.response?.data?.error === 'Member is already checked in') {
        
        const alreadyCheckedInError = new Error('Member is already checked in');
        alreadyCheckedInError.isAlreadyCheckedIn = true;
        alreadyCheckedInError.currentCheckin = error.response.data.current_checkin;
        throw alreadyCheckedInError;
      }
      
      // Get more specific error message for other errors
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message ||
                          error.response?.data?.details ||
                          'Check-in failed';
      
      throw new Error(errorMessage);
    }
  },

  // Check-out a member
  async checkOut(data) {
    try {
      const response = await api.post(ATTENDANCE_API, {
        action: 'check_out',
        member_id: data.memberId,
        attendance_id: data.attendanceId || null,
        notes: data.notes || ''
      });
      return {
        action: 'check_out',
        success: response.data.success,
        message: response.data.message,
        data: response.data.log
      };
    } catch (error) {
      console.error('Check-out failed:', error);
      throw new Error(error.response?.data?.error || 'Check-out failed');
    }
  },

  // Get member's attendance status
  async getMemberStatus(memberId) {
    try {
      const response = await api.get(ATTENDANCE_API, {
        params: { 
          member_id: memberId,
          limit: 10
        }
      });
      
      // Transform simplified logs response to match expected format
      const logs = response.data.logs || [];
      const activeLogs = logs.filter(log => !log.check_out_time);
      
      return {
        success: true,
        data: {
          member: {
            id: memberId,
            is_active: activeLogs.length > 0
          },
          active_checkins: logs.map(log => this.formatAttendanceLog(log)),
          daily_summary: null
        }
      };
    } catch (error) {
      console.error('Failed to get member status:', error);
      throw new Error(error.response?.data?.error || 'Failed to get member status');
    }
  },

  // Get today's attendance overview - simplified for MVP
  async getTodaysAttendance() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const response = await api.get(ATTENDANCE_API, {
        params: { 
          date: today,
          limit: 100
        }
      });
      
      const logs = response.data.logs || [];
      
      // Calculate summary data from logs
      const indoorLogs = logs.filter(log => log.visit_type === 'indoor');
      const outdoorLogs = logs.filter(log => log.visit_type === 'outdoor');
      const activeLogs = logs.filter(log => !log.check_out_time);
      const indoorActive = activeLogs.filter(log => log.visit_type === 'indoor');
      const outdoorActive = activeLogs.filter(log => log.visit_type === 'outdoor');
      
      return {
        summary: {
          total_checkins: logs.length,
          currently_active: activeLogs.length,
          indoor: {
            total: indoorLogs.length,
            active: indoorActive.length
          },
          outdoor: {
            total: outdoorLogs.length,
            active: outdoorActive.length
          }
        },
        active_members: activeLogs.map(log => ({
          id: log.member?.id || log.member_id,
          name: log.member_name || (log.member ? `${log.member.first_name} ${log.member.last_name}` : 'Unknown'),
          visit_type: log.visit_type,
          check_in_time: log.check_in_time,
          activities: log.activities || []
        }))
      };
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

  // Auto checkout disabled for MVP - just return empty result
  async autoCheckout() {
    console.log('Auto checkout disabled for MVP');
    return {
      total_processed: 0,
      successful: 0,
      failed: 0,
      results: []
    };
  },

  // Check for auto checkout - disabled for MVP
  async checkForAutoCheckout() {
    console.log('Auto checkout checking disabled for MVP');
    return [];
  },

  // Process auto checkout - disabled for MVP
  async processAutoCheckout(memberIds = []) {
    console.log('Auto checkout processing disabled for MVP');
    return {
      total_processed: 0,
      successful: 0,
      failed: 0
    };
  },

  // Get attendance logs with filtering - uses simplified API
  async getAttendanceLogs(filters = {}) {
    try {
      const params = {
        limit: 100
      };
      
      // Add filters to API params
      if (filters.searchTerm) {
        // Note: Backend doesn't support search yet, so we'll filter client-side
      }
      
      if (filters.visitType && filters.visitType !== 'all') {
        params.visit_type = filters.visitType;
      }
      
      if (filters.dateFilter === 'today') {
        params.date = new Date().toISOString().split('T')[0];
      }
      
      const response = await api.get(ATTENDANCE_API, { params });
      let logs = response.data.logs || [];
      
      // Apply client-side search filter if needed
      if (filters.searchTerm) {
        const searchTerm = filters.searchTerm.toLowerCase();
        logs = logs.filter(log => {
          const memberName = log.member_name || (log.member ? `${log.member.first_name} ${log.member.last_name}` : '');
          return memberName.toLowerCase().includes(searchTerm) ||
            (log.activities || []).some(activity => 
              activity.toLowerCase().includes(searchTerm)
            );
        });
      }

      return logs.map(log => this.formatAttendanceLog(log));
    } catch (error) {
      console.error('Failed to get attendance logs:', error);
      throw new Error('Failed to get attendance logs');
    }
  }
};

export default attendanceService;