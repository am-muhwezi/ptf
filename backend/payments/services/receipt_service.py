from datetime import datetime
from django.template.loader import render_to_string
from django.conf import settings
import uuid
import os
from ..models import Payment


class ReceiptService:
    """Receipt generation service for payments"""
    
    @staticmethod
    def generate_receipt_number():
        """Generate unique receipt number"""
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        unique_id = str(uuid.uuid4())[:8].upper()
        return f"RCP-{timestamp}-{unique_id}"
    
    @staticmethod
    def generate_receipt_data(payment):
        """Generate receipt data for a payment"""
        try:
            membership = payment.membership
            member = membership.member
            
            receipt_data = {
                'receipt_number': ReceiptService.generate_receipt_number(),
                'payment_id': str(payment.payment_id),
                'date_issued': datetime.now().strftime('%B %d, %Y'),
                'time_issued': datetime.now().strftime('%I:%M %p'),
                
                # Business Information
                'business': {
                    'name': "Paul's Tropical Fitness",
                    'address': "Nairobi, Kenya",
                    'phone': "+254 700 123 456",
                    'email': "info@paulstropicalfitness.fit",
                    'website': "www.paulstropicalfitness.fit"
                },
                
                # Member Information
                'member': {
                    'name': f"{member.first_name} {member.last_name}",
                    'id': member.id,
                    'email': member.email,
                    'phone': member.phone,
                },
                
                # Membership Information
                'membership': {
                    'plan_name': membership.plan.plan_name,
                    'membership_type': membership.plan.membership_type,
                    'start_date': membership.start_date.strftime('%B %d, %Y'),
                    'end_date': membership.end_date.strftime('%B %d, %Y'),
                    'sessions_allowed': membership.total_sessions_allowed,
                    'sessions_used': membership.sessions_used,
                    'sessions_remaining': membership.sessions_remaining
                },
                
                # Payment Information
                'payment': {
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                    'method': payment.payment_method.name if payment.payment_method else 'Unknown',
                    'purpose': payment.get_purpose_display(),
                    'reference': payment.external_reference or 'N/A',
                    'status': payment.get_status_display(),
                    'date': payment.initiated_at.strftime('%B %d, %Y'),
                    'time': payment.initiated_at.strftime('%I:%M %p'),
                    'notes': payment.notes or ''
                },
                
                # Totals
                'subtotal': str(payment.amount),
                'tax': '0.00',  # Add tax calculation if needed
                'total': str(payment.amount),
                'amount_paid': str(payment.amount),
                'balance': '0.00'
            }
            
            return receipt_data, None
            
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def generate_receipt_html(payment):
        """Generate HTML receipt"""
        try:
            receipt_data, error = ReceiptService.generate_receipt_data(payment)
            if error:
                return None, error
            
            # Simple HTML receipt template
            html_template = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Payment Receipt - {{ receipt_data.receipt_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px; }
        .business-name { font-size: 24px; font-weight: bold; color: #2c5530; }
        .receipt-info { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .member-info, .payment-info { background: #f5f5f5; padding: 15px; border-radius: 5px; }
        .section-title { font-weight: bold; color: #333; margin-bottom: 10px; }
        .amount { font-size: 20px; font-weight: bold; color: #2c5530; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 12px; color: #666; }
        .status { padding: 5px 10px; border-radius: 3px; font-weight: bold; }
        .status.completed { background-color: #d4edda; color: #155724; }
        .membership-details { margin: 15px 0; }
        .membership-details table { width: 100%; border-collapse: collapse; }
        .membership-details td { padding: 8px; border-bottom: 1px solid #eee; }
        .membership-details td:first-child { font-weight: bold; color: #555; }
        .thank-you { background: #e8f5e8; padding: 15px; margin: 20px 0; text-align: center; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <div class="business-name">{{ receipt_data.business.name }}</div>
        <div>{{ receipt_data.business.address }}</div>
        <div>Phone: {{ receipt_data.business.phone }} | Email: {{ receipt_data.business.email }}</div>
    </div>

    <div class="receipt-info">
        <div>
            <strong>Receipt #:</strong> {{ receipt_data.receipt_number }}<br>
            <strong>Date:</strong> {{ receipt_data.date_issued }}<br>
            <strong>Time:</strong> {{ receipt_data.time_issued }}
        </div>
        <div>
            <strong>Payment ID:</strong> {{ receipt_data.payment_id }}<br>
            <strong>Status:</strong> <span class="status completed">{{ receipt_data.payment.status }}</span>
        </div>
    </div>

    <div style="display: flex; gap: 20px; margin-bottom: 20px;">
        <div class="member-info" style="flex: 1;">
            <div class="section-title">Member Information</div>
            <strong>{{ receipt_data.member.name }}</strong><br>
            Member ID: {{ receipt_data.member.id }}<br>
            Email: {{ receipt_data.member.email }}<br>
            Phone: {{ receipt_data.member.phone }}
        </div>
        
        <div class="payment-info" style="flex: 1;">
            <div class="section-title">Payment Details</div>
            <strong>Method:</strong> {{ receipt_data.payment.method }}<br>
            <strong>Reference:</strong> {{ receipt_data.payment.reference }}<br>
            <strong>Purpose:</strong> {{ receipt_data.payment.purpose }}<br>
            <strong>Date:</strong> {{ receipt_data.payment.date }}
        </div>
    </div>

    <div class="membership-details">
        <div class="section-title">Membership Details</div>
        <table>
            <tr>
                <td>Plan:</td>
                <td>{{ receipt_data.membership.plan_name }}</td>
            </tr>
            <tr>
                <td>Type:</td>
                <td>{{ receipt_data.membership.membership_type|title }}</td>
            </tr>
            <tr>
                <td>Period:</td>
                <td>{{ receipt_data.membership.start_date }} - {{ receipt_data.membership.end_date }}</td>
            </tr>
            <tr>
                <td>Sessions:</td>
                <td>{{ receipt_data.membership.sessions_used }}/{{ receipt_data.membership.sessions_allowed }} used ({{ receipt_data.membership.sessions_remaining }} remaining)</td>
            </tr>
        </table>
    </div>

    <div style="background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Subtotal:</span>
            <span>{{ receipt_data.currency }} {{ receipt_data.subtotal }}</span>
        </div>
        <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
            <span>Tax:</span>
            <span>{{ receipt_data.currency }} {{ receipt_data.tax }}</span>
        </div>
        <hr>
        <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>Total Paid:</span>
            <span class="amount">{{ receipt_data.currency }} {{ receipt_data.total }}</span>
        </div>
    </div>

    {% if receipt_data.payment.notes %}
    <div style="margin: 20px 0;">
        <div class="section-title">Notes</div>
        <div style="background: #fff3cd; padding: 10px; border-radius: 3px;">
            {{ receipt_data.payment.notes }}
        </div>
    </div>
    {% endif %}

    <div class="thank-you">
        <strong>Thank you for your payment!</strong><br>
        Keep this receipt for your records.
    </div>

    <div class="footer">
        This is an official receipt from {{ receipt_data.business.name }}<br>
        Generated on {{ receipt_data.date_issued }} at {{ receipt_data.time_issued }}<br>
        Visit us at {{ receipt_data.business.website }}
    </div>
</body>
</html>
            """
            
            # Use Django's template system
            from django.template import Template, Context
            template = Template(html_template)
            context = Context({'receipt_data': receipt_data})
            html_content = template.render(context)
            
            return html_content, receipt_data['receipt_number']
            
        except Exception as e:
            return None, str(e)
    
    @staticmethod
    def generate_receipt_for_payment(payment_id):
        """Generate receipt for a payment"""
        try:
            payment = Payment.objects.get(payment_id=payment_id)
            
            # Only generate receipts for completed payments
            if payment.status != 'completed':
                return None, None, "Receipt can only be generated for completed payments"
            
            html_content, receipt_number = ReceiptService.generate_receipt_html(payment)
            
            if html_content is None:
                return None, None, receipt_number  # receipt_number contains error message
            
            return html_content, receipt_number, None
            
        except Payment.DoesNotExist:
            return None, None, "Payment not found"
        except Exception as e:
            return None, None, str(e)