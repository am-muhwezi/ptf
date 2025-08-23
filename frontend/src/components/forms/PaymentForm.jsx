import React, { useState } from 'react';
import Button from '../ui/Button';
import Modal from '../ui/Modal';
import Toast from '../ui/Toast';
import { paymentService } from '../../services/paymentService';
import { formatCurrency } from '../../utils/formatters';

const PaymentForm = ({ member, isOpen, onClose, onPaymentSuccess }) => {
  const [paymentData, setPaymentData] = useState({
    amount: member?.amount || 0,
    phoneNumber: member?.phone || '',
    paymentMethod: 'mpesa',
    description: `${member?.planType || 'Membership'} payment for ${member?.firstName} ${member?.lastName}`,
    membershipType: member?.membershipType || 'indoor',
    customerEmail: member?.email || '',
    customerName: `${member?.firstName} ${member?.lastName}` || '',
    referenceNumber: '',
    notes: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
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
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    // Validate amount
    const amountValidation = paymentService.validatePaymentAmount(paymentData.amount);
    if (!amountValidation.valid) {
      errors.amount = amountValidation.message;
    }
    
    // Validate phone number for M-Pesa
    if (paymentData.paymentMethod === 'mpesa') {
      const phoneValidation = paymentService.validateMpesaPhone(paymentData.phoneNumber);
      if (!phoneValidation.valid) {
        errors.phoneNumber = phoneValidation.message;
      }
    }
    
    // Validate email for card payments
    if (paymentData.paymentMethod === 'card' && !paymentData.customerEmail) {
      errors.customerEmail = 'Email is required for card payments';
    }
    
    // Validate reference number for manual payments (except cash which is auto-generated)
    if (['bank_transfer', 'cheque'].includes(paymentData.paymentMethod) && !paymentData.referenceNumber) {
      errors.referenceNumber = 'Reference number is required for manual payments';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
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

  const generateCashReference = () => {
    // Generate cash reference number: CASH-YYYYMMDD-HHMMSS-XXX
    const now = new Date();
    const date = now.getFullYear().toString() + 
                 (now.getMonth() + 1).toString().padStart(2, '0') + 
                 now.getDate().toString().padStart(2, '0');
    const time = now.getHours().toString().padStart(2, '0') + 
                 now.getMinutes().toString().padStart(2, '0') + 
                 now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    return `CASH-${date}-${time}-${random}`;
  };

  const handlePayment = async () => {
    if (!validateForm()) {
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('initiating');

    try {
      let response;
      
      switch (paymentData.paymentMethod) {
        case 'mpesa':
          response = await handleMpesaPayment();
          break;
        case 'card':
          response = await handleCardPayment();
          break;
        case 'cash':
        case 'bank_transfer':
        case 'cheque':
          response = await handleManualPayment();
          break;
        default:
          throw new Error('Invalid payment method');
      }

      if (response.success) {
        setTransactionId(response.transaction_id || response.payment_id);
        
        if (paymentData.paymentMethod === 'mpesa') {
          setPaymentStatus('pending');
          showToast('M-Pesa payment request sent. Please check your phone.', 'info');
          
          // Poll for payment status
          pollPaymentStatus(response.transaction_id);
        } else if (paymentData.paymentMethod === 'card') {
          if (response.payment_url) {
            setPaymentUrl(response.payment_url);
            setPaymentStatus('redirecting');
            showToast('Redirecting to payment gateway...', 'info');
            
            // Open payment URL in new window
            window.open(response.payment_url, '_blank');
          }
        } else {
          setPaymentStatus('completed');
          showToast(response.message || 'Payment recorded successfully!', 'success');
          
          if (onPaymentSuccess) {
            onPaymentSuccess(response);
          }
        }
      }
    } catch (error) {
      setPaymentStatus('failed');
      showToast(error.message, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMpesaPayment = async () => {
    const phoneValidation = paymentService.validateMpesaPhone(paymentData.phoneNumber);
    if (!phoneValidation.valid) {
      throw new Error(phoneValidation.message);
    }

    return await paymentService.initiateMpesaPayment({
      memberId: member.membershipId,
      membershipId: member.membershipId,
      amount: paymentData.amount,
      phoneNumber: phoneValidation.phone,
      description: paymentData.description,
      accountReference: member.id
    });
  };

  const handleCardPayment = async () => {
    return await paymentService.initiateCardPayment({
      memberId: member.membershipId,
      membershipId: member.membershipId,
      amount: paymentData.amount,
      currency: 'KES',
      description: paymentData.description,
      customerEmail: paymentData.customerEmail,
      customerName: paymentData.customerName,
      returnUrl: `${window.location.origin}/payments/callback`,
      webhookUrl: `${window.location.origin}/api/payments/webhook`
    });
  };

  const handleManualPayment = async () => {
    // Generate reference number for cash payments
    const referenceNumber = paymentData.paymentMethod === 'cash' 
      ? generateCashReference()
      : paymentData.referenceNumber;

    return await paymentService.recordManualPayment({
      memberId: member.membershipId,
      membershipId: member.membershipId,
      amount: paymentData.amount,
      paymentMethod: paymentData.paymentMethod,
      referenceNumber: referenceNumber,
      notes: paymentData.notes,
      description: paymentData.description,
      recordedBy: 'Admin' // TODO: Get from auth context
    });
  };

  const pollPaymentStatus = async (transactionId) => {
    const maxAttempts = 12; // 2 minutes with 10-second intervals
    let attempts = 0;

    const poll = async () => {
      try {
        attempts++;
        const statusResponse = await paymentService.checkPaymentStatus(transactionId);
        
        if (statusResponse.status === 'completed') {
          setPaymentStatus('completed');
          showToast('Payment completed successfully!', 'success');
          
          if (onPaymentSuccess) {
            onPaymentSuccess(statusResponse);
          }
          return;
        } else if (statusResponse.status === 'failed' || statusResponse.status === 'cancelled') {
          setPaymentStatus('failed');
          showToast('Payment failed or was cancelled.', 'error');
          return;
        }
        
        // Continue polling if pending and within max attempts
        if (attempts < maxAttempts && statusResponse.status === 'pending') {
          setTimeout(poll, 10000); // Poll every 10 seconds
        } else if (attempts >= maxAttempts) {
          setPaymentStatus('timeout');
          showToast('Payment verification timed out. Please check manually.', 'warning');
        }
      } catch (error) {
        if (attempts >= maxAttempts) {
          setPaymentStatus('failed');
          showToast('Payment verification failed.', 'error');
        } else {
          setTimeout(poll, 10000); // Retry on error
        }
      }
    };

    setTimeout(poll, 5000); // Start polling after 5 seconds
  };

  const getPaymentButtonText = () => {
    switch (paymentData.paymentMethod) {
      case 'mpesa':
        return '📱 Pay with M-Pesa';
      case 'card':
        return '💳 Pay with Card';
      case 'cash':
        return '💵 Record Cash Payment';
      case 'bank_transfer':
        return '🏦 Record Bank Transfer';
      case 'cheque':
        return '📄 Record Cheque Payment';
      default:
        return 'Process Payment';
    }
  };

  const resetForm = () => {
    setPaymentStatus(null);
    setTransactionId(null);
    setPaymentUrl(null);
    setValidationErrors({});
    setIsProcessing(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Update description when member data changes
  React.useEffect(() => {
    if (member) {
      setPaymentData(prev => ({
        ...prev,
        description: `${member.planType || 'Membership'} payment for ${member.firstName} ${member.lastName}`
      }));
    }
  }, [member]);

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
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{member.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Phone:</span>
                <span className="ml-2 font-medium">{member.phone}</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">Plan Details</div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-sm font-medium text-blue-900">{member.planType}</div>
                <div className="text-xs text-blue-700 mt-1">
                  {member.membershipType?.charAt(0)?.toUpperCase() + member.membershipType?.slice(1)} Membership
                </div>
                <div className="text-xs text-blue-700">Amount: KES {member.amount}</div>
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
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'mpesa' }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentData.paymentMethod === 'mpesa'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  📱 M-Pesa
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'card' }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentData.paymentMethod === 'card'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💳 Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'cash' }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentData.paymentMethod === 'cash'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  💵 Cash
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentData(prev => ({ ...prev, paymentMethod: 'bank_transfer' }))}
                  className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                    paymentData.paymentMethod === 'bank_transfer'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  🏦 Bank Transfer
                </button>
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount to Pay
              </label>
              <input
                type="number"
                name="amount"
                value={paymentData.amount}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  validationErrors.amount ? 'border-red-300' : 'border-gray-300'
                }`}
                min="1"
                step="1000"
              />
              {validationErrors.amount && (
                <p className="text-red-500 text-xs mt-1">{validationErrors.amount}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">{paymentService.formatCurrency(paymentData.amount)}</p>
            </div>

            {/* M-Pesa Phone Number */}
            {paymentData.paymentMethod === 'mpesa' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={paymentData.phoneNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0700123456"
                />
                {validationErrors.phoneNumber && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Enter the M-Pesa registered phone number</p>
              </div>
            )}

            {/* Email for Card Payments */}
            {paymentData.paymentMethod === 'card' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="customerEmail"
                  value={paymentData.customerEmail}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.customerEmail ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="member@email.com"
                />
                {validationErrors.customerEmail && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.customerEmail}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">Receipt will be sent to this email</p>
              </div>
            )}

            {/* Reference Number for Manual Payments (except cash) */}
            {['bank_transfer', 'cheque'].includes(paymentData.paymentMethod) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  name="referenceNumber"
                  value={paymentData.referenceNumber}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    validationErrors.referenceNumber ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder={`Enter ${paymentService.getPaymentMethodName(paymentData.paymentMethod)} reference`}
                />
                {validationErrors.referenceNumber && (
                  <p className="text-red-500 text-xs mt-1">{validationErrors.referenceNumber}</p>
                )}
              </div>
            )}

            {/* Auto-generated reference info for cash */}
            {paymentData.paymentMethod === 'cash' && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="text-sm text-green-800">
                  <strong>💵 Cash Payment</strong>
                  <p className="text-xs text-green-600 mt-1">Reference number will be automatically generated</p>
                </div>
              </div>
            )}

            {/* Notes for Cash Payments */}
            {paymentData.paymentMethod === 'cash' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={paymentData.notes}
                  onChange={handleInputChange}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes about this cash payment..."
                />
              </div>
            )}

            {/* Payment Description */}
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
              paymentStatus === 'timeout' ? 'bg-yellow-50 border border-yellow-200' :
              'bg-blue-50 border border-blue-200'
            }`}>
              <div className="flex items-center">
                {(paymentStatus === 'initiating' || paymentStatus === 'redirecting') && (
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
                {paymentStatus === 'timeout' && (
                  <svg className="h-5 w-5 text-yellow-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                <div>
                  <p className={`text-sm font-medium ${
                    paymentStatus === 'completed' ? 'text-green-800' :
                    paymentStatus === 'failed' ? 'text-red-800' :
                    paymentStatus === 'timeout' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {paymentStatus === 'initiating' && 'Initiating payment...'}
                    {paymentStatus === 'pending' && 'Waiting for payment confirmation...'}
                    {paymentStatus === 'redirecting' && 'Redirecting to payment gateway...'}
                    {paymentStatus === 'completed' && 'Payment completed successfully!'}
                    {paymentStatus === 'failed' && 'Payment failed. Please try again.'}
                    {paymentStatus === 'timeout' && 'Payment verification timed out. Check manually.'}
                  </p>
                  {transactionId && (
                    <p className="text-xs text-gray-600 mt-1">Transaction ID: {transactionId}</p>
                  )}
                  {paymentUrl && (
                    <p className="text-xs text-blue-600 mt-1">
                      <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="underline">
                        Open payment page in new tab
                      </a>
                    </p>
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
              variant="primary"
              onClick={handlePayment}
              disabled={isProcessing || paymentStatus === 'completed'}
              className={`${
                paymentData.paymentMethod === 'mpesa' ? 'bg-green-600 hover:bg-green-700' :
                paymentData.paymentMethod === 'card' ? 'bg-blue-600 hover:bg-blue-700' :
                'bg-gray-600 hover:bg-gray-700'
              }`}
            >
              {isProcessing ? 'Processing...' : getPaymentButtonText()}
            </Button>
            
            {paymentUrl && (
              <Button
                variant="outline"
                onClick={() => window.open(paymentUrl, '_blank')}
                className="text-blue-600 border-blue-600 hover:bg-blue-50"
              >
                Open Payment Page
              </Button>
            )}
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