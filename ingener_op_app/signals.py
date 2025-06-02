from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Contract
from django.contrib.auth import get_user_model

CustomUser = get_user_model()

@receiver(post_save, sender=Contract)
def activate_user_on_contract_creation(sender, instance, created, **kwargs):
    """
    Активує користувача, коли до інженера прикріплюється договір
    """
    if instance.client and hasattr(instance.client, 'user'):
        user = instance.client.user
        if not user.is_active:
            user.is_active = True
            user.save()