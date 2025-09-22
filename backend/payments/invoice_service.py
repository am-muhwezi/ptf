import uuid
from datetime import date, timedelta
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.conf import settings
from django.utils import timezone
from .models import Payment
from memberships.models import Membership


class InvoiceService:
    """Service for generating and managing invoices"""

    @staticmethod
    def generate_invoice_data(membership):
        """Generate invoice data for a membership"""
        try:
            # Calculate due date (30 days from membership start)
            due_date = membership.created_at.date() + timedelta(days=30)

            # Get latest payment or create pending one
            payment = Payment.objects.filter(membership=membership).first()
            if not payment:
                # Create a pending payment if none exists
                payment = Payment.objects.create(
                    membership=membership,
                    amount=membership.amount_paid,
                    status='pending',
                    purpose='membership_fee'
                )

            invoice_data = {
                'invoice_number': f"INV-{membership.member.id}-{timezone.now().strftime('%Y%m%d')}",
                'issue_date': date.today(),
                'due_date': due_date,
                'member': {
                    'id': membership.member.id,
                    'first_name': membership.member.first_name,
                    'last_name': membership.member.last_name,
                    'email': membership.member.email,
                    'phone': membership.member.phone,
                },
                'membership': {
                    'plan_type': membership.plan.plan_name,
                    'membership_type': membership.plan.membership_type,
                    'start_date': membership.created_at.date(),
                    'amount': float(membership.amount_paid),
                },
                'payment': {
                    'status': payment.status,
                    'amount_due': float(payment.amount),
                    'currency': payment.currency,
                },
                'gym_info': {
                    'name': "Paul's Tropical Fitness",
                    'address': "Your Gym Address",
                    'phone': "+254 XXX XXX XXX",
                    'email': "info@ptf.com",
                }
            }

            return invoice_data

        except Exception as e:
            raise Exception(f"Failed to generate invoice data: {str(e)}")

    @staticmethod
    def generate_invoice_html(invoice_data):
        """Generate HTML invoice template"""
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Invoice {invoice_data['invoice_number']}</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }}
                .invoice-container {{ max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
                .header {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; border-bottom: 2px solid #e5e5e5; padding-bottom: 20px; }}
                .logo {{ font-size: 24px; font-weight: bold; color: #2563eb; }}
                .invoice-info {{ text-align: right; }}
                .member-info {{ margin-bottom: 30px; }}
                .details-table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
                .details-table th, .details-table td {{ padding: 12px; text-align: left; border-bottom: 1px solid #e5e5e5; }}
                .details-table th {{ background-color: #f8f9fa; font-weight: 600; }}
                .total-section {{ text-align: right; margin-top: 20px; }}
                .total {{ font-size: 18px; font-weight: bold; color: #1f2937; }}
                .footer {{ margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #6b7280; }}
                .status-badge {{ padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }}
                .status-pending {{ background-color: #fef3c7; color: #d97706; }}
                .status-paid {{ background-color: #dcfce7; color: #16a34a; }}
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="header">
                    <div class="logo">{invoice_data['gym_info']['name']}</div>
                    <div class="invoice-info">
                        <h2>INVOICE</h2>
                        <p><strong>Invoice #:</strong> {invoice_data['invoice_number']}</p>
                        <p><strong>Date:</strong> {invoice_data['issue_date']}</p>
                        <p><strong>Due Date:</strong> {invoice_data['due_date']}</p>
                    </div>
                </div>

                <div class="member-info">
                    <h3>Bill To:</h3>
                    <p><strong>{invoice_data['member']['first_name']} {invoice_data['member']['last_name']}</strong></p>
                    <p>Member ID: {invoice_data['member']['id']}</p>
                    <p>Email: {invoice_data['member']['email']}</p>
                    <p>Phone: {invoice_data['member']['phone']}</p>
                </div>

                <table class="details-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Type</th>
                            <th>Period</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Membership Fee - {invoice_data['membership']['plan_type']}</td>
                            <td><span class="status-badge status-pending">{invoice_data['membership']['membership_type']}</span></td>
                            <td>From {invoice_data['membership']['start_date']}</td>
                            <td>{invoice_data['payment']['currency']} {invoice_data['payment']['amount_due']:,.2f}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="total-section">
                    <p class="total">Total Amount Due: {invoice_data['payment']['currency']} {invoice_data['payment']['amount_due']:,.2f}</p>
                    <p>Status: <span class="status-badge status-{invoice_data['payment']['status']}">{invoice_data['payment']['status'].title()}</span></p>
                </div>

                <div class="footer">
                    <p><strong>{invoice_data['gym_info']['name']}</strong></p>
                    <p>{invoice_data['gym_info']['address']}</p>
                    <p>Phone: {invoice_data['gym_info']['phone']} | Email: {invoice_data['gym_info']['email']}</p>
                    <p style="margin-top: 15px; font-size: 12px;">Thank you for choosing {invoice_data['gym_info']['name']}!</p>
                </div>
            </div>
        </body>
        </html>
        """
        return html_content

    @staticmethod
    def send_invoice_email(member_email, invoice_data, invoice_html):
        """Send invoice via email"""
        try:
            subject = f"Invoice {invoice_data['invoice_number']} - {invoice_data['gym_info']['name']}"

            # Plain text version
            message = f"""
            Dear {invoice_data['member']['first_name']} {invoice_data['member']['last_name']},

            Please find your membership invoice details below:

            Invoice Number: {invoice_data['invoice_number']}
            Due Date: {invoice_data['due_date']}
            Amount Due: {invoice_data['payment']['currency']} {invoice_data['payment']['amount_due']:,.2f}

            Membership Details:
            - Plan: {invoice_data['membership']['plan_type']}
            - Type: {invoice_data['membership']['membership_type']}
            - Member ID: {invoice_data['member']['id']}

            Please ensure payment is made by the due date to avoid any service interruption.

            Thank you for choosing {invoice_data['gym_info']['name']}!

            Best regards,
            {invoice_data['gym_info']['name']} Team
            """

            # Send email with HTML content
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[member_email],
                html_message=invoice_html,
                fail_silently=False,
            )

            return True

        except Exception as e:
            raise Exception(f"Failed to send invoice email: {str(e)}")

    @staticmethod
    def create_and_send_invoice(membership, send_email=True):
        """Generate and optionally send invoice for a membership"""
        try:
            # Generate invoice data
            invoice_data = InvoiceService.generate_invoice_data(membership)

            # Generate HTML
            invoice_html = InvoiceService.generate_invoice_html(invoice_data)

            result = {
                'success': True,
                'invoice_data': invoice_data,
                'invoice_html': invoice_html,
                'email_sent': False
            }

            # Send email if requested
            if send_email and invoice_data['member']['email']:
                InvoiceService.send_invoice_email(
                    invoice_data['member']['email'],
                    invoice_data,
                    invoice_html
                )
                result['email_sent'] = True

            return result

        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'invoice_data': None,
                'email_sent': False
            }

    @staticmethod
    def send_bulk_invoices(member_ids, send_email=True):
        """Send invoices to multiple members"""
        results = {
            'success': 0,
            'failed': 0,
            'errors': [],
            'details': []
        }

        try:
            memberships = Membership.objects.filter(member_id__in=member_ids)

            for membership in memberships:
                try:
                    result = InvoiceService.create_and_send_invoice(membership, send_email)

                    if result['success']:
                        results['success'] += 1
                        results['details'].append({
                            'member_id': membership.member.id,
                            'email': membership.member.email,
                            'status': 'sent' if result['email_sent'] else 'generated',
                            'invoice_number': result['invoice_data']['invoice_number']
                        })
                    else:
                        results['failed'] += 1
                        results['errors'].append({
                            'member_id': membership.member.id,
                            'error': result['error']
                        })

                except Exception as e:
                    results['failed'] += 1
                    results['errors'].append({
                        'member_id': membership.member_id,
                        'error': str(e)
                    })

            return results

        except Exception as e:
            return {
                'success': 0,
                'failed': len(member_ids),
                'errors': [{'general': str(e)}],
                'details': []
            }