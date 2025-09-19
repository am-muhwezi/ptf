import React from 'react';
import Button from './Button';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { useAuthContext } from '../../contexts/AuthContext';

const Receipt = ({ paymentData, member, onClose, onPrint }) => {
  const { user } = useAuthContext();
  const receiptNumber = paymentData?.mpesaReceiptNumber || paymentData?.receiptNumber || `PTF${Date.now()}`;

  const getAdminDisplayName = () => {
    if (!user) return 'Admin User';
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Admin User';
  };

  const handlePrint = () => {
    window.print();
    if (onPrint) onPrint();
  };

  return (
    <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg shadow-lg print:shadow-none print:border-none">
      {/* Header */}
      <div className="text-center p-6 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Tropical Fitness</h1>
        <p className="text-sm text-gray-600 mt-1">Olenguruone Ave, Nairobi</p>
        <p className="text-sm text-gray-600">Tel: +254 706 503 358</p>
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-900">PAYMENT RECEIPT</h2>
          <p className="text-sm text-gray-600">Receipt #: {receiptNumber}</p>
        </div>
      </div>

      {/* Receipt Details */}
      <div className="p-6 space-y-4">
        {/* Admin Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h3 className="font-semibold text-blue-900 text-sm mb-2">Processed By</h3>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Admin:</span>
              <span className="font-medium text-blue-900">{getAdminDisplayName()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Email:</span>
              <span className="font-medium text-blue-900">{user?.email || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Date:</span>
          <span className="font-medium">{formatDate(paymentData?.timestamp || new Date())}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Time:</span>
          <span className="font-medium">
            {new Date(paymentData?.timestamp || new Date()).toLocaleTimeString()}
          </span>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Member Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Name:</span>
              <span className="font-medium">
                {member?.first_name || member?.firstName} {member?.last_name || member?.lastName}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member ID:</span>
              <span className="font-medium">
                {member?.member_id || `PTF${String(member?.id || '0000').padStart(4, '0')}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Phone:</span>
              <span className="font-medium">{paymentData?.phoneNumber || member?.phone}</span>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-200 pt-4">
          <h3 className="font-semibold text-gray-900 mb-3">Payment Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Service:</span>
              <span className="font-medium">Gym Membership</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium">
                {member?.plan_type || member?.planType || 'Indoor Daily'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <span className="font-medium capitalize">
                {member?.membership_type || member?.membershipType || 'indoor'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-medium">
                {paymentData?.payment_method === 'mpesa' ? 'M-Pesa' :
                 paymentData?.payment_method === 'bank_transfer' ? 'Bank Transfer' :
                 paymentData?.payment_method === 'bank' ? 'Bank Transfer' :
                 paymentData?.payment_method_display || 'Cash'}
              </span>
            </div>
            {(paymentData?.payment_method === 'mpesa' || paymentData?.payment_method === 'bank_transfer' || paymentData?.payment_method === 'bank') && paymentData?.transaction_reference && (
              <div className="flex justify-between">
                <span className="text-gray-600">
                  {paymentData?.payment_method === 'mpesa' ? 'M-Pesa Code:' : 'Transaction Ref:'}
                </span>
                <span className="font-medium">{paymentData.transaction_reference}</span>
              </div>
            )}
            {paymentData?.mpesaReceiptNumber && (
              <div className="flex justify-between">
                <span className="text-gray-600">M-Pesa Code:</span>
                <span className="font-medium">{paymentData.mpesaReceiptNumber}</span>
              </div>
            )}
          </div>
        </div>

        {/* Amount */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">Total Amount:</span>
            <span className="text-xl font-bold text-green-600">
              {formatCurrency(paymentData?.amount || 0)}
            </span>
          </div>
        </div>

        {/* Status */}
        <div className="text-center">
          <span className="inline-block px-4 py-2 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            PAID
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-4 text-center text-xs text-gray-500">
          <p>Thank you for your payment!</p>
          <p className="mt-1">Keep this receipt for your records</p>
          <p className="mt-2">Generated on {formatDate(new Date())}</p>
        </div>
      </div>

      {/* Action Buttons - Hidden in print */}
      <div className="p-6 border-t border-gray-200 flex justify-between print:hidden">
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Print Receipt
        </Button>
      </div>
    </div>
  );
};

export default Receipt;