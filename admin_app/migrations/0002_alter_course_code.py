# Generated by Django 5.2 on 2025-05-01 20:35

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_app', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='course',
            name='code',
            field=models.CharField(max_length=255, unique=True, verbose_name='Код курсу'),
        ),
    ]
