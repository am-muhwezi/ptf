import React, { useState } from 'react';
import Button from './Button';
import Modal from './Modal';
import Toast from './Toast';
import { paymentService } from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PaymentReminder = ({ member, isOpen, onClose, onReminderSent }) => {
  const [reminderData, setReminderData] = useState({
    method: 'sms',
    message: `Dear ${member?.firstName}, your gym membership payment of ${formatCurrency(member?.amount || 0)} is due. Please make payment to continue enjoying our services. Thank you!`,
    urgency: 'normal'
  });

  const [isSending, setIsSending] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setReminderData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSendReminder = async () => {
    setIsSending(true);

    try {
      const response = await paymentService.sendPaymentReminder(member.id, {
        ...reminderData,
        memberName: `${member.firstName} ${member.lastName}`,
        amount: member.amount,
        dueDate: member.expiryDate
      });

      showToast('Payment reminder sent successfully!', 'success');
      
      if (onReminderSent) {
        onReminderSent(response);
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  if (!member) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Send Payment Reminder"
        size="medium"
      >
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Member Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">{member.firstName} {member.lastName}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{member.phone}</span>
              </div>
              <div>
                <span className="text-gray-600">Amount Due:</span>
                <span className="ml-2 font-medium text-red-600">{formatCurrency(member.amount)}</span>
              </div>
              <div>
                <span className="text-gray-600">Due Date:</span>
                <span className="ml-2 font-medium">{formatDate(member.expiryDate)}</span>
              </div>
            </div>
          </div>

          {/* Reminder Options */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reminder Method
              </label>
              <select
                name="method"
                value={reminderData.method}
                onChange={(e) => setReminderData({...reminderData, method: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  'border-gray-300'
                }`}
              >
                <option value="sms">SMS</option>
                <option value="email">Email</option>
                <option value="both">SMS & Email</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Urgency Level
              </label>
              <select
                name="urgency"
                value={reminderData.urgency}
                onChange={(e) => setReminderData({...reminderData, [e.target.name]: e.target.value})}
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
                onChange={(e) => setReminderData({...reminderData, [e.target.name]: e.target.value})}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter reminder message..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Character count: {reminderData.message.length}/160 (SMS limit)
              </p>
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
          <div className="flex justify-end space-x-4 pt-4 border-t">
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
              disabled={isSending || !reminderData.message.trim()}
            >
              {isSending ? 'Sending...' : 'Send Reminder'}
            </Button>
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