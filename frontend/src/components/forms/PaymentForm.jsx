import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Toast from '../ui/Toast';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';

const PaymentForm = ({ member, isOpen, onClose, onPaymentSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    amount: member?.amount_due || member?.total_outstanding || 0,
    phoneNumber: member?.member_details?.phone || member?.phone || '',
    paymentMethod: 'mpesa',
    description: `Membership payment for ${member?.member_details?.firstName || member?.firstName} ${member?.member_details?.lastName || member?.lastName}`,
    membershipType: member?.plan_details?.membershipType || member?.membershipType || 'indoor'
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: '', type: 'success' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatPhoneNumber = (phone) => {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.substring(1);
    }
    
    // If it doesn't start with 254, add it
    if (!cleaned.startsWith('254')) {
      cleaned = '254' + cleaned;
    }
    
    return cleaned;
  };

  const handleMpesaPayment = async () => {
    setIsProcessing(true);
    setPaymentStatus('initiating');

    try {
      const formattedPhone = formatPhoneNumber(paymentData.phoneNumber);
      
      const mpesaData = {
        memberId: member.id,
        amount: paymentData.amount,
        phoneNumber: formattedPhone,
        description: paymentData.description,
        membershipType: paymentData.membershipType
      };

      // Simulate M-Pesa STK Push
      const response = await paymentService.initiateMpesaPayment(mpesaData);
      
      setTransactionId(response.transactionId);
      setPaymentStatus('pending');
      showToast('M-Pesa payment request sent to your phone. Please enter your PIN.', 'info');

      // Simulate checking payment status
      setTimeout(async () => {
        try {
          // Mock successful payment after 10 seconds
          const statusResponse = {
            status: 'completed',
            transactionId: response.transactionId,
            mpesaReceiptNumber: `QK${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
            amount: paymentData.amount,
            phoneNumber: formattedPhone,
            timestamp: new Date().toISOString()
          };

          setPaymentStatus('completed');
          showToast('Payment completed successfully!', 'success');
          
          if (onPaymentSuccess) {
            onPaymentSuccess(statusResponse);
          }
        } catch (error) {
          setPaymentStatus('failed');
          showToast('Payment failed. Please try again.', 'error');
        }
      }, 10000);

    } catch (error) {
      setPaymentStatus('failed');
      showToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualPayment = async () => {
    setIsProcessing(true);

    try {
      const manualPaymentData = {
        payment_method: 'cash',
        amount: paymentData.amount,
        description: paymentData.description,
        recorded_by: 'Admin' // In real app, get from auth context
      };

      // Use the new membership payment recording endpoint
      const response = await paymentService.recordMembershipPayment(member.id, manualPaymentData);
      
      setPaymentStatus('completed');
      showToast('Manual payment recorded successfully!', 'success');
      
      if (onPaymentSuccess) {
        onPaymentSuccess(response.payment);
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setPaymentStatus(null);
    setTransactionId(null);
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!member) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleClose}
        title="Process Payment"
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
                <span className="text-gray-600">Member ID:</span>
                <span className="ml-2 font-medium">{member.id}</span>
              </div>
              <div>
                <span className="text-gray-600">Plan:</span>
                <span className="ml-2 font-medium">{member.planType}</span>
              </div>
              <div>
                <span className="text-gray-600">Type:</span>
                <span className="ml-2 font-medium capitalize">{member.membershipType}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Pay
              </label>
              <input
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                step="1000"
              />
              <p className="text-sm text-gray-500 mt-1">{formatCurrency(paymentData.amount)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                M-Pesa Phone Number
              </label>
              <input
                type="tel"
                name="phoneNumber"
                value={paymentData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0700123456"
              />
              <p className="text-xs text-gray-500 mt-1">Enter the M-Pesa registered phone number</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payment Description
              </label>
              <textarea
                name="description"
                value={paymentData.description}
                onChange={handleInputChange}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Payment Status */}
          {paymentStatus && (
            <div className={`p-4 rounded-lg ${
              paymentStatus === 'completed' ? 'bg-green-50 border border-green-200' :
              paymentStatus === 'failed' ? 'bg-red-50 border border-red-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {paymentStatus === 'initiating' && (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
                )}
                {paymentStatus === 'pending' && (
                  <div className="animate-pulse h-5 w-5 bg-blue-500 rounded-full mr-3"></div>
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
                    {paymentStatus === 'initiating' && 'Initiating M-Pesa payment...'}
                    {paymentStatus === 'pending' && 'Waiting for payment confirmation...'}
                    {paymentStatus === 'completed' && 'Payment completed successfully!'}
                    {paymentStatus === 'failed' && 'Payment failed. Please try again.'}
                  </p>
                  {transactionId && (
                    <p className="text-xs text-gray-600 mt-1">Transaction ID: {transactionId}</p>
                  )}
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
              variant="outline"
              onClick={handleManualPayment}
              disabled={isProcessing || paymentStatus === 'completed'}
            >
              Record Cash Payment
            </Button>
            <Button
              variant="primary"
              onClick={handleMpesaPayment}
              disabled={isProcessing || !paymentData.phoneNumber || paymentStatus === 'completed'}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? 'Processing...' : 'Pay with M-Pesa'}
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