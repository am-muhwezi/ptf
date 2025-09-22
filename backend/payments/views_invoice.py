from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from accounts.permissions import IsAdminPermission
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from memberships.models import Membership
from .invoice_service import InvoiceService
import json


@api_view(['POST'])
def send_invoice(request, member_id):
    """Send invoice to a specific member"""
    try:
        # Get membership
        membership = get_object_or_404(Membership, member__id=member_id)

        # Get options from request body
        data = request.data
        send_email = data.get('send_email', True)
        message = data.get('message', '')
        urgency = data.get('urgency', 'normal')

        # Generate and send invoice
        result = InvoiceService.create_and_send_invoice(membership, send_email)

        if result['success']:
            response_data = {
                'success': True,
                'message': 'Invoice generated successfully',
                'invoice_number': result['invoice_data']['invoice_number'],
                'email_sent': result['email_sent'],
                'member': {
                    'id': membership.member_id,
                    'name': f"{membership.member.first_name} {membership.member.last_name}",
                    'email': membership.member.email
                }
            }

            # Add custom message to response if provided
            if message:
                response_data['custom_message'] = message

            return Response(response_data, status=status.HTTP_200_OK)

        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Membership.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Member not found'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def send_bulk_invoices(request):
    """Send invoices to multiple members"""
    try:
        data = request.data
        member_ids = data.get('member_ids', [])
        send_email = data.get('send_email', True)
        message = data.get('message', '')
        urgency = data.get('urgency', 'normal')

        if not member_ids:
            return Response({
                'success': False,
                'error': 'No member IDs provided'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Send bulk invoices
        results = InvoiceService.send_bulk_invoices(member_ids, send_email)

        response_data = {
            'success': True,
            'message': f'Bulk invoice operation completed',
            'summary': {
                'total_attempted': len(member_ids),
                'successful': results['success'],
                'failed': results['failed']
            },
            'details': results['details'],
            'errors': results['errors']
        }

        # Add custom message to response if provided
        if message:
            response_data['custom_message'] = message

        return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def preview_invoice(request, member_id):
    """Preview invoice for a member without sending"""
    try:
        # Get membership
        membership = get_object_or_404(Membership, member__id=member_id)

        # Generate invoice data only (don't send email)
        result = InvoiceService.create_and_send_invoice(membership, send_email=False)

        if result['success']:
            return Response({
                'success': True,
                'invoice_data': result['invoice_data'],
                'member': {
                    'id': membership.member_id,
                    'name': f"{membership.member.first_name} {membership.member.last_name}",
                    'email': membership.member.email
                }
            }, status=status.HTTP_200_OK)

        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Membership.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Member not found'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAdminPermission])
def download_invoice(request, member_id):
    """Download invoice as HTML file"""
    try:
        # Get membership
        membership = get_object_or_404(Membership, member__id=member_id)

        # Generate invoice HTML
        result = InvoiceService.create_and_send_invoice(membership, send_email=False)

        if result['success']:
            invoice_html = result['invoice_html']
            invoice_number = result['invoice_data']['invoice_number']

            # Create HTTP response with HTML content
            response = HttpResponse(invoice_html, content_type='text/html')
            response['Content-Disposition'] = f'attachment; filename="invoice_{invoice_number}.html"'

            return response

        else:
            return Response({
                'success': False,
                'error': result['error']
            }, status=status.HTTP_400_BAD_REQUEST)

    except Membership.DoesNotExist:
        return Response({
            'success': False,
            'error': 'Member not found'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)