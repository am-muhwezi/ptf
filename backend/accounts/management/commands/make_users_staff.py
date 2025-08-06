from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Make all existing users staff (but not superuser) for admin access'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def handle(self, *args, **options):
        # Get all users who are not staff and not superuser
        users_to_update = User.objects.filter(is_staff=False, is_superuser=False)
        
        self.stdout.write(
            self.style.SUCCESS(f'Found {users_to_update.count()} users to update')
        )
        
        if options['dry_run']:
            self.stdout.write(
                self.style.WARNING('DRY RUN - No changes will be made')
            )
            for user in users_to_update:
                self.stdout.write(f'Would make staff: {user.email} ({user.first_name} {user.last_name})')
        else:
            updated_count = users_to_update.update(is_staff=True)
            self.stdout.write(
                self.style.SUCCESS(f'Successfully updated {updated_count} users to staff status')
            )
            
            for user in users_to_update:
                self.stdout.write(f'Made staff: {user.email} ({user.first_name} {user.last_name})')
        
        self.stdout.write(
            self.style.SUCCESS('Command completed successfully!')
        )