from django.contrib import admin
from .models import StudentInfo, Education, Test, StudentAnswer, Question, Answer

admin.site.register(StudentInfo)
admin.site.register(Education)
admin.site.register(Test)
admin.site.register(StudentAnswer)
admin.site.register(Question)
admin.site.register(Answer)
