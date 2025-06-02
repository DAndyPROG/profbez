from django.db import models
from django.conf import settings

class IngenerInfo(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ingener_info', verbose_name='Користувач')
    company_name = models.CharField(max_length=255, unique=True, verbose_name='Назва компанії')
    code_edrpo = models.CharField(max_length=255, unique=True, verbose_name='Код ЄДРПОУ')
    is_new_registration = models.BooleanField(default=False, verbose_name='Новий користувач')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return self.company_name        
    
    class Meta:
        verbose_name = 'Інформація про інженера ОП'
        verbose_name_plural = 'Інформація про інженерів ОП'

class Contract(models.Model):
    contract_number = models.CharField(max_length=255, verbose_name='Номер договору', unique=True)
    contract_end_date = models.DateField(verbose_name='Дата закінчення договору')
    client = models.OneToOneField(IngenerInfo, on_delete=models.CASCADE, verbose_name='Клієнт')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата створення')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Дата оновлення')

    def __str__(self):
        return self.contract_number
    
    class Meta:
        verbose_name = 'Договір'
        verbose_name_plural = 'Договори'
    