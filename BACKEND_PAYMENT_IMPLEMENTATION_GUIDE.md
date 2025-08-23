# 💳 Backend Payment System Implementation Guide
## Complete Step-by-Step Implementation for Django/Python

> **Current Status**: Frontend payment system exists but backend is MISSING. This guide creates the complete backend infrastructure.

---

## 🎯 What We're Building

**Complete Payment Infrastructure:**
- 💰 M-Pesa integration (Kenya's mobile money)
- 💳 Credit/Debit card processing  
- 🧾 Invoice and receipt generation
- 📊 Payment analytics and reporting
- 🔔 Automated payment reminders
- 📱 Webhook handling for real-time updates

---

## 🏗️ PART 1: Backend Setup and Architecture

### Step 1: Create Payment App Structure

#### A. Create Django Payment App
```bash
# Navigate to backend directory
cd /home/yahwehsdelight/ptf/backend

# Create payment app
python manage.py startapp payments

# Create additional directories
mkdir payments/services
mkdir payments/utils
mkdir payments/webhooks
mkdir payments/tests
mkdir payments/migrations/data
```

#### B. Update Django Settings
**Edit `ptf/settings.py`:**
```python
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'drf_yasg',
    # Existing apps
    'accounts',
    'members',
    'memberships',
    'bookings',
    'attendance',
    'dashboard',
    # New payment app
    'payments',  # 👈 ADD THIS
]

# Payment-specific settings
PAYMENT_SETTINGS = {
    # M-Pesa Configuration
    'MPESA': {
        'ENVIRONMENT': 'sandbox',  # 'sandbox' or 'production'
        'CONSUMER_KEY': os.getenv('MPESA_CONSUMER_KEY'),
        'CONSUMER_SECRET': os.getenv('MPESA_CONSUMER_SECRET'),
        'BUSINESS_SHORT_CODE': os.getenv('MPESA_SHORT_CODE', '174379'),
        'PASSKEY': os.getenv('MPESA_PASSKEY'),
        'CALLBACK_URL': os.getenv('MPESA_CALLBACK_URL', 'https://your-domain.com/api/payments/mpesa/callback/'),
    },
    
    # Card Payment Gateway (Flutterwave example)
    'FLUTTERWAVE': {
        'PUBLIC_KEY': os.getenv('FLUTTERWAVE_PUBLIC_KEY'),
        'SECRET_KEY': os.getenv('FLUTTERWAVE_SECRET_KEY'),
        'ENVIRONMENT': 'sandbox',  # 'sandbox' or 'production'
    },
    
    # General Payment Settings
    'DEFAULT_CURRENCY': 'KES',
    'PAYMENT_TIMEOUT_MINUTES': 10,
    'AUTO_REMINDER_DAYS': [7, 3, 1],  # Days before expiry to send reminders
    'RECEIPT_FROM_EMAIL': 'noreply@paulstropicalfitness.fit',
}

# Celery for background tasks (payment processing)
CELERY_BROKER_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Nairobi'
```

#### C. Install Required Packages
```bash
# Payment processing packages
pip install celery redis
pip install requests
pip install python-decouple
pip install reportlab  # For PDF generation
pip install Pillow     # For image processing
pip install django-extensions

# Add to requirements.txt
echo "celery==5.3.1" >> requirements.txt
echo "redis==4.6.0" >> requirements.txt
echo "requests==2.31.0" >> requirements.txt
echo "python-decouple==3.8" >> requirements.txt
echo "reportlab==4.0.4" >> requirements.txt
echo "Pillow==10.0.0" >> requirements.txt
echo "django-extensions==3.2.3" >> requirements.txt
```

### Step 2: Create Database Models

**Create `payments/models.py`:**
```python
from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
import uuid

class PaymentMethod(models.TextChoices):
    MPESA = 'mpesa', 'M-Pesa'
    CARD = 'card', 'Credit/Debit Card'
    CASH = 'cash', 'Cash'
    BANK_TRANSFER = 'bank_transfer', 'Bank Transfer'
    CHEQUE = 'cheque', 'Cheque'

class PaymentStatus(models.TextChoices):
    PENDING = 'pending', 'Pending'
    PROCESSING = 'processing', 'Processing'
    COMPLETED = 'completed', 'Completed'
    FAILED = 'failed', 'Failed'
    CANCELLED = 'cancelled', 'Cancelled'
    REFUNDED = 'refunded', 'Refunded'

class Payment(models.Model):
    """Core payment record"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE, related_name='payments')
    membership = models.ForeignKey('memberships.Membership', on_delete=models.CASCADE, related_name='payments', null=True, blank=True)
    
    # Payment Details
    amount = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=3, default='KES')
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices)
    
    # Status and Tracking
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    transaction_id = models.CharField(max_length=100, unique=True, null=True, blank=True)
    external_transaction_id = models.CharField(max_length=100, null=True, blank=True)  # From M-Pesa/Card gateway
    
    # Payment Gateway Data
    gateway_response = models.JSONField(default=dict, blank=True)
    
    # Description and Reference
    description = models.TextField()
    reference_number = models.CharField(max_length=100, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    
    # Staff tracking
    recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['member', 'status']),
            models.Index(fields=['status', 'created_at']),
            models.Index(fields=['payment_method', 'status']),
        ]
    
    def __str__(self):
        return f"Payment {self.transaction_id} - {self.amount} {self.currency}"
    
    @property
    def is_successful(self):
        return self.status == PaymentStatus.COMPLETED
    
    @property
    def is_pending(self):
        return self.status in [PaymentStatus.PENDING, PaymentStatus.PROCESSING]

class MpesaPayment(models.Model):
    """M-Pesa specific payment data"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='mpesa_data')
    
    # M-Pesa Request Data
    checkout_request_id = models.CharField(max_length=100)
    phone_number = models.CharField(max_length=15)
    account_reference = models.CharField(max_length=50)
    
    # M-Pesa Response Data
    mpesa_receipt_number = models.CharField(max_length=20, null=True, blank=True)
    transaction_date = models.DateTimeField(null=True, blank=True)
    
    # STK Push Data
    merchant_request_id = models.CharField(max_length=100, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"M-Pesa {self.checkout_request_id}"

class CardPayment(models.Model):
    """Card payment specific data"""
    payment = models.OneToOneField(Payment, on_delete=models.CASCADE, related_name='card_data')
    
    # Card Details (encrypted/tokenized)
    card_last_four = models.CharField(max_length=4, null=True, blank=True)
    card_brand = models.CharField(max_length=20, null=True, blank=True)  # Visa, Mastercard, etc.
    
    # Gateway Data
    gateway_reference = models.CharField(max_length=100)
    gateway_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    
    # Customer Data
    customer_email = models.EmailField()
    customer_name = models.CharField(max_length=100)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Card Payment {self.gateway_reference}"

class Invoice(models.Model):
    """Payment invoices"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE, related_name='invoices')
    membership = models.ForeignKey('memberships.Membership', on_delete=models.CASCADE, related_name='invoices', null=True, blank=True)
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True, related_name='invoices')
    
    # Invoice Details
    invoice_number = models.CharField(max_length=20, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Dates
    issue_date = models.DateField(auto_now_add=True)
    due_date = models.DateField()
    paid_date = models.DateField(null=True, blank=True)
    
    # Content
    description = models.TextField()
    items = models.JSONField(default=list)  # List of invoice items
    notes = models.TextField(null=True, blank=True)
    
    # Status
    is_paid = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # File
    pdf_file = models.FileField(upload_to='invoices/', null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Invoice {self.invoice_number}"
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generate invoice number: INV-2024-001
            year = timezone.now().year
            count = Invoice.objects.filter(created_at__year=year).count() + 1
            self.invoice_number = f"INV-{year}-{count:03d}"
        super().save(*args, **kwargs)

class Receipt(models.Model):
    """Payment receipts"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Relationships
    payment = models.ForeignKey(Payment, on_delete=models.CASCADE, related_name='receipts')
    
    # Receipt Details
    receipt_number = models.CharField(max_length=20, unique=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='KES')
    
    # Content
    description = models.TextField()
    items = models.JSONField(default=list)
    
    # File
    pdf_file = models.FileField(upload_to='receipts/', null=True, blank=True)
    
    # Email tracking
    is_emailed = models.BooleanField(default=False)
    emailed_at = models.DateTimeField(null=True, blank=True)
    email_address = models.EmailField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Receipt {self.receipt_number}"
    
    def save(self, *args, **kwargs):
        if not self.receipt_number:
            # Generate receipt number: RCP-2024-001
            year = timezone.now().year
            count = Receipt.objects.filter(created_at__year=year).count() + 1
            self.receipt_number = f"RCP-{year}-{count:03d}"
        super().save(*args, **kwargs)

class PaymentReminder(models.Model):
    """Payment reminder tracking"""
    REMINDER_TYPES = [
        ('due_soon', 'Due Soon'),
        ('overdue', 'Overdue'),
        ('final_notice', 'Final Notice'),
    ]
    
    member = models.ForeignKey('members.Member', on_delete=models.CASCADE, related_name='payment_reminders')
    membership = models.ForeignKey('memberships.Membership', on_delete=models.CASCADE, related_name='payment_reminders')
    
    reminder_type = models.CharField(max_length=20, choices=REMINDER_TYPES)
    message = models.TextField()
    
    # Delivery tracking
    sent_email = models.BooleanField(default=False)
    sent_sms = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Response tracking
    opened_email = models.BooleanField(default=False)
    clicked_link = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        unique_together = ['member', 'membership', 'reminder_type', 'sent_at']
    
    def __str__(self):
        return f"Reminder {self.reminder_type} for {self.member.name}"

class PaymentWebhook(models.Model):
    """Webhook events from payment gateways"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Source
    gateway = models.CharField(max_length=20)  # 'mpesa', 'flutterwave', etc.
    event_type = models.CharField(max_length=50)
    
    # Data
    raw_data = models.JSONField()
    processed_data = models.JSONField(default=dict)
    
    # Processing status
    is_processed = models.BooleanField(default=False)
    processed_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(null=True, blank=True)
    
    # Related payment
    payment = models.ForeignKey(Payment, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['gateway', 'event_type']),
            models.Index(fields=['is_processed', 'created_at']),
        ]
    
    def __str__(self):
        return f"{self.gateway} webhook - {self.event_type}"
```

### Step 3: Create Database Migrations

```bash
# Create migrations
python manage.py makemigrations payments

# Apply migrations
python manage.py migrate payments

# Create superuser if not exists
python manage.py createsuperuser
```

---

## 💻 PART 2: Payment Services Implementation

### Step 4: M-Pesa Integration Service

**Create `payments/services/mpesa_service.py`:**
```python
import base64
import json
import requests
from datetime import datetime
from django.conf import settings
from django.utils import timezone
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

class MpesaService:
    def __init__(self):
        self.mpesa_config = settings.PAYMENT_SETTINGS['MPESA']
        self.base_url = self._get_base_url()
        self.access_token = None
    
    def _get_base_url(self):
        if self.mpesa_config['ENVIRONMENT'] == 'production':
            return 'https://api.safaricom.co.ke'
        return 'https://sandbox.safaricom.co.ke'
    
    def get_access_token(self):
        """Get OAuth access token from M-Pesa API"""
        try:
            url = f"{self.base_url}/oauth/v1/generate?grant_type=client_credentials"
            
            # Create basic auth header
            consumer_key = self.mpesa_config['CONSUMER_KEY']
            consumer_secret = self.mpesa_config['CONSUMER_SECRET']
            credentials = f"{consumer_key}:{consumer_secret}"
            encoded_credentials = base64.b64encode(credentials.encode()).decode()
            
            headers = {
                'Authorization': f'Basic {encoded_credentials}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            self.access_token = data.get('access_token')
            
            logger.info("M-Pesa access token obtained successfully")
            return self.access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get M-Pesa access token: {str(e)}")
            raise Exception(f"M-Pesa authentication failed: {str(e)}")
    
    def generate_password(self):
        """Generate M-Pesa STK Push password"""
        business_short_code = self.mpesa_config['BUSINESS_SHORT_CODE']
        passkey = self.mpesa_config['PASSKEY']
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        password_string = f"{business_short_code}{passkey}{timestamp}"
        encoded_password = base64.b64encode(password_string.encode()).decode()
        
        return encoded_password, timestamp
    
    def initiate_stk_push(self, phone_number, amount, account_reference, transaction_desc):
        """Initiate M-Pesa STK Push payment"""
        try:
            # Ensure we have access token
            if not self.access_token:
                self.get_access_token()
            
            # Generate password and timestamp
            password, timestamp = self.generate_password()
            
            # Format phone number (ensure starts with 254)
            if phone_number.startswith('0'):
                phone_number = '254' + phone_number[1:]
            elif phone_number.startswith('+254'):
                phone_number = phone_number[1:]
            elif not phone_number.startswith('254'):
                phone_number = '254' + phone_number
            
            url = f"{self.base_url}/mpesa/stkpush/v1/processrequest"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "BusinessShortCode": self.mpesa_config['BUSINESS_SHORT_CODE'],
                "Password": password,
                "Timestamp": timestamp,
                "TransactionType": "CustomerPayBillOnline",
                "Amount": str(int(amount)),  # M-Pesa expects integer
                "PartyA": phone_number,
                "PartyB": self.mpesa_config['BUSINESS_SHORT_CODE'],
                "PhoneNumber": phone_number,
                "CallBackURL": self.mpesa_config['CALLBACK_URL'],
                "AccountReference": account_reference,
                "TransactionDesc": transaction_desc
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('ResponseCode') == '0':
                logger.info(f"STK Push initiated successfully for {phone_number}")
                return {
                    'success': True,
                    'checkout_request_id': data.get('CheckoutRequestID'),
                    'merchant_request_id': data.get('MerchantRequestID'),
                    'response_code': data.get('ResponseCode'),
                    'response_description': data.get('ResponseDescription'),
                    'customer_message': data.get('CustomerMessage')
                }
            else:
                logger.error(f"STK Push failed: {data}")
                return {
                    'success': False,
                    'error': data.get('ResponseDescription', 'Unknown error'),
                    'response_code': data.get('ResponseCode')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"STK Push request failed: {str(e)}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"STK Push unexpected error: {str(e)}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def query_stk_status(self, checkout_request_id):
        """Query the status of an STK Push transaction"""
        try:
            if not self.access_token:
                self.get_access_token()
            
            password, timestamp = self.generate_password()
            
            url = f"{self.base_url}/mpesa/stkpushquery/v1/query"
            
            headers = {
                'Authorization': f'Bearer {self.access_token}',
                'Content-Type': 'application/json'
            }
            
            payload = {
                "BusinessShortCode": self.mpesa_config['BUSINESS_SHORT_CODE'],
                "Password": password,
                "Timestamp": timestamp,
                "CheckoutRequestID": checkout_request_id
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            logger.info(f"STK status query result: {data}")
            return {
                'success': True,
                'data': data
            }
            
        except requests.exceptions.RequestException as e:
            logger.error(f"STK status query failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
mpesa_service = MpesaService()
```

### Step 5: Card Payment Service

**Create `payments/services/card_service.py`:**
```python
import requests
import json
from django.conf import settings
from decimal import Decimal
import logging
import uuid

logger = logging.getLogger(__name__)

class FlutterwaveService:
    """Flutterwave payment gateway integration"""
    
    def __init__(self):
        self.config = settings.PAYMENT_SETTINGS['FLUTTERWAVE']
        self.base_url = self._get_base_url()
    
    def _get_base_url(self):
        if self.config['ENVIRONMENT'] == 'production':
            return 'https://api.flutterwave.com/v3'
        return 'https://api.flutterwave.com/v3'  # Same for both
    
    def initiate_card_payment(self, amount, currency, customer_email, customer_name, 
                            redirect_url, payment_reference, description):
        """Initiate card payment with Flutterwave"""
        try:
            url = f"{self.base_url}/payments"
            
            headers = {
                'Authorization': f"Bearer {self.config['SECRET_KEY']}",
                'Content-Type': 'application/json'
            }
            
            payload = {
                "tx_ref": payment_reference,
                "amount": str(amount),
                "currency": currency,
                "redirect_url": redirect_url,
                "customer": {
                    "email": customer_email,
                    "name": customer_name
                },
                "customizations": {
                    "title": "Paul's Tropical Fitness",
                    "description": description,
                    "logo": "https://your-domain.com/logo.png"
                }
            }
            
            response = requests.post(url, headers=headers, json=payload)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 'success':
                logger.info(f"Card payment initiated successfully for {customer_email}")
                return {
                    'success': True,
                    'payment_link': data['data']['link'],
                    'transaction_id': data['data']['id'],
                    'reference': payment_reference
                }
            else:
                logger.error(f"Card payment initiation failed: {data}")
                return {
                    'success': False,
                    'error': data.get('message', 'Payment initiation failed')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Card payment request failed: {str(e)}")
            return {
                'success': False,
                'error': f'Network error: {str(e)}'
            }
        except Exception as e:
            logger.error(f"Card payment unexpected error: {str(e)}")
            return {
                'success': False,
                'error': f'Unexpected error: {str(e)}'
            }
    
    def verify_payment(self, transaction_id):
        """Verify a payment transaction"""
        try:
            url = f"{self.base_url}/transactions/{transaction_id}/verify"
            
            headers = {
                'Authorization': f"Bearer {self.config['SECRET_KEY']}",
                'Content-Type': 'application/json'
            }
            
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get('status') == 'success':
                payment_data = data['data']
                return {
                    'success': True,
                    'status': payment_data.get('status'),
                    'amount': payment_data.get('amount'),
                    'currency': payment_data.get('currency'),
                    'reference': payment_data.get('tx_ref'),
                    'customer': payment_data.get('customer'),
                    'card': payment_data.get('card'),
                    'transaction_data': payment_data
                }
            else:
                return {
                    'success': False,
                    'error': data.get('message', 'Verification failed')
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Payment verification failed: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }

# Global instance
card_service = FlutterwaveService()
```

### Step 6: Payment Processing Service

**Create `payments/services/payment_service.py`:**
```python
from django.db import transaction
from django.utils import timezone
from decimal import Decimal
from ..models import Payment, PaymentStatus, MpesaPayment, CardPayment
from .mpesa_service import mpesa_service
from .card_service import card_service
import uuid
import logging

logger = logging.getLogger(__name__)

class PaymentService:
    """Main payment processing service"""
    
    @transaction.atomic
    def create_payment(self, member, membership, amount, payment_method, description, **kwargs):
        """Create a new payment record"""
        payment = Payment.objects.create(
            member=member,
            membership=membership,
            amount=Decimal(str(amount)),
            payment_method=payment_method,
            description=description,
            transaction_id=str(uuid.uuid4()),
            recorded_by=kwargs.get('recorded_by'),
            reference_number=kwargs.get('reference_number'),
            notes=kwargs.get('notes')
        )
        
        logger.info(f"Payment created: {payment.transaction_id} for member {member.id}")
        return payment
    
    def process_mpesa_payment(self, payment, phone_number, account_reference=None):
        """Process M-Pesa payment"""
        try:
            if account_reference is None:
                account_reference = payment.member.member_id or str(payment.member.id)
            
            # Initiate STK push
            result = mpesa_service.initiate_stk_push(
                phone_number=phone_number,
                amount=payment.amount,
                account_reference=account_reference,
                transaction_desc=payment.description
            )
            
            if result['success']:
                # Create M-Pesa payment record
                mpesa_payment = MpesaPayment.objects.create(
                    payment=payment,
                    checkout_request_id=result['checkout_request_id'],
                    phone_number=phone_number,
                    account_reference=account_reference,
                    merchant_request_id=result['merchant_request_id']
                )
                
                # Update payment status
                payment.status = PaymentStatus.PROCESSING
                payment.gateway_response = result
                payment.save()
                
                logger.info(f"M-Pesa payment initiated: {payment.transaction_id}")
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'transaction_id': payment.transaction_id,
                    'checkout_request_id': result['checkout_request_id'],
                    'message': result.get('customer_message', 'Payment request sent to your phone')
                }
            else:
                payment.status = PaymentStatus.FAILED
                payment.gateway_response = result
                payment.save()
                
                return {
                    'success': False,
                    'error': result.get('error', 'M-Pesa payment failed')
                }
                
        except Exception as e:
            logger.error(f"M-Pesa payment processing error: {str(e)}")
            payment.status = PaymentStatus.FAILED
            payment.save()
            
            return {
                'success': False,
                'error': f'Payment processing error: {str(e)}'
            }
    
    def process_card_payment(self, payment, customer_email, customer_name, redirect_url):
        """Process card payment"""
        try:
            result = card_service.initiate_card_payment(
                amount=payment.amount,
                currency='KES',
                customer_email=customer_email,
                customer_name=customer_name,
                redirect_url=redirect_url,
                payment_reference=payment.transaction_id,
                description=payment.description
            )
            
            if result['success']:
                # Create card payment record
                card_payment = CardPayment.objects.create(
                    payment=payment,
                    gateway_reference=result['transaction_id'],
                    customer_email=customer_email,
                    customer_name=customer_name
                )
                
                # Update payment status
                payment.status = PaymentStatus.PROCESSING
                payment.external_transaction_id = result['transaction_id']
                payment.gateway_response = result
                payment.save()
                
                logger.info(f"Card payment initiated: {payment.transaction_id}")
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'transaction_id': payment.transaction_id,
                    'payment_url': result['payment_link'],
                    'message': 'Redirecting to payment gateway'
                }
            else:
                payment.status = PaymentStatus.FAILED
                payment.gateway_response = result
                payment.save()
                
                return {
                    'success': False,
                    'error': result.get('error', 'Card payment initiation failed')
                }
                
        except Exception as e:
            logger.error(f"Card payment processing error: {str(e)}")
            payment.status = PaymentStatus.FAILED
            payment.save()
            
            return {
                'success': False,
                'error': f'Payment processing error: {str(e)}'
            }
    
    def record_manual_payment(self, payment, recorded_by):
        """Record manual payment (cash, bank transfer, etc.)"""
        try:
            with transaction.atomic():
                payment.status = PaymentStatus.COMPLETED
                payment.paid_at = timezone.now()
                payment.recorded_by = recorded_by
                payment.save()
                
                # Update membership if applicable
                if payment.membership:
                    self._update_membership_after_payment(payment)
                
                logger.info(f"Manual payment recorded: {payment.transaction_id}")
                
                return {
                    'success': True,
                    'payment_id': str(payment.id),
                    'message': 'Payment recorded successfully'
                }
                
        except Exception as e:
            logger.error(f"Manual payment recording error: {str(e)}")
            return {
                'success': False,
                'error': f'Failed to record payment: {str(e)}'
            }
    
    def verify_payment(self, payment):
        """Verify payment status"""
        try:
            if payment.payment_method == 'mpesa' and hasattr(payment, 'mpesa_data'):
                # Query M-Pesa status
                mpesa_data = payment.mpesa_data
                result = mpesa_service.query_stk_status(mpesa_data.checkout_request_id)
                
                if result['success']:
                    status_data = result['data']
                    if status_data.get('ResultCode') == '0':
                        # Payment successful
                        self._complete_payment(payment, status_data)
                        return {'success': True, 'status': 'completed'}
                    elif status_data.get('ResultCode') in ['1032', '1037']:
                        # Payment cancelled by user
                        payment.status = PaymentStatus.CANCELLED
                        payment.save()
                        return {'success': True, 'status': 'cancelled'}
                    else:
                        # Payment failed
                        payment.status = PaymentStatus.FAILED
                        payment.save()
                        return {'success': True, 'status': 'failed'}
                
            elif payment.payment_method == 'card' and payment.external_transaction_id:
                # Verify card payment
                result = card_service.verify_payment(payment.external_transaction_id)
                
                if result['success']:
                    if result['status'] == 'successful':
                        self._complete_payment(payment, result['transaction_data'])
                        return {'success': True, 'status': 'completed'}
                    else:
                        payment.status = PaymentStatus.FAILED
                        payment.save()
                        return {'success': True, 'status': 'failed'}
            
            return {'success': False, 'error': 'Unable to verify payment'}
            
        except Exception as e:
            logger.error(f"Payment verification error: {str(e)}")
            return {'success': False, 'error': str(e)}
    
    def _complete_payment(self, payment, gateway_data):
        """Complete a successful payment"""
        with transaction.atomic():
            payment.status = PaymentStatus.COMPLETED
            payment.paid_at = timezone.now()
            payment.gateway_response.update(gateway_data)
            payment.save()
            
            # Update M-Pesa specific data
            if payment.payment_method == 'mpesa' and hasattr(payment, 'mpesa_data'):
                mpesa_payment = payment.mpesa_data
                if 'CallbackMetadata' in gateway_data:
                    callback_data = gateway_data['CallbackMetadata']['Item']
                    for item in callback_data:
                        if item['Name'] == 'MpesaReceiptNumber':
                            mpesa_payment.mpesa_receipt_number = item['Value']
                        elif item['Name'] == 'TransactionDate':
                            # Convert M-Pesa timestamp to datetime
                            mpesa_payment.transaction_date = timezone.now()
                    mpesa_payment.save()
            
            # Update membership if applicable
            if payment.membership:
                self._update_membership_after_payment(payment)
            
            logger.info(f"Payment completed: {payment.transaction_id}")
    
    def _update_membership_after_payment(self, payment):
        """Update membership status after successful payment"""
        membership = payment.membership
        if membership:
            membership.payment_status = 'paid'
            membership.status = 'active'
            membership.save()
            
            logger.info(f"Membership updated after payment: {membership.id}")

# Global instance
payment_service = PaymentService()
```

---

## 🔌 PART 3: API Endpoints Implementation

### Step 7: Create Payment Views

**Create `payments/views.py`:**
```python
from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.pagination import PageNumberPagination
from django.shortcuts import get_object_or_404
from django.db.models import Q, Sum, Count
from django.utils import timezone
from django.http import HttpResponse
from datetime import datetime, timedelta

from .models import Payment, Invoice, Receipt, PaymentReminder
from .serializers import PaymentSerializer, InvoiceSerializer, ReceiptSerializer
from .services.payment_service import payment_service
from members.models import Member
from memberships.models import Membership

import json
import logging

logger = logging.getLogger(__name__)

class PaymentPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'limit'
    max_page_size = 100

# ================================
# PAYMENT PROCESSING ENDPOINTS
# ================================

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def process_payment(request):
    """Process a new payment"""
    try:
        data = request.data
        
        # Validate required fields
        required_fields = ['member_id', 'amount', 'payment_method', 'description']
        for field in required_fields:
            if field not in data:
                return Response(
                    {'error': f'{field} is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get member
        member = get_object_or_404(Member, id=data['member_id'])
        
        # Get membership if provided
        membership = None
        if 'membership_id' in data:
            membership = get_object_or_404(Membership, id=data['membership_id'])
        
        # Create payment
        payment = payment_service.create_payment(
            member=member,
            membership=membership,
            amount=data['amount'],
            payment_method=data['payment_method'],
            description=data['description'],
            recorded_by=request.user,
            reference_number=data.get('reference_number'),
            notes=data.get('notes')
        )
        
        # Process based on payment method
        if data['payment_method'] == 'mpesa':
            if 'phone_number' not in data:
                return Response(
                    {'error': 'phone_number is required for M-Pesa payments'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            result = payment_service.process_mpesa_payment(
                payment=payment,
                phone_number=data['phone_number'],
                account_reference=data.get('account_reference')
            )
            
        elif data['payment_method'] == 'card':
            customer_info = data.get('customer_info', {})
            result = payment_service.process_card_payment(
                payment=payment,
                customer_email=customer_info.get('email', member.email),
                customer_name=customer_info.get('name', member.name),
                redirect_url=data.get('return_url', 'https://your-domain.com/payments/callback')
            )
            
        elif data['payment_method'] in ['cash', 'bank_transfer', 'cheque']:
            result = payment_service.record_manual_payment(
                payment=payment,
                recorded_by=request.user
            )
            
        else:
            return Response(
                {'error': 'Invalid payment method'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if result['success']:
            return Response(result, status=status.HTTP_201_CREATED)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment processing error: {str(e)}")
        return Response(
            {'error': 'Payment processing failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def check_payment_status(request, transaction_id):
    """Check payment status"""
    try:
        payment = get_object_or_404(Payment, transaction_id=transaction_id)
        
        # If payment is still processing, try to verify
        if payment.status in ['pending', 'processing']:
            result = payment_service.verify_payment(payment)
            if not result['success']:
                logger.warning(f"Payment verification failed: {result.get('error')}")
        
        # Refresh from database
        payment.refresh_from_db()
        
        serializer = PaymentSerializer(payment)
        return Response({
            'success': True,
            'payment': serializer.data,
            'status': payment.status,
            'message': f'Payment is {payment.status}'
        })
        
    except Payment.DoesNotExist:
        return Response(
            {'error': 'Payment not found'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        logger.error(f"Payment status check error: {str(e)}")
        return Response(
            {'error': 'Failed to check payment status'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_payment(request, payment_id):
    """Manually verify payment"""
    try:
        payment = get_object_or_404(Payment, id=payment_id)
        
        result = payment_service.verify_payment(payment)
        
        if result['success']:
            payment.refresh_from_db()
            serializer = PaymentSerializer(payment)
            return Response({
                'success': True,
                'payment': serializer.data,
                'verified': True,
                'status': payment.status
            })
        else:
            return Response({
                'success': False,
                'verified': False,
                'error': result.get('error', 'Verification failed')
            }, status=status.HTTP_400_BAD_REQUEST)
            
    except Exception as e:
        logger.error(f"Payment verification error: {str(e)}")
        return Response(
            {'error': 'Verification failed'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ================================
# PAYMENT MANAGEMENT ENDPOINTS
# ================================

class PaymentListView(generics.ListAPIView):
    """List payments with filtering and pagination"""
    serializer_class = PaymentSerializer
    pagination_class = PaymentPagination
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = Payment.objects.select_related('member', 'membership').all()
        
        # Filter by member
        member_id = self.request.query_params.get('member_id')
        if member_id:
            queryset = queryset.filter(member_id=member_id)
        
        # Filter by status
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Filter by payment method
        method = self.request.query_params.get('payment_method')
        if method:
            queryset = queryset.filter(payment_method=method)
        
        # Filter by date range
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        
        if date_from:
            try:
                date_from = datetime.strptime(date_from, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__gte=date_from)
            except ValueError:
                pass
        
        if date_to:
            try:
                date_to = datetime.strptime(date_to, '%Y-%m-%d').date()
                queryset = queryset.filter(created_at__date__lte=date_to)
            except ValueError:
                pass
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(member__name__icontains=search) |
                Q(description__icontains=search) |
                Q(transaction_id__icontains=search) |
                Q(reference_number__icontains=search)
            )
        
        return queryset.order_by('-created_at')
    
    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        
        # Add summary statistics
        queryset = self.get_queryset()
        
        stats = {
            'total_revenue': queryset.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0,
            'total_pending': queryset.filter(status__in=['pending', 'processing']).aggregate(
                total=Sum('amount')
            )['total'] or 0,
            'payment_count': queryset.count(),
            'completed_count': queryset.filter(status='completed').count()
        }
        
        response.data.update(stats)
        return response

class PaymentDetailView(generics.RetrieveAPIView):
    """Get payment details"""
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'
    
    def get_queryset(self):
        return Payment.objects.select_related('member', 'membership').all()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def member_payment_history(request, member_id):
    """Get payment history for a specific member"""
    try:
        member = get_object_or_404(Member, id=member_id)
        
        payments = Payment.objects.filter(member=member).order_by('-created_at')
        
        # Apply filters
        status_param = request.query_params.get('status')
        if status_param:
            payments = payments.filter(status=status_param)
        
        limit = int(request.query_params.get('limit', 50))
        payments = payments[:limit]
        
        serializer = PaymentSerializer(payments, many=True)
        
        # Calculate totals
        total_paid = Payment.objects.filter(
            member=member, 
            status='completed'
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        total_pending = Payment.objects.filter(
            member=member,
            status__in=['pending', 'processing']
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        return Response({
            'success': True,
            'member_id': member_id,
            'payments': serializer.data,
            'total_paid': float(total_paid),
            'total_pending': float(total_pending),
            'payment_count': len(serializer.data)
        })
        
    except Exception as e:
        logger.error(f"Member payment history error: {str(e)}")
        return Response(
            {'error': 'Failed to fetch payment history'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ================================
# PAYMENTS DUE & RENEWAL ENDPOINTS
# ================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payments_due(request):
    """Get members with payments due"""
    try:
        # Get all active memberships that are due for payment
        today = timezone.now().date()
        
        # Query memberships approaching expiry or overdue
        overdue_threshold = today - timedelta(days=30)  # 30 days grace period
        
        # Get memberships due for renewal
        memberships = Membership.objects.filter(
            status='active',
            end_date__lte=today + timedelta(days=30)  # Due in next 30 days
        ).select_related('member', 'plan').order_by('end_date')
        
        payment_due_list = []
        
        for membership in memberships:
            days_until_expiry = (membership.end_date - today).days
            
            # Check if member has recent pending payments
            recent_payments = Payment.objects.filter(
                member=membership.member,
                membership=membership,
                created_at__gte=today - timedelta(days=7),
                status__in=['pending', 'processing']
            ).exists()
            
            urgency = 'low'
            if days_until_expiry < 0:
                urgency = 'overdue'
            elif days_until_expiry <= 3:
                urgency = 'critical'
            elif days_until_expiry <= 7:
                urgency = 'high'
            elif days_until_expiry <= 14:
                urgency = 'medium'
            
            payment_due_list.append({
                'id': membership.id,
                'member': {
                    'id': membership.member.id,
                    'name': membership.member.name,
                    'email': membership.member.email,
                    'phone': membership.member.phone,
                    'member_id': membership.member.member_id
                },
                'membership': {
                    'id': membership.id,
                    'plan_name': membership.plan.name if membership.plan else 'N/A',
                    'start_date': membership.start_date.isoformat(),
                    'end_date': membership.end_date.isoformat(),
                    'status': membership.status,
                    'amount': float(membership.amount)
                },
                'days_until_expiry': days_until_expiry,
                'urgency': urgency,
                'amount_due': float(membership.amount),
                'has_pending_payment': recent_payments,
                'last_payment_date': None  # Will be populated below
            })
        
        # Get last payment dates
        for item in payment_due_list:
            last_payment = Payment.objects.filter(
                member_id=item['member']['id'],
                status='completed'
            ).order_by('-paid_at').first()
            
            if last_payment:
                item['last_payment_date'] = last_payment.paid_at.isoformat()
        
        # Apply filters
        urgency_filter = request.query_params.get('urgency')
        if urgency_filter:
            payment_due_list = [item for item in payment_due_list if item['urgency'] == urgency_filter]
        
        # Search
        search = request.query_params.get('search')
        if search:
            search = search.lower()
            payment_due_list = [
                item for item in payment_due_list 
                if (search in item['member']['name'].lower() or 
                    search in item['member']['email'].lower() or
                    search in (item['member']['member_id'] or '').lower())
            ]
        
        # Sort by urgency and expiry date
        urgency_order = {'overdue': 0, 'critical': 1, 'high': 2, 'medium': 3, 'low': 4}
        payment_due_list.sort(key=lambda x: (urgency_order[x['urgency']], x['days_until_expiry']))
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = len(payment_due_list)
        paginated_list = payment_due_list[start:end]
        
        # Calculate summary stats
        total_amount_due = sum(item['amount_due'] for item in payment_due_list)
        overdue_count = len([item for item in payment_due_list if item['urgency'] == 'overdue'])
        critical_count = len([item for item in payment_due_list if item['urgency'] == 'critical'])
        
        return Response({
            'success': True,
            'results': paginated_list,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size,
                'has_next': end < total_count,
                'has_previous': page > 1
            },
            'summary': {
                'total_amount_due': total_amount_due,
                'overdue_count': overdue_count,
                'critical_count': critical_count,
                'total_members': total_count
            }
        })
        
    except Exception as e:
        logger.error(f"Payments due error: {str(e)}")
        return Response(
            {'error': 'Failed to fetch payments due'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def renewals_due(request):
    """Get memberships due for renewal"""
    try:
        today = timezone.now().date()
        
        # Get memberships expiring in next 30 days or already expired
        memberships = Membership.objects.filter(
            end_date__lte=today + timedelta(days=30)
        ).select_related('member', 'plan').order_by('end_date')
        
        renewals_list = []
        
        for membership in memberships:
            days_until_expiry = (membership.end_date - today).days
            
            # Determine renewal urgency
            if days_until_expiry < 0:
                urgency = 'expired'
                status_text = f"Expired {abs(days_until_expiry)} days ago"
            elif days_until_expiry == 0:
                urgency = 'today'
                status_text = "Expires today"
            elif days_until_expiry <= 3:
                urgency = 'critical'
                status_text = f"Expires in {days_until_expiry} days"
            elif days_until_expiry <= 7:
                urgency = 'high'
                status_text = f"Expires in {days_until_expiry} days"
            elif days_until_expiry <= 14:
                urgency = 'medium'
                status_text = f"Expires in {days_until_expiry} days"
            else:
                urgency = 'low'
                status_text = f"Expires in {days_until_expiry} days"
            
            renewals_list.append({
                'id': membership.id,
                'member': {
                    'id': membership.member.id,
                    'name': membership.member.name,
                    'email': membership.member.email,
                    'phone': membership.member.phone,
                    'member_id': membership.member.member_id
                },
                'membership': {
                    'id': membership.id,
                    'plan_name': membership.plan.name if membership.plan else 'N/A',
                    'start_date': membership.start_date.isoformat(),
                    'end_date': membership.end_date.isoformat(),
                    'status': membership.status,
                    'amount': float(membership.amount)
                },
                'days_until_expiry': days_until_expiry,
                'urgency': urgency,
                'status_text': status_text,
                'renewal_amount': float(membership.amount)
            })
        
        # Apply filters
        urgency_filter = request.query_params.get('urgency')
        if urgency_filter:
            renewals_list = [item for item in renewals_list if item['urgency'] == urgency_filter]
        
        # Search
        search = request.query_params.get('search')
        if search:
            search = search.lower()
            renewals_list = [
                item for item in renewals_list 
                if (search in item['member']['name'].lower() or 
                    search in item['member']['email'].lower() or
                    search in (item['member']['member_id'] or '').lower())
            ]
        
        # Sort by urgency and expiry date
        urgency_order = {'expired': 0, 'today': 1, 'critical': 2, 'high': 3, 'medium': 4, 'low': 5}
        renewals_list.sort(key=lambda x: (urgency_order[x['urgency']], x['days_until_expiry']))
        
        # Pagination
        page = int(request.query_params.get('page', 1))
        page_size = int(request.query_params.get('page_size', 20))
        start = (page - 1) * page_size
        end = start + page_size
        
        total_count = len(renewals_list)
        paginated_list = renewals_list[start:end]
        
        # Calculate summary stats
        total_renewal_amount = sum(item['renewal_amount'] for item in renewals_list)
        expired_count = len([item for item in renewals_list if item['urgency'] == 'expired'])
        critical_count = len([item for item in renewals_list if item['urgency'] in ['today', 'critical']])
        
        return Response({
            'success': True,
            'results': paginated_list,
            'pagination': {
                'page': page,
                'page_size': page_size,
                'total_count': total_count,
                'total_pages': (total_count + page_size - 1) // page_size,
                'has_next': end < total_count,
                'has_previous': page > 1
            },
            'summary': {
                'total_renewal_amount': total_renewal_amount,
                'expired_count': expired_count,
                'critical_count': critical_count,
                'total_renewals': total_count
            }
        })
        
    except Exception as e:
        logger.error(f"Renewals due error: {str(e)}")
        return Response(
            {'error': 'Failed to fetch renewals due'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

# ================================
# PAYMENT ANALYTICS ENDPOINTS
# ================================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def payment_analytics(request):
    """Get payment analytics and statistics"""
    try:
        # Date range filter
        days = int(request.query_params.get('days', 30))
        start_date = timezone.now().date() - timedelta(days=days)
        
        # Base queryset
        payments = Payment.objects.filter(created_at__date__gte=start_date)
        
        # Revenue analytics
        revenue_data = {
            'total_revenue': payments.filter(status='completed').aggregate(
                total=Sum('amount')
            )['total'] or 0,
            'pending_revenue': payments.filter(status__in=['pending', 'processing']).aggregate(
                total=Sum('amount')
            )['total'] or 0,
        }
        
        # Payment method breakdown
        method_stats = []
        for method, label in Payment.PaymentMethod.choices:
            method_payments = payments.filter(payment_method=method, status='completed')
            count = method_payments.count()
            amount = method_payments.aggregate(total=Sum('amount'))['total'] or 0
            
            if count > 0:
                method_stats.append({
                    'method': method,
                    'label': label,
                    'count': count,
                    'amount': float(amount),
                    'percentage': round((count / payments.filter(status='completed').count()) * 100, 1) if payments.filter(status='completed').count() > 0 else 0
                })
        
        # Daily revenue trend
        daily_revenue = []
        for i in range(days):
            date = start_date + timedelta(days=i)
            day_revenue = payments.filter(
                created_at__date=date,
                status='completed'
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            daily_revenue.append({
                'date': date.isoformat(),
                'revenue': float(day_revenue)
            })
        
        # Status breakdown
        status_stats = []
        for status_value, label in Payment.PaymentStatus.choices:
            count = payments.filter(status=status_value).count()
            if count > 0:
                status_stats.append({
                    'status': status_value,
                    'label': label,
                    'count': count
                })
        
        # Top paying members
        top_members = []
        member_payments = payments.filter(status='completed').values('member__id', 'member__name').annotate(
            total_paid=Sum('amount'),
            payment_count=Count('id')
        ).order_by('-total_paid')[:10]
        
        for member_data in member_payments:
            top_members.append({
                'member_id': member_data['member__id'],
                'member_name': member_data['member__name'],
                'total_paid': float(member_data['total_paid']),
                'payment_count': member_data['payment_count']
            })
        
        return Response({
            'success': True,
            'period': f"Last {days} days",
            'revenue': revenue_data,
            'payment_methods': method_stats,
            'status_breakdown': status_stats,
            'daily_revenue': daily_revenue,
            'top_members': top_members,
            'summary': {
                'total_payments': payments.count(),
                'successful_payments': payments.filter(status='completed').count(),
                'failed_payments': payments.filter(status='failed').count(),
                'success_rate': round((payments.filter(status='completed').count() / payments.count() * 100), 1) if payments.count() > 0 else 0
            }
        })
        
    except Exception as e:
        logger.error(f"Payment analytics error: {str(e)}")
        return Response(
            {'error': 'Failed to fetch payment analytics'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 🔗 PART 4: Webhook Implementation

### Step 8: M-Pesa Callback Handler

**Create `payments/webhooks/mpesa_webhook.py`:**
```python
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.utils.decorators import method_decorator
from django.views import View
from rest_framework import status
from ..models import Payment, PaymentWebhook, PaymentStatus
from ..services.payment_service import payment_service
import json
import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class MpesaCallbackView(View):
    """Handle M-Pesa STK Push callbacks"""
    
    def post(self, request):
        try:
            # Parse callback data
            callback_data = json.loads(request.body.decode('utf-8'))
            
            # Log the callback
            logger.info(f"M-Pesa callback received: {callback_data}")
            
            # Store webhook data
            webhook = PaymentWebhook.objects.create(
                gateway='mpesa',
                event_type='stk_callback',
                raw_data=callback_data
            )
            
            # Extract relevant data
            stk_callback = callback_data.get('Body', {}).get('stkCallback', {})
            
            if not stk_callback:
                logger.error("Invalid M-Pesa callback format")
                return HttpResponse("Invalid callback format", status=400)
            
            checkout_request_id = stk_callback.get('CheckoutRequestID')
            result_code = stk_callback.get('ResultCode')
            result_desc = stk_callback.get('ResultDesc')
            
            if not checkout_request_id:
                logger.error("Missing CheckoutRequestID in callback")
                return HttpResponse("Missing CheckoutRequestID", status=400)
            
            # Find the payment
            try:
                mpesa_payment = MpesaPayment.objects.select_related('payment').get(
                    checkout_request_id=checkout_request_id
                )
                payment = mpesa_payment.payment
                webhook.payment = payment
                
            except MpesaPayment.DoesNotExist:
                logger.error(f"Payment not found for CheckoutRequestID: {checkout_request_id}")
                webhook.error_message = "Payment not found"
                webhook.save()
                return HttpResponse("Payment not found", status=404)
            
            # Process the callback
            if result_code == 0:
                # Payment successful
                callback_metadata = stk_callback.get('CallbackMetadata', {})
                items = callback_metadata.get('Item', [])
                
                # Extract payment details
                mpesa_receipt = None
                transaction_date = None
                amount_paid = None
                phone_number = None
                
                for item in items:
                    name = item.get('Name')
                    value = item.get('Value')
                    
                    if name == 'MpesaReceiptNumber':
                        mpesa_receipt = value
                    elif name == 'TransactionDate':
                        transaction_date = value
                    elif name == 'Amount':
                        amount_paid = value
                    elif name == 'PhoneNumber':
                        phone_number = value
                
                # Update M-Pesa payment record
                mpesa_payment.mpesa_receipt_number = mpesa_receipt
                if transaction_date:
                    mpesa_payment.transaction_date = timezone.now()
                mpesa_payment.save()
                
                # Complete the payment
                payment_service._complete_payment(payment, stk_callback)
                
                logger.info(f"M-Pesa payment completed: {payment.transaction_id}")
                
            elif result_code in [1032, 1037]:
                # Payment cancelled by user
                payment.status = PaymentStatus.CANCELLED
                payment.gateway_response.update(stk_callback)
                payment.save()
                
                logger.info(f"M-Pesa payment cancelled: {payment.transaction_id}")
                
            else:
                # Payment failed
                payment.status = PaymentStatus.FAILED
                payment.gateway_response.update(stk_callback)
                payment.save()
                
                logger.warning(f"M-Pesa payment failed: {payment.transaction_id}, Code: {result_code}")
            
            # Mark webhook as processed
            webhook.is_processed = True
            webhook.processed_at = timezone.now()
            webhook.processed_data = {
                'payment_id': str(payment.id),
                'result_code': result_code,
                'result_desc': result_desc
            }
            webhook.save()
            
            return HttpResponse("Callback processed successfully")
            
        except json.JSONDecodeError:
            logger.error("Invalid JSON in M-Pesa callback")
            return HttpResponse("Invalid JSON", status=400)
            
        except Exception as e:
            logger.error(f"M-Pesa callback processing error: {str(e)}")
            if 'webhook' in locals():
                webhook.error_message = str(e)
                webhook.save()
            return HttpResponse("Callback processing failed", status=500)

@csrf_exempt
@require_http_methods(["GET"])
def mpesa_validation(request):
    """M-Pesa validation endpoint (if required)"""
    # For basic validation, just return success
    # You can add custom validation logic here
    return HttpResponse("Validation successful")
```

### Step 9: Flutterwave Webhook Handler

**Create `payments/webhooks/flutterwave_webhook.py`:**
```python
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from ..models import Payment, PaymentWebhook, PaymentStatus
from ..services.payment_service import payment_service
import json
import hashlib
import hmac
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
@require_http_methods(["POST"])
def flutterwave_webhook(request):
    """Handle Flutterwave webhook notifications"""
    try:
        # Verify webhook signature
        signature = request.headers.get('verif-hash')
        if not verify_webhook_signature(request.body, signature):
            logger.error("Invalid Flutterwave webhook signature")
            return HttpResponse("Invalid signature", status=401)
        
        # Parse webhook data
        webhook_data = json.loads(request.body.decode('utf-8'))
        
        # Log the webhook
        logger.info(f"Flutterwave webhook received: {webhook_data}")
        
        # Store webhook data
        webhook = PaymentWebhook.objects.create(
            gateway='flutterwave',
            event_type=webhook_data.get('event'),
            raw_data=webhook_data
        )
        
        # Process based on event type
        event = webhook_data.get('event')
        
        if event == 'charge.completed':
            process_charge_completed(webhook, webhook_data)
        elif event == 'transfer.completed':
            process_transfer_completed(webhook, webhook_data)
        else:
            logger.info(f"Unhandled Flutterwave event: {event}")
        
        # Mark webhook as processed
        webhook.is_processed = True
        webhook.processed_at = timezone.now()
        webhook.save()
        
        return HttpResponse("Webhook processed successfully")
        
    except json.JSONDecodeError:
        logger.error("Invalid JSON in Flutterwave webhook")
        return HttpResponse("Invalid JSON", status=400)
        
    except Exception as e:
        logger.error(f"Flutterwave webhook processing error: {str(e)}")
        if 'webhook' in locals():
            webhook.error_message = str(e)
            webhook.save()
        return HttpResponse("Webhook processing failed", status=500)

def verify_webhook_signature(payload, signature):
    """Verify Flutterwave webhook signature"""
    try:
        secret_key = settings.PAYMENT_SETTINGS['FLUTTERWAVE']['SECRET_KEY']
        expected_signature = hashlib.sha256(secret_key.encode()).hexdigest()
        return hmac.compare_digest(signature, expected_signature)
    except:
        return False

def process_charge_completed(webhook, data):
    """Process completed charge events"""
    try:
        charge_data = data.get('data', {})
        tx_ref = charge_data.get('tx_ref')
        
        if not tx_ref:
            logger.error("No tx_ref in charge completed webhook")
            return
        
        # Find payment by transaction_id
        try:
            payment = Payment.objects.get(transaction_id=tx_ref)
            webhook.payment = payment
            
        except Payment.DoesNotExist:
            logger.error(f"Payment not found for tx_ref: {tx_ref}")
            webhook.error_message = "Payment not found"
            return
        
        # Check payment status
        status = charge_data.get('status')
        
        if status == 'successful':
            # Update card payment data
            if hasattr(payment, 'card_data'):
                card_data = payment.card_data
                card_data.card_last_four = charge_data.get('card', {}).get('last_4digits')
                card_data.card_brand = charge_data.get('card', {}).get('type')
                card_data.gateway_fee = charge_data.get('app_fee', 0)
                card_data.save()
            
            # Complete the payment
            payment_service._complete_payment(payment, charge_data)
            
            logger.info(f"Flutterwave payment completed: {payment.transaction_id}")
            
        else:
            # Payment failed
            payment.status = PaymentStatus.FAILED
            payment.gateway_response.update(charge_data)
            payment.save()
            
            logger.warning(f"Flutterwave payment failed: {payment.transaction_id}")
        
        webhook.processed_data = {
            'payment_id': str(payment.id),
            'status': status,
            'amount': charge_data.get('amount')
        }
        
    except Exception as e:
        logger.error(f"Error processing charge completed: {str(e)}")
        webhook.error_message = str(e)

def process_transfer_completed(webhook, data):
    """Process completed transfer events (for refunds, etc.)"""
    # Implementation for transfer events
    logger.info("Transfer completed event received")
```

---

## 📄 PART 5: Invoice & Receipt Generation

### Step 10: PDF Generation Service

**Create `payments/services/pdf_service.py`:**
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import black, blue, grey
from reportlab.lib import colors
from django.conf import settings
from django.core.files.base import ContentFile
from io import BytesIO
import os
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class PDFService:
    """Service for generating PDF invoices and receipts"""
    
    def __init__(self):
        self.styles = getSampleStyleSheet()
        self.create_custom_styles()
    
    def create_custom_styles(self):
        """Create custom paragraph styles"""
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Heading1'],
            fontSize=18,
            spaceAfter=30,
            textColor=blue
        ))
        
        self.styles.add(ParagraphStyle(
            name='CompanyInfo',
            parent=self.styles['Normal'],
            fontSize=10,
            textColor=grey
        ))
    
    def generate_invoice_pdf(self, invoice):
        """Generate PDF for invoice"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
            
            # Build the story (content)
            story = []
            
            # Header
            story.append(Paragraph("INVOICE", self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Company info
            company_info = [
                "Paul's Tropical Fitness",
                "Email: contact@paulstropicalfitness.fit",
                "Phone: +254 XXX XXX XXX"
            ]
            
            for line in company_info:
                story.append(Paragraph(line, self.styles['CompanyInfo']))
            
            story.append(Spacer(1, 30))
            
            # Invoice details table
            invoice_data = [
                ['Invoice Number:', invoice.invoice_number],
                ['Date:', invoice.issue_date.strftime('%Y-%m-%d')],
                ['Due Date:', invoice.due_date.strftime('%Y-%m-%d')],
                ['Member:', invoice.member.name],
                ['Email:', invoice.member.email],
            ]
            
            if invoice.member.member_id:
                invoice_data.append(['Member ID:', invoice.member.member_id])
            
            info_table = Table(invoice_data, colWidths=[2*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 30))
            
            # Items table
            items_data = [['Description', 'Amount (KES)']]
            
            if invoice.items:
                for item in invoice.items:
                    items_data.append([
                        item.get('description', ''),
                        f"{float(item.get('amount', 0)):,.2f}"
                    ])
            else:
                items_data.append([invoice.description, f"{float(invoice.amount):,.2f}"])
            
            # Add total row
            items_data.append(['Total', f"KES {float(invoice.amount):,.2f}"])
            
            items_table = Table(items_data, colWidths=[4*inch, 2*inch])
            items_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.beige),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgrey),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(items_table)
            story.append(Spacer(1, 30))
            
            # Payment instructions
            if not invoice.is_paid:
                story.append(Paragraph("Payment Instructions:", self.styles['Heading3']))
                payment_info = [
                    "• Pay via M-Pesa: Paybill XXXXXX",
                    "• Account Number: Your Member ID",
                    "• Card payments: Visit our website",
                    "• Cash payments: Visit the gym reception"
                ]
                
                for instruction in payment_info:
                    story.append(Paragraph(instruction, self.styles['Normal']))
            else:
                story.append(Paragraph("PAID", self.styles['CustomTitle']))
                if invoice.paid_date:
                    story.append(Paragraph(f"Paid on: {invoice.paid_date.strftime('%Y-%m-%d')}", self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content
            pdf_content = buffer.getvalue()
            buffer.close()
            
            # Save to invoice model
            filename = f"invoice_{invoice.invoice_number}.pdf"
            invoice.pdf_file.save(filename, ContentFile(pdf_content))
            
            logger.info(f"Invoice PDF generated: {invoice.invoice_number}")
            return True
            
        except Exception as e:
            logger.error(f"Invoice PDF generation error: {str(e)}")
            return False
    
    def generate_receipt_pdf(self, receipt):
        """Generate PDF for receipt"""
        try:
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=1*inch)
            
            story = []
            
            # Header
            story.append(Paragraph("RECEIPT", self.styles['CustomTitle']))
            story.append(Spacer(1, 20))
            
            # Company info
            company_info = [
                "Paul's Tropical Fitness",
                "Email: contact@paulstropicalfitness.fit",
                "Phone: +254 XXX XXX XXX"
            ]
            
            for line in company_info:
                story.append(Paragraph(line, self.styles['CompanyInfo']))
            
            story.append(Spacer(1, 30))
            
            # Receipt details
            payment = receipt.payment
            receipt_data = [
                ['Receipt Number:', receipt.receipt_number],
                ['Date:', receipt.created_at.strftime('%Y-%m-%d %H:%M')],
                ['Payment Method:', payment.payment_method.title()],
                ['Member:', payment.member.name],
                ['Email:', payment.member.email],
                ['Transaction ID:', payment.transaction_id],
            ]
            
            if payment.external_transaction_id:
                receipt_data.append(['Reference:', payment.external_transaction_id])
            
            if payment.payment_method == 'mpesa' and hasattr(payment, 'mpesa_data'):
                mpesa_data = payment.mpesa_data
                if mpesa_data.mpesa_receipt_number:
                    receipt_data.append(['M-Pesa Receipt:', mpesa_data.mpesa_receipt_number])
            
            info_table = Table(receipt_data, colWidths=[2*inch, 3*inch])
            info_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ]))
            
            story.append(info_table)
            story.append(Spacer(1, 30))
            
            # Payment details table
            payment_data = [['Description', 'Amount (KES)']]
            
            if receipt.items:
                for item in receipt.items:
                    payment_data.append([
                        item.get('description', ''),
                        f"{float(item.get('amount', 0)):,.2f}"
                    ])
            else:
                payment_data.append([receipt.description, f"{float(receipt.amount):,.2f}"])
            
            # Add total row
            payment_data.append(['Total Paid', f"KES {float(receipt.amount):,.2f}"])
            
            payment_table = Table(payment_data, colWidths=[4*inch, 2*inch])
            payment_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.green),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -2), colors.lightblue),
                ('BACKGROUND', (0, -1), (-1, -1), colors.lightgreen),
                ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
                ('GRID', (0, 0), (-1, -1), 1, colors.black)
            ]))
            
            story.append(payment_table)
            story.append(Spacer(1, 40))
            
            # Thank you message
            story.append(Paragraph("Thank you for your payment!", self.styles['Heading3']))
            story.append(Paragraph("Keep this receipt for your records.", self.styles['Normal']))
            
            # Build PDF
            doc.build(story)
            
            # Get PDF content
            pdf_content = buffer.getvalue()
            buffer.close()
            
            # Save to receipt model
            filename = f"receipt_{receipt.receipt_number}.pdf"
            receipt.pdf_file.save(filename, ContentFile(pdf_content))
            
            logger.info(f"Receipt PDF generated: {receipt.receipt_number}")
            return True
            
        except Exception as e:
            logger.error(f"Receipt PDF generation error: {str(e)}")
            return False

# Global instance
pdf_service = PDFService()
```

---

## 🚀 PART 6: Background Tasks & Celery Setup

### Step 11: Celery Tasks

**Create `payments/tasks.py`:**
```python
from celery import shared_task
from django.utils import timezone
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.conf import settings
from datetime import timedelta
from .models import Payment, Invoice, Receipt, PaymentReminder, PaymentStatus
from .services.payment_service import payment_service
from .services.pdf_service import pdf_service
from members.models import Member
from memberships.models import Membership
import logging

logger = logging.getLogger(__name__)

@shared_task
def process_pending_payments():
    """Check and update status of pending payments"""
    try:
        # Get payments that are still pending/processing for more than 10 minutes
        timeout_threshold = timezone.now() - timedelta(minutes=10)
        
        pending_payments = Payment.objects.filter(
            status__in=[PaymentStatus.PENDING, PaymentStatus.PROCESSING],
            created_at__lte=timeout_threshold
        )
        
        for payment in pending_payments:
            logger.info(f"Checking payment status: {payment.transaction_id}")
            
            # Verify payment status
            result = payment_service.verify_payment(payment)
            
            if result['success']:
                logger.info(f"Payment status updated: {payment.transaction_id} -> {result['status']}")
            else:
                logger.warning(f"Failed to verify payment: {payment.transaction_id}")
        
        return f"Processed {pending_payments.count()} pending payments"
        
    except Exception as e:
        logger.error(f"Error processing pending payments: {str(e)}")
        return f"Error: {str(e)}"

@shared_task
def send_payment_reminders():
    """Send payment reminders to members with expiring memberships"""
    try:
        today = timezone.now().date()
        reminder_days = settings.PAYMENT_SETTINGS.get('AUTO_REMINDER_DAYS', [7, 3, 1])
        
        reminders_sent = 0
        
        for days in reminder_days:
            target_date = today + timedelta(days=days)
            
            # Get memberships expiring on target date
            expiring_memberships = Membership.objects.filter(
                end_date=target_date,
                status='active'
            ).select_related('member')
            
            for membership in expiring_memberships:
                # Check if reminder already sent
                existing_reminder = PaymentReminder.objects.filter(
                    member=membership.member,
                    membership=membership,
                    reminder_type='due_soon',
                    sent_at__date=today
                ).exists()
                
                if not existing_reminder:
                    # Send reminder
                    success = send_reminder_email(membership, days)
                    
                    if success:
                        PaymentReminder.objects.create(
                            member=membership.member,
                            membership=membership,
                            reminder_type='due_soon',
                            message=f"Membership expires in {days} days",
                            sent_email=True,
                            sent_at=timezone.now()
                        )
                        reminders_sent += 1
        
        return f"Sent {reminders_sent} payment reminders"
        
    except Exception as e:
        logger.error(f"Error sending payment reminders: {str(e)}")
        return f"Error: {str(e)}"

@shared_task
def generate_invoice_pdf_task(invoice_id):
    """Generate PDF for invoice (background task)"""
    try:
        invoice = Invoice.objects.get(id=invoice_id)
        success = pdf_service.generate_invoice_pdf(invoice)
        
        if success:
            logger.info(f"Invoice PDF generated successfully: {invoice.invoice_number}")
            return f"Invoice PDF generated: {invoice.invoice_number}"
        else:
            logger.error(f"Failed to generate invoice PDF: {invoice.invoice_number}")
            return f"Failed to generate PDF for invoice: {invoice.invoice_number}"
            
    except Invoice.DoesNotExist:
        logger.error(f"Invoice not found: {invoice_id}")
        return f"Invoice not found: {invoice_id}"
    except Exception as e:
        logger.error(f"Error generating invoice PDF: {str(e)}")
        return f"Error: {str(e)}"

@shared_task
def generate_receipt_pdf_task(receipt_id):
    """Generate PDF for receipt (background task)"""
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        success = pdf_service.generate_receipt_pdf(receipt)
        
        if success:
            logger.info(f"Receipt PDF generated successfully: {receipt.receipt_number}")
            return f"Receipt PDF generated: {receipt.receipt_number}"
        else:
            logger.error(f"Failed to generate receipt PDF: {receipt.receipt_number}")
            return f"Failed to generate PDF for receipt: {receipt.receipt_number}"
            
    except Receipt.DoesNotExist:
        logger.error(f"Receipt not found: {receipt_id}")
        return f"Receipt not found: {receipt_id}"
    except Exception as e:
        logger.error(f"Error generating receipt PDF: {str(e)}")
        return f"Error: {str(e)}"

@shared_task
def send_receipt_email_task(receipt_id, email_address):
    """Send receipt via email (background task)"""
    try:
        receipt = Receipt.objects.get(id=receipt_id)
        
        # Generate PDF if not exists
        if not receipt.pdf_file:
            pdf_service.generate_receipt_pdf(receipt)
        
        # Send email
        success = send_receipt_email(receipt, email_address)
        
        if success:
            receipt.is_emailed = True
            receipt.emailed_at = timezone.now()
            receipt.email_address = email_address
            receipt.save()
            
            return f"Receipt emailed successfully: {receipt.receipt_number}"
        else:
            return f"Failed to email receipt: {receipt.receipt_number}"
            
    except Receipt.DoesNotExist:
        return f"Receipt not found: {receipt_id}"
    except Exception as e:
        logger.error(f"Error sending receipt email: {str(e)}")
        return f"Error: {str(e)}"

def send_reminder_email(membership, days_until_expiry):
    """Send payment reminder email"""
    try:
        subject = f"Membership Renewal Reminder - {days_until_expiry} days remaining"
        
        context = {
            'member': membership.member,
            'membership': membership,
            'days_until_expiry': days_until_expiry,
            'renewal_amount': membership.amount,
            'gym_name': "Paul's Tropical Fitness"
        }
        
        html_message = render_to_string('emails/payment_reminder.html', context)
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.PAYMENT_SETTINGS['RECEIPT_FROM_EMAIL'],
            to=[membership.member.email]
        )
        email.content_subtype = 'html'
        email.send()
        
        logger.info(f"Reminder email sent to {membership.member.email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send reminder email: {str(e)}")
        return False

def send_receipt_email(receipt, email_address):
    """Send receipt via email"""
    try:
        subject = f"Payment Receipt - {receipt.receipt_number}"
        
        context = {
            'receipt': receipt,
            'payment': receipt.payment,
            'member': receipt.payment.member,
            'gym_name': "Paul's Tropical Fitness"
        }
        
        html_message = render_to_string('emails/receipt.html', context)
        
        email = EmailMessage(
            subject=subject,
            body=html_message,
            from_email=settings.PAYMENT_SETTINGS['RECEIPT_FROM_EMAIL'],
            to=[email_address]
        )
        email.content_subtype = 'html'
        
        # Attach PDF if available
        if receipt.pdf_file:
            email.attach_file(receipt.pdf_file.path)
        
        email.send()
        
        logger.info(f"Receipt email sent to {email_address}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send receipt email: {str(e)}")
        return False
```

### Step 12: Celery Configuration

**Create `ptf/celery.py`:**
```python
import os
from celery import Celery
from celery.schedules import crontab

# Set default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')

app = Celery('ptf')

# Load task modules from all registered Django app configs
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks
app.autodiscover_tasks()

# Celery Beat schedule
app.conf.beat_schedule = {
    'process-pending-payments': {
        'task': 'payments.tasks.process_pending_payments',
        'schedule': crontab(minute='*/10'),  # Every 10 minutes
    },
    'send-payment-reminders': {
        'task': 'payments.tasks.send_payment_reminders',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
}

app.conf.timezone = 'Africa/Nairobi'

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
```

---

## 📝 PART 7: API Serializers

### Step 13: Create Serializers

**Create `payments/serializers.py`:**
```python
from rest_framework import serializers
from .models import Payment, Invoice, Receipt, PaymentReminder, MpesaPayment, CardPayment
from members.serializers import MemberSerializer

class MpesaPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = MpesaPayment
        fields = [
            'checkout_request_id', 'phone_number', 'account_reference',
            'mpesa_receipt_number', 'transaction_date', 'created_at'
        ]

class CardPaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = CardPayment
        fields = [
            'card_last_four', 'card_brand', 'gateway_reference',
            'gateway_fee', 'customer_email', 'customer_name', 'created_at'
        ]

class PaymentSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    mpesa_data = MpesaPaymentSerializer(read_only=True)
    card_data = CardPaymentSerializer(read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Payment
        fields = [
            'id', 'member', 'membership', 'amount', 'currency',
            'payment_method', 'payment_method_display', 'status', 'status_display',
            'transaction_id', 'external_transaction_id', 'description',
            'reference_number', 'notes', 'created_at', 'updated_at',
            'paid_at', 'mpesa_data', 'card_data'
        ]

class InvoiceSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    
    class Meta:
        model = Invoice
        fields = [
            'id', 'member', 'membership', 'payment', 'invoice_number',
            'amount', 'currency', 'issue_date', 'due_date', 'paid_date',
            'description', 'items', 'notes', 'is_paid', 'is_sent',
            'sent_at', 'pdf_file', 'created_at', 'updated_at'
        ]

class ReceiptSerializer(serializers.ModelSerializer):
    payment = PaymentSerializer(read_only=True)
    
    class Meta:
        model = Receipt
        fields = [
            'id', 'payment', 'receipt_number', 'amount', 'currency',
            'description', 'items', 'pdf_file', 'is_emailed',
            'emailed_at', 'email_address', 'created_at'
        ]

class PaymentReminderSerializer(serializers.ModelSerializer):
    member = MemberSerializer(read_only=True)
    
    class Meta:
        model = PaymentReminder
        fields = [
            'id', 'member', 'membership', 'reminder_type', 'message',
            'sent_email', 'sent_sms', 'sent_at', 'opened_email',
            'clicked_link', 'created_at'
        ]
```

---

## 🔗 PART 8: URL Configuration

### Step 14: Payment URLs

**Create `payments/urls.py`:**
```python
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .webhooks import mpesa_webhook, flutterwave_webhook

app_name = 'payments'

urlpatterns = [
    # Payment processing
    path('process/', views.process_payment, name='process_payment'),
    path('status/<str:transaction_id>/', views.check_payment_status, name='check_payment_status'),
    path('verify/<uuid:payment_id>/', views.verify_payment, name='verify_payment'),
    
    # Payment management
    path('', views.PaymentListView.as_view(), name='payment_list'),
    path('<uuid:id>/', views.PaymentDetailView.as_view(), name='payment_detail'),
    path('member/<int:member_id>/history/', views.member_payment_history, name='member_payment_history'),
    
    # Due payments and renewals
    path('due/', views.payments_due, name='payments_due'),
    path('renewals/', views.renewals_due, name='renewals_due'),
    
    # Analytics
    path('analytics/', views.payment_analytics, name='payment_analytics'),
    
    # Webhooks
    path('webhooks/mpesa/callback/', mpesa_webhook.MpesaCallbackView.as_view(), name='mpesa_callback'),
    path('webhooks/mpesa/validation/', mpesa_webhook.mpesa_validation, name='mpesa_validation'),
    path('webhooks/flutterwave/', flutterwave_webhook.flutterwave_webhook, name='flutterwave_webhook'),
]
```

**Update main `ptf/urls.py`:**
```python
from django.contrib import admin
from django.urls import path, include
from django.urls import re_path
from rest_framework import permissions
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from dashboard.views import DashboardStatsView
from dashboard.views import DashboardNotificationsView

schema_view = get_schema_view(
    openapi.Info(
        title="PTF Gym Management API",
        default_version="v1",
        description="API for Paul's Tropical Fitness Gym Management System",
        terms_of_service="https://www.google.com/policies/terms/",
        contact=openapi.Contact(email="contact@paulstropicalfitness.fit"),
        license=openapi.License(name="BSD License"),
    ),
    public=True,
    permission_classes=(permissions.AllowAny,),
)

urlpatterns = [
    # API Documentation
    path("", schema_view.without_ui(cache_timeout=0), name="schema-json"),
    path(
        "swagger/",
        schema_view.with_ui("swagger", cache_timeout=0),
        name="schema-swagger-ui",
    ),
    path("redoc/", schema_view.with_ui("redoc", cache_timeout=0), name="schema-redoc"),
    # Admin
    path("admin/", admin.site.urls),
    # API URLs with /api/ prefix
    path("", include("accounts.urls")),
    path("", include("members.urls")),
    path("", include("bookings.urls")),
    path("", include("memberships.urls")),
    path("attendance/", include("attendance.urls")),
    # Dashboard
    path("dashboard/stats/", DashboardStatsView.as_view(), name="dashboard-stats"),
    path(
        "dashboard/notifications/",
        DashboardNotificationsView.as_view(),
        name="dashboard-notifications",
    ),
    # Payments - NEW
    path("payments/", include("payments.urls")),
]
```

---

## 🧪 PART 9: Testing Strategy

### Step 15: Payment Tests

**Create `payments/tests/test_payment_service.py`:**
```python
from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from unittest.mock import patch, MagicMock
from ..models import Payment, PaymentStatus
from ..services.payment_service import payment_service
from members.models import Member
from memberships.models import Membership

class PaymentServiceTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.member = Member.objects.create(
            name='John Doe',
            email='john@example.com',
            phone='0712345678',
            member_id='MEM001'
        )
        
        self.membership = Membership.objects.create(
            member=self.member,
            start_date='2024-01-01',
            end_date='2024-02-01',
            amount=Decimal('2000.00'),
            status='active'
        )
    
    def test_create_payment(self):
        """Test payment creation"""
        payment = payment_service.create_payment(
            member=self.member,
            membership=self.membership,
            amount=Decimal('2000.00'),
            payment_method='cash',
            description='Monthly membership fee',
            recorded_by=self.user
        )
        
        self.assertIsInstance(payment, Payment)
        self.assertEqual(payment.member, self.member)
        self.assertEqual(payment.amount, Decimal('2000.00'))
        self.assertEqual(payment.payment_method, 'cash')
        self.assertEqual(payment.status, PaymentStatus.PENDING)
    
    @patch('payments.services.mpesa_service.mpesa_service.initiate_stk_push')
    def test_process_mpesa_payment_success(self, mock_stk_push):
        """Test successful M-Pesa payment processing"""
        # Setup mock
        mock_stk_push.return_value = {
            'success': True,
            'checkout_request_id': 'ws_CO_123456789',
            'merchant_request_id': 'MR_123456789',
            'customer_message': 'Check your phone'
        }
        
        # Create payment
        payment = payment_service.create_payment(
            member=self.member,
            membership=self.membership,
            amount=Decimal('2000.00'),
            payment_method='mpesa',
            description='Monthly membership fee'
        )
        
        # Process M-Pesa payment
        result = payment_service.process_mpesa_payment(
            payment=payment,
            phone_number='0712345678'
        )
        
        self.assertTrue(result['success'])
        self.assertIn('checkout_request_id', result)
        
        # Refresh payment from database
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.PROCESSING)
    
    def test_record_manual_payment(self):
        """Test manual payment recording"""
        payment = payment_service.create_payment(
            member=self.member,
            membership=self.membership,
            amount=Decimal('2000.00'),
            payment_method='cash',
            description='Monthly membership fee'
        )
        
        result = payment_service.record_manual_payment(
            payment=payment,
            recorded_by=self.user
        )
        
        self.assertTrue(result['success'])
        
        # Refresh payment from database
        payment.refresh_from_db()
        self.assertEqual(payment.status, PaymentStatus.COMPLETED)
        self.assertIsNotNone(payment.paid_at)
        self.assertEqual(payment.recorded_by, self.user)

class PaymentAPITestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='testpass123'
        )
        
        self.member = Member.objects.create(
            name='John Doe',
            email='john@example.com',
            phone='0712345678',
            member_id='MEM001'
        )
    
    def test_process_payment_api_cash(self):
        """Test payment processing API for cash payments"""
        self.client.force_authenticate(user=self.user)
        
        data = {
            'member_id': self.member.id,
            'amount': '2000.00',
            'payment_method': 'cash',
            'description': 'Monthly membership fee'
        }
        
        response = self.client.post('/payments/process/', data)
        
        self.assertEqual(response.status_code, 201)
        self.assertTrue(response.data['success'])
        
        # Check payment was created
        payment = Payment.objects.get(transaction_id=response.data['transaction_id'])
        self.assertEqual(payment.status, PaymentStatus.COMPLETED)
    
    def test_payments_due_api(self):
        """Test payments due API endpoint"""
        self.client.force_authenticate(user=self.user)
        
        response = self.client.get('/payments/due/')
        
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data['success'])
        self.assertIn('results', response.data)
        self.assertIn('summary', response.data)
```

---

## 🚀 PART 10: Deployment & Configuration

### Step 16: Environment Variables

**Create `.env` file:**
```bash
# Django Settings
DEBUG=False
SECRET_KEY=your-super-secret-key-here
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ptf_db

# M-Pesa Configuration
MPESA_ENVIRONMENT=sandbox  # or 'production'
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_SHORT_CODE=174379  # Your business short code
MPESA_PASSKEY=your-mpesa-passkey
MPESA_CALLBACK_URL=https://your-domain.com/api/payments/webhooks/mpesa/callback/

# Flutterwave Configuration
FLUTTERWAVE_PUBLIC_KEY=your-flutterwave-public-key
FLUTTERWAVE_SECRET_KEY=your-flutterwave-secret-key
FLUTTERWAVE_ENVIRONMENT=sandbox  # or 'production'

# Redis for Celery
REDIS_URL=redis://localhost:6379/0

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
```

### Step 17: Production Settings

**Update `ptf/settings.py` for production:**
```python
import os
from decouple import config

# Security settings for production
if not config('DEBUG', default=True, cast=bool):
    SECURE_SSL_REDIRECT = True
    SECURE_BROWSER_XSS_FILTER = True
    SECURE_CONTENT_TYPE_NOSNIFF = True
    X_FRAME_OPTIONS = 'DENY'
    SECURE_HSTS_SECONDS = 31536000
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

# Email configuration
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = config('EMAIL_HOST', default='localhost')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
```

### Step 18: Deployment Commands

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Collect static files
python manage.py collectstatic --noinput

# 3. Run migrations
python manage.py migrate

# 4. Create superuser
python manage.py createsuperuser

# 5. Start Celery worker (in separate terminal)
celery -A ptf worker --loglevel=info

# 6. Start Celery beat (in separate terminal)
celery -A ptf beat --loglevel=info

# 7. Start Django server
python manage.py runserver 0.0.0.0:8000
```

---

## ✅ IMPLEMENTATION SUMMARY

### What You'll Have After Implementation:

1. **Complete Payment Infrastructure**
   - ✅ M-Pesa STK Push integration
   - ✅ Credit/Debit card processing (Flutterwave)
   - ✅ Manual payment recording (Cash, Bank Transfer, Cheque)
   - ✅ Real-time payment status verification

2. **Automated Business Processes**
   - ✅ Payment reminder system
   - ✅ Invoice and receipt generation
   - ✅ Membership renewal tracking
   - ✅ Overdue payment identification

3. **Comprehensive API Endpoints**
   - ✅ Payment processing endpoints
   - ✅ Payment history and analytics
   - ✅ Payments due and renewals due
   - ✅ Member payment tracking

4. **Background Task Processing**
   - ✅ Automated payment verification
   - ✅ Email notifications
   - ✅ PDF generation
   - ✅ Payment reminders

5. **Production-Ready Features**
   - ✅ Webhook handling for real-time updates
   - ✅ Comprehensive error handling
   - ✅ Logging and monitoring
   - ✅ Database transactions for data integrity

### Next Steps:
1. Set up M-Pesa and Flutterwave accounts
2. Configure webhook URLs
3. Test in sandbox environment
4. Deploy to production
5. Monitor and optimize

This backend implementation will seamlessly integrate with your existing frontend payment system and provide a robust, scalable payment infrastructure for Paul's Tropical Fitness.