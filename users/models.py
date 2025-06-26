from django.db import models

class User(models.Model):
    first_name= models.CharField(max_length=30)
    last_name= models.CharField(max_length=30)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    date_joined = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    ROLES=(
        ('admin','Adm'),
        ('trainer', 'Tra'),
        ('client','Cli'),
        ('carepartner','Cpt'),
    )

    role=models.CharField(max_length=3, choices=ROLES)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.role})"