# Generated by Django 5.2 on 2025-05-02 09:01

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('ingener_op_app', '0006_ingenerinfo_students_count_and_more'),
        ('student_op_app', '0003_alter_studentcontract_contract'),
    ]

    operations = [
        migrations.AddField(
            model_name='studentinfo',
            name='client',
            field=models.ForeignKey(default=5, on_delete=django.db.models.deletion.PROTECT, related_name='students', to='ingener_op_app.ingenerinfo', verbose_name='Клієнт'),
            preserve_default=False,
        ),
        migrations.DeleteModel(
            name='StudentContract',
        ),
    ]
