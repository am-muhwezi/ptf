try:
    import requests
except ImportError:
    requests = None

import base64
from datetime import datetime
from django.conf import settings
from ..models import Payment, MpesaTransaction


class MpesaService:
    """M-Pesa payment processing service"""
    
    def __init__(self):
        self.config = getattr(settings, 'PAYMENT_SETTINGS', {}).get('MPESA', {})
        self.consumer_key = self.config.get('CONSUMER_KEY')
        self.consumer_secret = self.config.get('CONSUMER_SECRET')
        self.business_short_code = self.config.get('BUSINESS_SHORT_CODE')
        self.passkey = self.config.get('PASSKEY')
        self.callback_url = self.config.get('CALLBACK_URL')
        self.environment = self.config.get('ENVIRONMENT', 'sandbox')
        
        # Set API URLs based on environment
        if self.environment == 'production':
            self.base_url = 'https://api.safaricom.co.ke'
        else:
            self.base_url = 'https://sandbox.safaricom.co.ke'
    
    def get_access_token(self):
        """Get M-Pesa access token"""
        if requests is None:
            return None, "requests library not installed"
        
        try:
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            
            # Encode credentials
            credentials = f"{self.consumer_key}:{self.consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            return data.get('access_token'), None
            
        except Exception as e:
            return None, str(e)
    
    def generate_password(self):
        """Generate M-Pesa password"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        data_to_encode = f"{self.business_short_code}{self.passkey}{timestamp}"
        encoded_string = base64.b64encode(data_to_encode.encode()).decode()
        return encoded_string, timestamp
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc, payment_id):
        """Initiate M-Pesa STK Push"""
        if requests is None:
            return False, "requests library not installed"
            
        try:
            # Get access token
            access_token, error = self.get_access_token()
            if error:
                return False, f"Failed to get access token: {error}"
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'TransactionType': 'CustomerPayBillOnline',
                'Amount': int(amount),
                'PartyA': phone_number,
                'PartyB': self.business_short_code,
                'PhoneNumber': phone_number,
                'CallBackURL': self.callback_url,
                'AccountReference': account_reference,
                'TransactionDesc': transaction_desc
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('ResponseCode') == '0':
                # Save M-Pesa transaction details
                mpesa_transaction = MpesaTransaction.objects.create(
                    payment_id=payment_id,
                    checkout_request_id=data.get('CheckoutRequestID'),
                    merchant_request_id=data.get('MerchantRequestID'),
                    phone_number=phone_number,
                    account_reference=account_reference,
                    transaction_desc=transaction_desc
                )
                
                return True, data
            else:
                return False, data.get('ResponseDescription', 'STK Push failed')
                
        except Exception as e:
            return False, str(e)
    
    def query_stk_status(self, checkout_request_id):
        """Query STK Push status"""
        if requests is None:
            return None, "requests library not installed"
            
        try:
            # Get access token
            access_token, error = self.get_access_token()
            if error:
                return None, f"Failed to get access token: {error}"
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                'BusinessShortCode': self.business_short_code,
                'Password': password,
                'Timestamp': timestamp,
                'CheckoutRequestID': checkout_request_id
            }
            
            response = requests.post(url, json=payload, headers=headers)
            response.raise_for_status()
            
            return response.json(), None
            
        except Exception as e:
            return None, str(e)
    
    def process_callback(self, callback_data):
        """Process M-Pesa callback"""
        try:
            checkout_request_id = callback_data.get('CheckoutRequestID')
            
            # Find the M-Pesa transaction
            mpesa_transaction = MpesaTransaction.objects.get(
                checkout_request_id=checkout_request_id
            )
            
            result_code = callback_data.get('ResultCode')
            
            if result_code == 0:
                # Payment successful
                callback_metadata = callback_data.get('CallbackMetadata', {}).get('Item', [])
                
                # Extract payment details
                mpesa_receipt_number = None
                transaction_date = None
                
                for item in callback_metadata:
                    if item.get('Name') == 'MpesaReceiptNumber':
                        mpesa_receipt_number = item.get('Value')
                    elif item.get('Name') == 'TransactionDate':
                        transaction_date = datetime.strptime(
                            str(item.get('Value')), '%Y%m%d%H%M%S'
                        )
                
                # Update M-Pesa transaction
                mpesa_transaction.mpesa_receipt_number = mpesa_receipt_number
                mpesa_transaction.transaction_date = transaction_date
                mpesa_transaction.save()
                
                # Update payment status
                payment = mpesa_transaction.payment
                payment.external_reference = mpesa_receipt_number
                payment.mark_completed()
                
                # Update membership payment status
                membership = payment.membership
                membership.payment_status = 'paid'
                membership.save()
                
                return True, "Payment processed successfully"
            else:
                # Payment failed
                result_desc = callback_data.get('ResultDesc', 'Payment failed')
                
                payment = mpesa_transaction.payment
                payment.mark_failed(result_desc)
                
                return False, result_desc
                
        except MpesaTransaction.DoesNotExist:
            return False, "M-Pesa transaction not found"
        except Exception as e:
            return False, str(e)