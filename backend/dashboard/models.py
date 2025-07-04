from django.db import models
from django.utils import timezone

# Member model
class Member(models.Model):
    MEMBERSHIP_TYPES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
        ('both', 'Both'),
    ]
    
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20)
    membership_type = models.CharField(max_length=10, choices=MEMBERSHIP_TYPES)
    membership_start_date = models.DateField()
    membership_end_date = models.DateField()
    is_active = models.BooleanField(default=True)
    payment_due_date = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_renewal_due(self):
        """Check if membership renewal is due within 30 days"""
        return self.membership_end_date <= timezone.now().date() + timezone.timedelta(days=30)
    
    @property
    def is_payment_overdue(self):
        """Check if payment is overdue"""
        if self.payment_due_date:
            return self.payment_due_date < timezone.now().date()
        return False

# Booking model
class Booking(models.Model):
    SESSION_TYPES = [
        ('group', 'Group Session'),
        ('one_on_one', 'One-on-One Session'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    session_type = models.CharField(max_length=20, choices=SESSION_TYPES)
    session_date = models.DateTimeField()
    trainer_name = models.CharField(max_length=100, null=True, blank=True)
    is_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.member} - {self.session_type} on {self.session_date}"

# Trainer model
class Trainer(models.Model):
    name = models.CharField(max_length=100)
    specialization = models.CharField(max_length=100)
    is_available = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name

# Waitlist model
class Waitlist(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    session_type = models.CharField(max_length=20)
    preferred_date = models.DateTimeField()
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.member} - Waitlist for {self.session_type}"

# Attendance model
class Attendance(models.Model):
    VISIT_TYPES = [
        ('indoor', 'Indoor'),
        ('outdoor', 'Outdoor'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    visit_type = models.CharField(max_length=10, choices=VISIT_TYPES)
    check_in_time = models.DateTimeField(auto_now_add=True)
    check_out_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.member} - {self.visit_type} visit on {self.check_in_time.date()}"

# Feedback model
class Feedback(models.Model):
    FEEDBACK_TYPES = [
        ('complaint', 'Complaint'),
        ('suggestion', 'Suggestion'),
        ('compliment', 'Compliment'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Open'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]
    
    member = models.ForeignKey(Member, on_delete=models.CASCADE)
    feedback_type = models.CharField(max_length=20, choices=FEEDBACK_TYPES)
    subject = models.CharField(max_length=200)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='open')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.member} - {self.subject}"
    
    @property
    def resolution_time(self):
        """Calculate resolution time in days"""
        if self.resolved_at:
            return (self.resolved_at - self.created_at).days
        return None

# Inventory model
class InventoryItem(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    quantity = models.IntegerField(default=0)
    min_stock_level = models.IntegerField(default=10)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    @property
    def is_low_stock(self):
        """Check if item is low on stock"""
        return self.quantity <= self.min_stock_level

# Notification model
class Notification(models.Model):
    NOTIFICATION_TYPES = [
        ('info', 'Information'),
        ('warning', 'Warning'),
        ('success', 'Success'),
        ('error', 'Error'),
    ]
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, default='info')
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.title
    
    class Meta:
        ordering = ['-created_at']