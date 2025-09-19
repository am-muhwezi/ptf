import React from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Toast from '../ui/Toast';
import { usePaymentForm } from '../../hooks/usePayments';
import { formatCurrency } from '../../utils/formatters';

const PaymentForm = ({ member, isOpen, onClose, onPaymentSuccess }) => {
  const {
    formData,
    errors,
    paymentStatus,
    isProcessing,
    handleInputChange,
    handlePaymentSubmission,
    resetPaymentStatus
  } = usePaymentForm(member, onPaymentSuccess);

  const [toast, setToast] = React.useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  // Show toast messages based on payment status
  React.useEffect(() => {
    if (paymentStatus === 'completed') {
      showToast('Payment recorded successfully!', 'success');
    } else if (paymentStatus === 'failed') {
      showToast('Failed to record payment. Please try again.', 'error');
    }
  }, [paymentStatus]);

  const handleClose = () => {
    resetPaymentStatus();
    onClose();
  };

  if (!member) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Record Payment Confirmation"
        size="medium"
      >
        <div className="space-y-6">
          {/* Member Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Member Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">
                  {member.first_name} {member.last_name}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Member ID:</span>
                <span className="ml-2 font-medium">{member.member_id || member.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="ml-2 font-medium">{member.plan_type || 'Indoor Daily'}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">{member.membership_type || 'indoor'}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'mpesa' } })}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    formData.paymentMethod === 'mpesa'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg font-medium">📱</div>
                  <div className="text-xs font-medium">M-Pesa</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'cash' } })}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    formData.paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg font-medium">💵</div>
                  <div className="text-xs font-medium">Cash</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange({ target: { name: 'paymentMethod', value: 'bank' } })}
                  className={`p-3 border-2 rounded-lg text-center transition-colors ${
                    formData.paymentMethod === 'bank'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <div className="text-lg font-medium">🏦</div>
                  <div className="text-xs font-medium">Bank</div>
                </button>
              </div>
            </div>

            {/* Amount and Date/Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount Paid
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.amount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  min="0"
                  step="100"
                />
                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
                <p className="text-xs text-gray-500 mt-1">{formatCurrency(formData.amount)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  name="paymentDate"
                  value={formData.paymentDate}
                  onChange={handleInputChange}
                  max={new Date().toISOString().split('T')[0]}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.paymentDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.paymentDate && <p className="text-red-500 text-xs mt-1">{errors.paymentDate}</p>}
              </div>
            </div>

            {/* Transaction Reference and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {formData.paymentMethod === 'mpesa' ? 'M-Pesa Transaction Code' :
                   formData.paymentMethod === 'bank' ? 'Bank Reference' : 'Receipt Number'}
                  {formData.paymentMethod === 'mpesa' && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  name="transactionReference"
                  value={formData.transactionReference}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.transactionReference ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder={formData.paymentMethod === 'mpesa' ? 'e.g., QJ12KL9M8N' :
                             formData.paymentMethod === 'bank' ? 'Bank transaction ref' : 'Receipt number'}
                />
                {errors.transactionReference && <p className="text-red-500 text-xs mt-1">{errors.transactionReference}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Time
                </label>
                <input
                  type="time"
                  name="paymentTime"
                  value={formData.paymentTime}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Description and Notes */}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Description
                </label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of payment"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes about this payment..."
                />
              </div>
            </div>
          </div>

          {/* Payment Status */}
          {(paymentStatus || isProcessing) && (
            <div className={`p-4 rounded-lg ${
              paymentStatus === 'completed' ? 'bg-green-50 border border-green-200' :
              paymentStatus === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {isProcessing && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                )}
                {paymentStatus === 'completed' && (
                  <svg className="h-5 w-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {paymentStatus === 'failed' && (
                  <svg className="h-5 w-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    paymentStatus === 'completed' ? 'text-green-800' :
                    paymentStatus === 'failed' ? 'text-red-800' :
                    'text-blue-800'
                  }`}>
                    {isProcessing && 'Recording payment...'}
                    {paymentStatus === 'completed' && 'Payment recorded successfully!'}
                    {paymentStatus === 'failed' && 'Failed to record payment. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              Cancel
            </Button>

            <Button
              variant="primary"
              onClick={handlePaymentSubmission}
              disabled={isProcessing || paymentStatus === 'completed'}
              className={formData.paymentMethod === 'cash' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}
            >
              {isProcessing ? 'Recording...' : `Record ${formData.paymentMethod === 'mpesa' ? 'M-Pesa' : formData.paymentMethod === 'bank' ? 'Bank' : 'Cash'} Payment`}
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

export default PaymentForm;