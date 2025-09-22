import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Button from './Button';
import Modal from './Modal';
import Toast from './Toast';
import { paymentService } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentReminder = ({
  member,
  isOpen,
  onClose,
  onReminderSent,
  mode = 'reminder' // 'reminder' or 'invoice'
}) => {
  // Default message template
  const defaultMessage = useMemo(() => {
    if (!member) return '';
    const name = member.first_name || member.firstName || 'Member';
    const amount = member.amount || member.total_outstanding || 0;

    if (mode === 'invoice') {
      return `Dear ${name}, please find your membership invoice for ${formatCurrency(amount)}. Payment is due by ${formatDate(member.due_date || member.dueDate)}. Thank you!`;
    }

    return `Dear ${name}, your gym membership payment of ${formatCurrency(amount)} is due. Please make payment to M-Pesa paybill and notify admin with transaction code. Thank you!`;
  }, [member, mode]);

  const [reminderData, setReminderData] = useState({
    method: mode === 'invoice' ? 'email' : 'sms',
    message: '',
    urgency: 'normal',
    send_email: mode === 'invoice' ? true : false,
    generate_invoice: mode === 'invoice'
  });

  // Update message when member changes
  useEffect(() => {
    if (member && isOpen) {
      setReminderData(prev => ({
        ...prev,
        message: defaultMessage
      }));
    }
  }, [member, isOpen, defaultMessage]);

  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setReminderData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleSendReminder = useCallback(async () => {
    if (!member || !reminderData.message.trim()) return;

    setIsSending(true);

    try {
      const memberId = member.member_id || member.id;
      let response;

      if (mode === 'invoice') {
        // Send invoice
        response = await paymentService.sendInvoice(memberId, {
          send_email: reminderData.send_email,
          message: reminderData.message,
          urgency: reminderData.urgency
        });
        showToast('Invoice sent successfully!', 'success');
      } else {
        // Send reminder
        response = await paymentService.sendPaymentReminder(memberId, {
          ...reminderData,
          memberName: `${member.first_name || member.firstName} ${member.last_name || member.lastName}`,
          amount: member.amount || member.total_outstanding,
          dueDate: member.due_date || member.expiry_date || member.expiryDate
        });
        showToast('Payment reminder sent successfully!', 'success');
      }

      if (onReminderSent) {
        onReminderSent(response);
      }

      // Reset form and close modal
      setReminderData({
        method: mode === 'invoice' ? 'email' : 'sms',
        message: defaultMessage,
        urgency: 'normal',
        send_email: mode === 'invoice' ? true : false,
        generate_invoice: mode === 'invoice'
      });

      // Close modal after a short delay for user feedback
      setTimeout(() => {
        onClose();
      }, 1500);

    } catch (error) {
      showToast(error.message || 'Failed to send reminder', 'error');
    } finally {
      setIsSending(false);
    }
  }, [member, reminderData, onReminderSent, onClose, showToast, defaultMessage, mode]);

  const handlePreview = useCallback(async () => {
    if (!member || mode !== 'invoice') return;

    try {
      setIsSending(true);
      const memberId = member.member_id || member.id;
      const result = await paymentService.previewInvoice(memberId);

      if (result.success) {
        showToast('Invoice preview generated', 'success');
        // Here you could open a preview modal or window
      }
    } catch (error) {
      showToast(error.message || 'Failed to preview invoice', 'error');
    } finally {
      setIsSending(false);
    }
  }, [member, mode, showToast]);

  const handleDownload = useCallback(async () => {
    if (!member || mode !== 'invoice') return;

    try {
      setIsSending(true);
      const memberId = member.member_id || member.id;
      await paymentService.downloadInvoice(memberId);
      showToast('Invoice downloaded successfully', 'success');
    } catch (error) {
      showToast(error.message || 'Failed to download invoice', 'error');
    } finally {
      setIsSending(false);
    }
  }, [member, mode, showToast]);

  if (!member) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={mode === 'invoice' ? 'Send Invoice' : 'Send Payment Reminder'}
        size="medium"
      >
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Member Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{member.first_name || member.firstName} {member.last_name || member.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{member.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount Due:</span>
                <span className="ml-2 font-medium text-red-600">
                  {formatCurrency(member.amount || member.total_outstanding || 0)}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(member.due_date || member.expiry_date || member.expiryDate)}
                </span>
              </div>
            </div>
          </div>

          {/* Message Templates */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Templates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setReminderData(prev => ({ ...prev, message: defaultMessage }))}
                className="text-xs px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                Default Payment
              </button>
              <button
                type="button"
                onClick={() => setReminderData(prev => ({
                  ...prev,
                  message: `Urgent: Your membership expires soon. Please renew to avoid service interruption.`
                }))}
                className="text-xs px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                Urgent Renewal
              </button>
              <button
                type="button"
                onClick={() => setReminderData(prev => ({
                  ...prev,
                  message: `Final Notice: Your membership payment is overdue. Please settle immediately to avoid suspension.`
                }))}
                className="text-xs px-3 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 text-left"
              >
                Final Notice
              </button>
            </div>
          </div>

          {/* Method Options */}
          <div className="space-y-4">
            {mode === 'invoice' ? (
              <div>
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={reminderData.send_email}
                    onChange={(e) => setReminderData(prev => ({ ...prev, send_email: e.target.checked }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Send invoice via email
                  </span>
                  {member.email ? (
                    <span className="text-xs text-gray-500">({member.email})</span>
                  ) : (
                    <span className="text-xs text-red-500">(No email address)</span>
                  )}
                </label>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reminder Method
                </label>
                <select
                  name="method"
                  value={reminderData.method}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="both">SMS & Email</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                name="urgency"
                value={reminderData.urgency}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="normal">Normal</option>
                <option value="urgent">Urgent</option>
                <option value="final">Final Notice</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Message
              </label>
              <textarea
                name="message"
                value={reminderData.message}
                onChange={handleInputChange}
                rows={5}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reminder message..."
              />
              <div className="mt-1 text-xs text-gray-500">
                <strong>Admin Note:</strong> Remind members to save transaction code from M-Pesa confirmation SMS for payment confirmation.
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-xs text-gray-500">
                  Character count: {reminderData.message.length}
                </p>
                {reminderData.method === 'sms' && reminderData.message.length > 160 && (
                  <p className="text-xs text-red-500">
                    Message exceeds SMS limit (160 chars)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">Preview</h4>
            <div className="text-sm text-blue-800 bg-white rounded p-3 border">
              {reminderData.message}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between pt-4 border-t">
            {mode === 'invoice' && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handlePreview}
                  disabled={isSending}
                >
                  Preview
                </Button>
                <Button
                  variant="outline"
                  onClick={handleDownload}
                  disabled={isSending}
                >
                  Download
                </Button>
              </div>
            )}

            <div className={`flex space-x-4 ${mode !== 'invoice' ? 'w-full justify-end' : ''}`}>
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSending}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSendReminder}
                disabled={
                  isSending ||
                  !reminderData.message.trim() ||
                  (mode !== 'invoice' && reminderData.method === 'sms' && reminderData.message.length > 160) ||
                  (mode === 'invoice' && !reminderData.send_email && !member.email)
                }
              >
                {isSending ? 'Sending...' : (mode === 'invoice' ? 'Send Invoice' : 'Send Reminder')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Toast Notifications */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.show}
        onClose={hideToast}
      />
    </>
  );
};

export default PaymentReminder;