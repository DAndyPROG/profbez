# Generated by Django 5.2 on 2025-06-01 19:29

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('student_op_app', '0014_test_start_time'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='education',
            name='last_score',
        ),
        migrations.AddField(
            model_name='education',
            name='average_score',
            field=models.PositiveIntegerField(default=0, verbose_name='Середня оцінка'),
        ),
    ]
