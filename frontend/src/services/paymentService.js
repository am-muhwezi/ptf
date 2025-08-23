import apiClient, { API_ENDPOINTS } from '../config/api';

export const paymentService = {
  // ================================
  // PAYMENT PROCESSING
  // ================================

  // Initiate M-Pesa payment
  initiateMpesaPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/mpesa/initiate/', {
        amount: paymentData.amount,
        phone_number: paymentData.phoneNumber,
        member_id: paymentData.memberId,
        membership_id: paymentData.membershipId,
        description: paymentData.description || 'Membership payment',
        account_reference: paymentData.accountReference || paymentData.memberId
      });
      return {
        success: true,
        data: response.data,
        transaction_id: response.data.transaction_id,
        checkout_request_id: response.data.checkout_request_id,
        message: response.data.message || 'Payment initiated successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to initiate M-Pesa payment');
    }
  },

  // Initiate card payment
  initiateCardPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/card/initiate/', {
        amount: paymentData.amount,
        currency: paymentData.currency || 'KES',
        member_id: paymentData.memberId,
        membership_id: paymentData.membershipId,
        description: paymentData.description,
        customer_email: paymentData.customerEmail,
        customer_name: paymentData.customerName,
        return_url: paymentData.returnUrl,
        webhook_url: paymentData.webhookUrl
      });
      return {
        success: true,
        data: response.data,
        payment_url: response.data.payment_url,
        transaction_id: response.data.transaction_id,
        message: response.data.message || 'Card payment initiated successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to initiate card payment');
    }
  },

  // Process payment (generic method)
  processPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/process/', {
        payment_method: paymentData.paymentMethod, // 'mpesa', 'card', 'bank_transfer', 'cash'
        amount: paymentData.amount,
        member_id: paymentData.memberId,
        membership_id: paymentData.membershipId,
        description: paymentData.description,
        metadata: paymentData.metadata || {},
        customer_info: {
          name: paymentData.customerName,
          email: paymentData.customerEmail,
          phone: paymentData.customerPhone
        }
      });
      return {
        success: true,
        data: response.data,
        payment_id: response.data.payment_id,
        transaction_id: response.data.transaction_id,
        status: response.data.status,
        message: response.data.message || 'Payment processed successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process payment');
    }
  },

  // Check payment status
  checkPaymentStatus: async (transactionId) => {
    try {
      const response = await apiClient.get(`/payments/status/${transactionId}/`);
      return {
        success: true,
        data: response.data,
        status: response.data.status,
        message: response.data.message
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to check payment status');
    }
  },

  // Verify payment
  verifyPayment: async (paymentId) => {
    try {
      const response = await apiClient.post(`/payments/verify/${paymentId}/`);
      return {
        success: true,
        data: response.data,
        verified: response.data.verified,
        status: response.data.status,
        message: response.data.message || 'Payment verification completed'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  },

  // Cancel payment
  cancelPayment: async (paymentId, reason) => {
    try {
      const response = await apiClient.post(`/payments/cancel/${paymentId}/`, {
        reason: reason || 'Cancelled by user'
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Payment cancelled successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to cancel payment');
    }
  },

  // Refund payment
  refundPayment: async (paymentId, refundData) => {
    try {
      const response = await apiClient.post(`/payments/refund/${paymentId}/`, {
        amount: refundData.amount,
        reason: refundData.reason,
        refund_method: refundData.method || 'original'
      });
      return {
        success: true,
        data: response.data,
        refund_id: response.data.refund_id,
        message: response.data.message || 'Refund processed successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to process refund');
    }
  },

  // ================================
  // PAYMENT MANAGEMENT
  // ================================

  // Get all payments with filtering
  getPayments: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.member_id) queryParams.append('member_id', params.member_id);
      if (params.status) queryParams.append('status', params.status);
      if (params.payment_method) queryParams.append('payment_method', params.payment_method);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.search) queryParams.append('search', params.search);

      const url = queryParams.toString() 
        ? `/payments/?${queryParams.toString()}`
        : '/payments/';

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count,
        next: response.data.next,
        previous: response.data.previous,
        total_revenue: response.data.total_revenue,
        total_pending: response.data.total_pending
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payments');
    }
  },

  // Get payment details
  getPayment: async (paymentId) => {
    try {
      const response = await apiClient.get(`/payments/${paymentId}/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment details');
    }
  },

  // Get payment history for a member
  getPaymentHistory: async (memberId, params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.limit) queryParams.append('limit', params.limit);
      if (params.status) queryParams.append('status', params.status);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);

      const url = queryParams.toString()
        ? `/payments/history/${memberId}/?${queryParams.toString()}`
        : `/payments/history/${memberId}/`;

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data,
        payments: response.data.payments,
        total_paid: response.data.total_paid,
        total_pending: response.data.total_pending,
        payment_count: response.data.payment_count
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment history');
    }
  },

  // Record manual payment
  recordManualPayment: async (paymentData) => {
    try {
      const response = await apiClient.post('/payments/manual/', {
        member_id: paymentData.memberId,
        membership_id: paymentData.membershipId,
        amount: paymentData.amount,
        payment_method: paymentData.paymentMethod || 'cash',
        reference_number: paymentData.referenceNumber,
        notes: paymentData.notes,
        payment_date: paymentData.paymentDate || new Date().toISOString(),
        recorded_by: paymentData.recordedBy
      });
      return {
        success: true,
        data: response.data,
        payment_id: response.data.payment_id,
        message: response.data.message || 'Manual payment recorded successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to record manual payment');
    }
  },

  // ================================
  // INVOICES AND RECEIPTS
  // ================================

  // Generate invoice
  generateInvoice: async (invoiceData) => {
    try {
      const response = await apiClient.post('/payments/invoices/generate/', {
        member_id: invoiceData.memberId,
        membership_id: invoiceData.membershipId,
        amount: invoiceData.amount,
        due_date: invoiceData.dueDate,
        description: invoiceData.description,
        items: invoiceData.items || [],
        notes: invoiceData.notes
      });
      return {
        success: true,
        data: response.data,
        invoice_id: response.data.invoice_id,
        invoice_number: response.data.invoice_number,
        invoice_url: response.data.invoice_url,
        message: response.data.message || 'Invoice generated successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate invoice');
    }
  },

  // Send invoice
  sendInvoice: async (invoiceId, emailData = {}) => {
    try {
      const response = await apiClient.post(`/payments/invoices/${invoiceId}/send/`, {
        email: emailData.email,
        subject: emailData.subject,
        message: emailData.message
      });
      return {
        success: true,
        message: response.data.message || 'Invoice sent successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send invoice');
    }
  },

  // Generate receipt
  generateReceipt: async (paymentId) => {
    try {
      const response = await apiClient.post('/payments/receipts/generate/', {
        payment_id: paymentId
      });
      return {
        success: true,
        data: response.data,
        receipt_id: response.data.receipt_id,
        receipt_number: response.data.receipt_number,
        receipt_url: response.data.receipt_url,
        message: response.data.message || 'Receipt generated successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to generate receipt');
    }
  },

  // Email receipt
  emailReceipt: async (receiptId, email) => {
    try {
      const response = await apiClient.post(`/payments/receipts/${receiptId}/email/`, {
        email: email
      });
      return {
        success: true,
        message: response.data.message || 'Receipt emailed successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to email receipt');
    }
  },

  // ================================
  // PAYMENT REMINDERS
  // ================================

  // Send payment reminder
  sendPaymentReminder: async (memberId, reminderData) => {
    try {
      const response = await apiClient.post(`/payments/reminder/${memberId}/`, {
        reminder_type: reminderData.type || 'overdue',
        message: reminderData.message,
        send_email: reminderData.sendEmail !== false,
        send_sms: reminderData.sendSms || false,
        schedule_date: reminderData.scheduleDate
      });
      return {
        success: true,
        data: response.data,
        message: response.data.message || 'Payment reminder sent successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send payment reminder');
    }
  },

  // Send bulk payment reminders
  sendBulkReminders: async (reminderData) => {
    try {
      const response = await apiClient.post('/payments/reminders/bulk/', {
        member_ids: reminderData.memberIds,
        reminder_type: reminderData.type || 'overdue',
        message: reminderData.message,
        send_email: reminderData.sendEmail !== false,
        send_sms: reminderData.sendSms || false
      });
      return {
        success: true,
        data: response.data,
        sent_count: response.data.sent_count,
        failed_count: response.data.failed_count,
        message: response.data.message || 'Bulk reminders sent successfully'
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send bulk reminders');
    }
  },

  // Get payment reminders
  getReminders: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.member_id) queryParams.append('member_id', params.member_id);
      if (params.status) queryParams.append('status', params.status);
      if (params.page) queryParams.append('page', params.page);
      if (params.limit) queryParams.append('limit', params.limit);

      const url = queryParams.toString()
        ? `/payments/reminders/?${queryParams.toString()}`
        : '/payments/reminders/';

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data.results || response.data,
        count: response.data.count
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch reminders');
    }
  },

  // ================================
  // ANALYTICS AND REPORTS
  // ================================

  // Get payment analytics
  getPaymentAnalytics: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);
      if (params.group_by) queryParams.append('group_by', params.group_by);

      const url = queryParams.toString()
        ? `/payments/analytics/?${queryParams.toString()}`
        : '/payments/analytics/';

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch payment analytics');
    }
  },

  // Get revenue reports
  getRevenueReport: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      if (params.period) queryParams.append('period', params.period);
      if (params.date_from) queryParams.append('date_from', params.date_from);
      if (params.date_to) queryParams.append('date_to', params.date_to);

      const url = queryParams.toString()
        ? `/payments/reports/revenue/?${queryParams.toString()}`
        : '/payments/reports/revenue/';

      const response = await apiClient.get(url);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch revenue report');
    }
  },

  // ================================
  // UTILITY METHODS
  // ================================

  // Format currency
  formatCurrency: (amount, currency = 'KES') => {
    return new Intl.NumberFormat('en-KE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(amount);
  },

  // Get payment status badge class
  getStatusBadgeClass: (status) => {
    const statusClasses = {
      'completed': 'bg-green-100 text-green-800',
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'failed': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'overdue': 'bg-red-100 text-red-800',
      'paid': 'bg-green-100 text-green-800'
    };
    return statusClasses[status] || 'bg-gray-100 text-gray-800';
  },

  // Get payment method display name
  getPaymentMethodName: (method) => {
    const methodNames = {
      'mpesa': 'M-Pesa',
      'card': 'Credit/Debit Card',
      'bank_transfer': 'Bank Transfer',
      'cash': 'Cash',
      'cheque': 'Cheque',
      'other': 'Other'
    };
    return methodNames[method] || method;
  },

  // Validate payment amount
  validatePaymentAmount: (amount, minAmount = 1, maxAmount = 1000000) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return { valid: false, message: 'Invalid amount format' };
    }
    if (numAmount < minAmount) {
      return { valid: false, message: `Amount must be at least ${minAmount}` };
    }
    if (numAmount > maxAmount) {
      return { valid: false, message: `Amount cannot exceed ${maxAmount}` };
    }
    return { valid: true };
  },

  // Validate phone number for M-Pesa
  validateMpesaPhone: (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\s+/g, '');
    const kenyanPhonePattern = /^(?:254|\+254|0)?([17]\d{8})$/;
    const match = cleanPhone.match(kenyanPhonePattern);
    
    if (!match) {
      return { valid: false, message: 'Invalid Kenyan phone number format' };
    }
    
    const normalizedPhone = `254${match[1]}`;
    return { valid: true, phone: normalizedPhone };
  }
};

export default paymentService;