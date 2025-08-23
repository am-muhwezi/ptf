from django.core.management.base import BaseCommand
from payments.models import PaymentMethod


class Command(BaseCommand):
    help = 'Create default payment methods'

    def handle(self, *args, **options):
        payment_methods = [
            {'name': 'M-Pesa', 'payment_type': 'mpesa'},
            {'name': 'Credit/Debit Card', 'payment_type': 'card'},
            {'name': 'Bank Transfer', 'payment_type': 'bank_transfer'},
            {'name': 'Cash', 'payment_type': 'cash'},
            {'name': 'Cheque', 'payment_type': 'cash'},  # Using cash type for manual processing
        ]
        
        created_count = 0
        for method_data in payment_methods:
            payment_method, created = PaymentMethod.objects.get_or_create(
                name=method_data['name'],
                defaults={
                    'payment_type': method_data['payment_type'],
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Created payment method: {payment_method.name}')
                )
            else:
                self.stdout.write(f'Payment method already exists: {payment_method.name}')
        
        self.stdout.write(
            self.style.SUCCESS(f'Successfully created {created_count} payment methods')
        )