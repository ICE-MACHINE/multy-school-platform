# توثيق APIs — منصة متعددة المدارس

## ملاحظات عامة

### Base URL
```
/api
```

### نظام الاستجابة الموحد

**استجابة ناجحة:**
```json
{
  "success": true,
  "data": { ... }
}
```

**استجابة مُصفّاة:**
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

**استجابة خطأ:**
```json
{
  "success": false,
  "message": "وصف الخطأ"
}
```

### المصادقة
```
Authorization: Bearer <accessToken>
```

### التوكنات المخزنة في localStorage
| السياق | مفتاح الوصول | مفتاح التجديد |
|--------|-------------|--------------|
| مسؤول عام | `superAdmin_accessToken` | `superAdmin_refreshToken` |
| أي دور آخر | `{schoolSlug}_accessToken` | `{schoolSlug}_refreshToken` |

---

## 1. authService — المصادقة

### تسجيل دخول المسؤول العام
```
POST /api/auth/super-admin/login
```
**الطلب:**
```json
{
  "phone": "0555000000",
  "password": "password"
}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "accessToken": "...",
    "refreshToken": "...",
    "user": { "id": "...", "role": "super_admin", "firstName": "...", "lastName": "..." }
  }
}
```
**الأذونات:** عام (GuestGuard)

---

### تسجيل دخول مدرسة
```
POST /api/auth/school/{schoolId}/login
```
**الطلب:**
```json
{
  "phone": "0555000000",
  "password": "password"
}
```
**الاستجابة:** مماثلة لمسؤول عام مع `role` يطابق الدور (school_admin, teacher, parent)
**الأذونات:** عام (GuestGuard)

---

### تجديد التوكن
```
POST /api/auth/refresh
```
**الطلب:**
```json
{
  "refreshToken": "..."
}
```
**الاستجابة:** مماثلة لتسجيل الدخول

---

### جلب المستخدم الحالي
```
GET /api/auth/me
```
**الأذونات:** أي مستخدم مسجّل الدخول

---

### تسجيل الخروج
```
POST /api/auth/logout
```
**الأذونات:** أي مستخدم مسجّل الدخول

---

### تحديث الملف الشخصي
```
PUT /api/auth/update-profile
```
**الطلب:**
```json
{
  "firstName": "أحمد",
  "lastName": "محمد",
  "phone": "0555000000",
  "currentPassword": "القديمة",
  "newPassword": "الجديدة"
}
```
**ملاحظة:** كلمة المرور اختيارية فقط عند تغييرها

---

### إعادة تعيين كلمة المرور
```
POST /api/auth/reset-password
```
**الطلب:**
```json
{
  "userId": "...",
  "role": "teacher",
  "newPassword": "newpass123"
}
```
**الأذونات:** مسؤول عام أو مدير مدرسة

---

## 2. schoolService — المدارس

### إنشاء مدرسة
```
POST /api/schools
```
**الطلب:**
```json
{
  "name": "مدرسة النور",
  "phone": "0555000000",
  "type": "quranic",
  "address": "شارع الرئيسي",
  "adminFirstName": "مدير",
  "adminLastName": "المدرسة",
  "adminPhone": "0555000001",
  "adminPassword": "pass123",
  "maxUsers": 50,
  "maxMessages": 5000
}
```
**الأذونات:** مسؤول عام

---

### جلب جميع المدارس
```
GET /api/schools?page=1&limit=10&search=...
```
**الأذونات:** مسؤول عام

---

### جلب مدرسة بالـ ID
```
GET /api/schools/{schoolId}
```
**الأذونات:** مسؤول عام

---

### جلب مدرسة بالـ Slug
```
GET /api/schools/slug/{slug}
```
**الأذونات:** مسؤول عام

---

### جلب مدرسة عامة (بدون مصادقة)
```
GET /api/public/schools/{slug}
```
**الأذونات:** عام

---

### تعديل مدرسة
```
PUT /api/schools/{schoolId}
```
**الطلب:**
```json
{
  "name": "الاسم الجديد",
  "phone": "0555000000",
  "address": "العنوان",
  "maxUsers": 100,
  "maxMessages": 10000
}
```
**الأذونات:** مسؤول عام

---

### تجميد مدرسة
```
PATCH /api/schools/{schoolId}/freeze
```
**الأذونات:** مسؤول عام

---

### إلغاء تجميد مدرسة
```
PATCH /api/schools/{schoolId}/unfreeze
```
**الأذونات:** مسؤول عام

---

### حذف مدرسة
```
DELETE /api/schools/{schoolId}
```
**الأذونات:** مسؤول عام

---

### مسح رسائل المدرسة
```
DELETE /api/schools/{schoolId}/messages?count=100
```
**الأذونات:** مسؤول عام

---

### إحصائيات المدرسة (admin)
```
GET /api/schools/{schoolId}/stats
```
**الأذونات:** مسؤول عام أو مدير مدرسة

---

### جلب مدير المدرسة
```
GET /api/super-admin/schools/{schoolId}/admin
```
**الأذونات:** مسؤول عام

---

### إعدادات المدرسة
```
PUT /api/{schoolId}/admin/settings
```
**الطلب:**
```json
{
  "monthlyFee": 5000
}
```
**الأذونات:** مدير مدرسة

---

## 3. studentService — التلاميذ

### إنشاء تلميذ
```
POST /api/{schoolId}/admin/students
```
**الطلب:**
```json
{
  "firstName": "أحمد",
  "lastName": "بن علي",
  "dateOfBirth": "2010-05-15",
  "gender": "male",
  "phone": "0555000000",
  "parentPhone": "0555000001",
  "classroomId": "...",
  "registrationNumber": "STU-001",
  "placeOfResidence": "الجزائر"
}
```
**الأذونات:**مدير مدرسة

---

### جلب جميع التلاميذ
```
GET /api/{schoolId}/admin/students?page=1&limit=10&search=&gender=&classroomId=&courseId=&paymentStatus=
```
**الاستجابة المصفّاة:**
```json
{
  "success": true,
  "data": [{ "id": "...", "firstName": "...", "lastName": "...", "classroom": {...}, ... }],
  "pagination": { "total": 50, "page": 1, "limit": 10, "totalPages": 5 }
}
```
**الأذونات:** مدير مدرسة

---

### جلب تلميذ بالـ ID
```
GET /api/{schoolId}/admin/students/{studentId}
```
**الأذونات:** مدير مدرسة

---

### تعديل تلميذ
```
PUT /api/{schoolId}/admin/students/{studentId}
```
**الطلب:** مماثل لإنشاء مع أي حقل قابل للتعديل
**الأذونات:** مدير مدرسة

---

### حذف تلميذ
```
DELETE /api/{schoolId}/admin/students/{studentId}
```
**الأذونات:** مدير مدرسة

---

### معاينة الحذف
```
GET /api/{schoolId}/admin/students/{studentId}/delete-preview
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "student": { "id": "...", "firstName": "..." },
    "payments": [{ "id": "...", "amount": 5000, "month": "2024-01" }],
    "attendance": 45,
    "courses": [{ "id": "...", "name": "..." }]
  }
}
```
**الأذونات:** مدير مدرسة

---

### تعيين قسم للتلميذ
```
POST /api/{schoolId}/admin/students/{studentId}/assign-classroom
```
**الطلب:**
```json
{
  "classroomId": "..."
}
```
**الأذونات:** مدير مدرسة

---

### تبديل حالة الإعفاء
```
PATCH /api/{schoolId}/students/{studentId}/exemption
```
**الأذونات:** مدير مدرسة

---

### جلب تقدم الدورات
```
GET /api/{schoolId}/students/{studentId}/course-progress
```
**الاستجابة:**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "name": "دورة القرآن",
    "modules": [{ "id": "...", "title": "الوحدة 1", "lessons": [...] }],
    "ungroupedLessons": [...],
    "totalSessions": 20
  }]
}
```
**الأذونات:** مدير مدرسة

---

## 4. teacherManagementService — المعلمين (مدير)

### جلب جميع المعلمين
```
GET /api/{schoolId}/admin/teachers?page=1&limit=10&search=
```
**الأذونات:** مدير مدرسة

---

### جلب معلم بالـ ID
```
GET /api/{schoolId}/admin/teachers/{teacherId}
```
**الأذونات:** مدير مدرسة

---

### إنشاء معلم
```
POST /api/{schoolId}/admin/teachers
```
**الطلب:**
```json
{
  "firstName": "محمد",
  "lastName": "أحمد",
  "phone": "0555000000",
  "password": "pass123",
  "gender": "male",
  "dateOfBirth": "1990-01-01"
}
```
**الأذونات:** مدير مدرسة

---

### تعديل معلم
```
PUT /api/{schoolId}/admin/teachers/{teacherId}
```
**الأذونات:** مدير مدرسة

---

### حذف معلم
```
DELETE /api/{schoolId}/admin/teachers/{teacherId}
```
**الأذونات:** مدير مدرسة

---

## 5. teacherService — المعلم (لنفسه)

### جلب تلاميذ المعلم
```
GET /api/{schoolId}/teacher/students
```
**الأذونات:** معلم

---

### جلب تلميذ بالـ ID
```
GET /api/{schoolId}/teacher/students/{studentId}
```
**الأذونات:** معلم

---

## 6. parentService — أولياء الأمور

### إنشاء ولي أمر
```
POST /api/{schoolId}/admin/parents
```
**الطلب:**
```json
{
  "firstName": "عبدالله",
  "lastName": "بن عمر",
  "phone": "0555000000",
  "password": "pass123",
  "gender": "male",
  "placeOfResidence": "الجزائر",
  "childIds": ["student-id-1", "student-id-2"]
}
```
**الأذونات:** مدير مدرسة

---

### جلب جميع أولياء الأمور
```
GET /api/{schoolId}/admin/parents?page=1&limit=10&search=
```
**الأذونات:** مدير مدرسة

---

### جلب ولي أمر بالـ ID
```
GET /api/{schoolId}/admin/parents/{parentId}
```
**الأذونات:** مدير مدرسة

---

### تعديل ولي أمر
```
PUT /api/{schoolId}/admin/parents/{parentId}
```
**الأذونات:** مدير مدرسة

---

### حذف ولي أمر
```
DELETE /api/{schoolId}/admin/parents/{parentId}
```
**الأذونات:** مدير مدرسة

---

### معاينة الحذف
```
GET /api/{schoolId}/admin/parents/{parentId}/delete-preview
```
**الأذونات:** مدير مدرسة

---

### جلب أطفال ولي الأمر
```
GET /api/{schoolId}/parent/children
```
**الأذونات:** ولي أمر

---

### جلب تقدم طفل
```
GET /api/{schoolId}/parent/children/{studentId}/progress
```
**الأذونات:** ولي أمر (الطفل مرتبط به)

---

## 7. classroomService — الأقسام

### جلب جميع الأقسام
```
GET /api/{schoolId}/classrooms
```
**الأذونات:** مدير مدرسة

---

### جلب قسم بالـ ID
```
GET /api/{schoolId}/classrooms/{id}
```
**الأذونات:** مدير مدرسة

---

### إنشاء قسم
```
POST /api/{schoolId}/classrooms
```
**الطلب:**
```json
{
  "name": "القسم الأول",
  "capacity": 30
}
```
**الأذونات:** مدير مدرسة

---

### تعديل قسم
```
PUT /api/{schoolId}/classrooms/{id}
```
**الأذونات:** مدير مدرسة

---

### حذف قسم
```
DELETE /api/{schoolId}/classrooms/{id}
```
**الأذونات:** مدير مدرسة

---

### تعيين معلم للقسم
```
PUT /api/{schoolId}/classrooms/{id}/assign-teacher
```
**الطلب:**
```json
{
  "teacherId": "..."
}
```
**الأذونات:** مدير مدرسة

---

## 8. courseService — الدورات

### جلب جميع الدورات
```
GET /api/{schoolId}/courses?page=1&limit=10
```
**الأذونات:** مدير مدرسة / معلم (دوراته فقط)

---

### جلب دورة بالـ ID
```
GET /api/{schoolId}/courses/{id}
```
**الأذونات:** مدير مدرسة / معلم

---

### إنشاء دورة
```
POST /api/{schoolId}/courses
```
**الطلب:**
```json
{
  "name": "دورة القرآن الكريم",
  "teacherId": "...",
  "hasMonthOption": true,
  "pricePerMonth": 5000,
  "hasSessionOption": false,
  "pricePerSession": null,
  "hasCourseOption": false,
  "pricePerCourse": null,
  "numberOfSessions": 20,
  "startDate": "2024-09-01"
}
```
**أنواع التسعير:** يمكن تفعيل أكثر من خيار
| النوع | الحقول |
|-------|--------|
| شهري | `hasMonthOption: true`, `pricePerMonth` |
| بالحصة | `hasSessionOption: true`, `pricePerSession`, `numberOfSessions` |
| بالدورة | `hasCourseOption: true`, `pricePerCourse` |

**الأذونات:** مدير مدرسة

---

### تعديل دورة
```
PUT /api/{schoolId}/courses/{id}
```
**الأذونات:** مدير مدرسة

---

### حذف دورة
```
DELETE /api/{schoolId}/courses/{id}
```
**الأذونات:** مدير مدرسة

---

### تسجيل تلميذ في دورة
```
POST /api/{schoolId}/courses/{courseId}/enroll
```
**الطلب:**
```json
{
  "studentId": "..."
}
```
**الأذونات:** مدير مدرسة

---

### إلغاء تسجيل تلميذ من دورة
```
DELETE /api/{schoolId}/courses/{courseId}/unenroll/{studentId}?refund=true
```
**الاستعلام:** `refund` (اختياري) — إذا `true` يُسترد الدفع
**الأذونات:** مدير مدرسة

---

### معاينة إلغاء التسجيل
```
GET /api/{schoolId}/courses/{courseId}/unenroll-preview/{studentId}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "student": { "id": "...", "firstName": "..." },
    "course": { "id": "...", "name": "..." },
    "payments": [{ "id": "...", "amount": 5000 }],
    "attendance": 15
  }
}
```
**الأذونات:** مدير مدرسة

---

### جلب التلاميذ المسجلين
```
GET /api/{schoolId}/courses/{courseId}/students
```
**الأذونات:** مدير مدرسة / معلم

---

## 9. courseSessionService — الحصص

### جلب حصص الدورة
```
GET /api/{schoolId}/courses/{courseId}/sessions
```
**الأذونات:** مدير مدرسة / معلم

---

### إتمام حصة
```
POST /api/{schoolId}/courses/{courseId}/sessions
```
**الطلب:**
```json
{
  "sessionNumber": 1,
  "completedAt": "2024-09-15",
  "period": "morning",
  "lessonIds": ["lesson-1", "lesson-2"]
}
```
**الأذونات:** معلم الدورة

---

### تعديل حصة
```
PUT /api/{schoolId}/courses/{courseId}/sessions/{sessionNumber}
```
**الطلب:** جزئي (أي حقل فقط)
**الأذونات:** معلم الدورة

---

### حذف (إلغاء) حصة
```
DELETE /api/{schoolId}/courses/{courseId}/sessions/{sessionNumber}
```
**ملاحظة:** يحذف أيضاً سجلات الحضور المرتبطة
**الأذونات:** معلم الدورة

---

## 10. courseAttendanceService — حضور الدورات

### جلب سجل الحضور (فلاتر)
```
GET /api/{schoolId}/courses/{courseId}/attendance?date=2024-09-15&isAbsent=true&justified=true&page=1&limit=20
```
**الفلاتر المتاحة:**
| الفلتر | النوع | الوصف |
|--------|-------|-------|
| `date` | string | تاريخ محدد |
| `from` | string | تاريخ بداية |
| `to` | string | تاريخ نهاية |
| `isAbsent` | "true"/"false" | حالة الغياب |
| `justified` | "true"/"false" | حالة التبرير |
| `search` | string | بحث بالاسم |

**الأذونات:** مدير مدرسة / معلم

---

### ملخص الحضور
```
GET /api/{schoolId}/courses/{courseId}/attendance/summary?date=2024-09-15
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalRecords": 25,
    "presentCount": 22,
    "absentCount": 3,
    "justifiedAbsences": 1,
    "unjustifiedAbsences": 2,
    "attendanceRate": 88
  }
}
```
**الأذونات:** مدير مدرسة / معلم

---

### جلب حضور حصة محددة
```
GET /api/{schoolId}/courses/{courseId}/attendance/sessions/{sessionNumber}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "date": "2024-09-15",
    "sessionNumber": 1,
    "lessons": [{ "id": "...", "title": "الدرس الأول" }],
    "attendance": [{
      "studentId": "...",
      "student": { "firstName": "أحمد", "lastName": "بن علي", "registrationNumber": "STU-001" },
      "isAbsent": false,
      "justified": false,
      "justification": null
    }]
  }
}
```
**الأذونات:** معلم الدورة

---

### تسجيل حضور جماعي
```
POST /api/{schoolId}/courses/{courseId}/attendance/bulk
```
**الطلب:**
```json
{
  "sessionNumber": 1,
  "records": [
    { "studentId": "...", "isAbsent": false },
    { "studentId": "...", "isAbsent": true }
  ]
}
```
**الأذونات:** معلم الدورة

---

### تسجيل/تحديث حضور (upsert)
```
POST /api/{schoolId}/courses/{courseId}/attendance
```
**الطلب:**
```json
{
  "sessionNumber": 1,
  "studentId": "...",
  "isAbsent": false
}
```
**الأذونات:** معلم الدورة

---

### تعديل حضور
```
PUT /api/{schoolId}/courses/{courseId}/attendance/{attendanceId}
```
**الطلب:** جزئي — `isAbsent` و/أو `justification`
**الأذونات:** مدير مدرسة / معلم

---

### تبرير غياب
```
PATCH /api/{schoolId}/courses/{courseId}/attendance/{attendanceId}/justify
```
**الطلب:**
```json
{
  "justification": " illness "
}
```
**الأذونات:** مدير مدرسة / معلم

---

### حذف سجل حضور
```
DELETE /api/{schoolId}/courses/{courseId}/attendance/{attendanceId}
```
**الأذونات:** مدير مدرسة

---

### جلب حضور تلميذ
```
GET /api/{schoolId}/course-attendance/student/{studentId}?month=2024-09
```
**الأذونات:** ولي أمر / مدير مدرسة / معلم

---

### تفاصيل حضور تلميذ في دورة
```
GET /api/{schoolId}/course-attendance/student/{studentId}/course/{courseId}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "course": { "id": "...", "name": "...", "teacherId": "..." },
    "student": { "id": "...", "firstName": "...", "lastName": "...", "registrationNumber": "..." },
    "sessions": [{
      "sessionNumber": 1,
      "date": "2024-09-15",
      "period": "morning",
      "lessons": [{ "id": "...", "title": "..." }],
      "attendance": { "isAbsent": false, "justified": false, "justification": null }
    }],
    "summary": {
      "totalSessions": 20,
      "presentDays": 18,
      "absentDays": 2,
      "justifiedAbsences": 1,
      "unjustifiedAbsences": 1,
      "attendanceRate": 90
    }
  }
}
```
**الأذونات:** ولي أمر / مدير مدرسة

---

## 11. attendanceService — الحضور العام

### جلب سجلات الحضور
```
GET /api/{schoolId}/attendance?date=2024-09-15&period=morning&isAbsent=true&justified=true&search=...&page=1&limit=20
```
**الفلاتر:**
| الفلتر | الوصف |
|--------|-------|
| `date` | تاريخ محدد |
| `from` / `to` | نطاق تواريخ |
| `period` | صباحية / مسائية |
| `isAbsent` | حالة الغياب |
| `justified` | حالة التبرير |
| `search` | بحث بالاسم |
| `studentId` | تلميذ محدد |

**الأذونات:** مدير مدرسة

---

### ملخص الحضور
```
GET /api/{schoolId}/attendance/summary?from=...&to=...&period=...
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalRecords": 100,
    "presentCount": 85,
    "absentCount": 15,
    "justifiedAbsences": 5,
    "unjustifiedAbsences": 10,
    "attendanceRate": 85
  }
}
```
**الأذونات:** مدير مدرسة

---

### حضور تلميذ
```
GET /api/{schoolId}/attendance/student/{studentId}?month=2024-09
```
**الأذونات:** ولي أمر / مدير مدرسة

---

### عدد الغيابات
```
GET /api/{schoolId}/attendance/absences/counts?month=2024-09
```
**الاستجابة:**
```json
{
  "success": true,
  "data": [
    { "studentId": "...", "totalAbsences": 5, "unjustifiedAbsences": 3 }
  ]
}
```
**الأذونات:** مدير مدرسة

---

### إنشاء سجل حضور
```
POST /api/{schoolId}/attendance
```
**الطلب:**
```json
{
  "studentId": "...",
  "date": "2024-09-15",
  "period": "morning",
  "isAbsent": false
}
```
**الأذونات:** مدير مدرسة

---

### إنشاء جماعي
```
POST /api/{schoolId}/attendance/bulk
```
**الطلب:**
```json
{
  "date": "2024-09-15",
  "period": "morning",
  "records": [
    { "studentId": "...", "isAbsent": false },
    { "studentId": "...", "isAbsent": true }
  ]
}
```
**الأذونات:** مدير مدرسة

---

### تعديل
```
PUT /api/{schoolId}/attendance/{id}
```
**الأذونات:** مدير مدرسة

---

### تبرير
```
PATCH /api/{schoolId}/attendance/{id}/justify
```
**الطلب:**
```json
{
  "justification": "مرض"
}
```
**الأذونات:** مدير مدرسة

---

### حذف
```
DELETE /api/{schoolId}/attendance/{id}
```
**الأذونات:** مدير مدرسة

---

## 12. paymentService — المدفوعات

### جلب جميع المدفوعات
```
GET /api/{schoolId}/payments?page=1&limit=10&month=2024-09&studentId=...
```
**الأذونات:** مدير مدرسة

---

### مدفوعات تلميذ
```
GET /api/{schoolId}/payments/student/{studentId}
```
**الأذونات:** مدير مدرسة / ولي أمر

---

### حالة الدفع لكل الدورات
```
GET /api/{schoolId}/payments/student/{studentId}/courses
```
**الاستجابة:**
```json
{
  "success": true,
  "data": [{
    "courseId": "...",
    "courseName": "...",
    "paymentType": "month",
    "totalAmount": 50000,
    "paidAmount": 25000,
    "remainingAmount": 25000,
    "months": [{ "month": "2024-09", "paid": true, "amount": 5000 }]
  }]
}
```
**الأذونات:** مدير مدرسة / ولي أمر

---

### تسجيل دفع
```
POST /api/{schoolId}/payments
```
**الطلب (شهري):**
```json
{
  "studentId": "...",
  "amount": 5000,
  "month": "2024-09",
  "type": "monthly"
}
```
**الطلب (دورة خاصة):**
```json
{
  "studentId": "...",
  "courseId": "...",
  "amount": 50000,
  "type": "course"
}
```
**الأذونات:** مدير مدرسة

---

### سند قبض
```
GET /api/{schoolId}/payments/{id}/receipt
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "student": { "firstName": "...", "lastName": "..." },
    "amount": 5000,
    "month": "2024-09",
    "date": "2024-09-15",
    "schoolName": "مدرسة النور"
  }
}
```
**الأذونات:** مدير مدرسة

---

### التحقق من المتبقي
```
GET /api/{schoolId}/payments/student/{studentId}/remaining
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "remainingMonths": 6,
    "monthlyFee": 5000,
    "paidMonths": 3,
    "exempt": false
  }
}
```
**الأذونات:** مدير مدرسة

---

### أشهر الطباعة
```
GET /api/{schoolId}/payments/print-months
```
**الأذونات:** مدير مدرسة

---

### بيانات الطباعة
```
GET /api/{schoolId}/payments/print?months=2024-09,2024-10
```
**الأذونات:** مدير مدرسة

---

## 13. lessonService — الدروس

### جلب الدروس
```
GET /api/{schoolId}/lessons?courseId=...
```
**الأذونات:** معلم / مدير مدرسة

---

### جلب درس بالـ ID
```
GET /api/{schoolId}/lessons/{id}
```
**الأذونات:** معلم / مدير مدرسة

---

### إنشاء درس
```
POST /api/{schoolId}/lessons
```
**الطلب:**
```json
{
  "title": "الدرس الأول",
  "courseId": "...",
  "programModuleId": "...",
  "orderIndex": 1,
  "status": "not_started"
}
```
**الأذونات:** معلم

---

### تعديل درس
```
PUT /api/{schoolId}/lessons/{id}
```
**الأذونات:** معلم

---

### حذف درس
```
DELETE /api/{schoolId}/lessons/{id}
```
**الأذونات:** معلم

---

### إتمام درس
```
POST /api/{schoolId}/lessons/progress
```
**الطلب:**
```json
{
  "lessonId": "...",
  "status": "completed",
  "completedAt": "2024-09-15"
}
```
**الأذونات:** معلم

---

## 14. programService — البرامج الدراسية

### جلب برنامج الدورة
```
GET /api/{schoolId}/programs/course/{courseId}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "title": "برنامج اللغة العربية",
    "description": "...",
    "courseId": "...",
    "modules": [{
      "id": "...",
      "title": "الوحدة الأولى",
      "orderIndex": 1,
      "lessons": [{ "id": "...", "title": "الدرس الأول", "orderIndex": 1 }]
    }]
  }
}
```
**الأذونات:** معلم / مدير مدرسة

---

### إنشاء برنامج
```
POST /api/{schoolId}/programs
```
**الطلب:**
```json
{
  "title": "برنامج اللغة العربية",
  "description": "وصف البرنامج",
  "courseId": "..."
}
```
**الأذونات:** معلم

---

### تعديل برنامج
```
PUT /api/{schoolId}/programs/{id}
```
**الأذونات:** معلم

---

### حذف برنامج
```
DELETE /api/{schoolId}/programs/{id}
```
**ملاحظة:** يحذف الوحدات والدروس المرتبطة
**الأذونات:** معلم

---

### إضافة وحدة
```
POST /api/{schoolId}/programs/modules
```
**الطلب:**
```json
{
  "title": "الوحدة الأولى",
  "programId": "...",
  "orderIndex": 1
}
```
**الأذونات:** معلم

---

### تعديل وحدة
```
PUT /api/{schoolId}/programs/modules/{moduleId}
```
**الأذونات:** معلم

---

### حذف وحدة
```
DELETE /api/{schoolId}/programs/modules/{moduleId}
```
**الأذونات:** معلم

---

## 15. activityService — الأنشطة (حضانة)

### جلب الأنشطة
```
GET /api/{schoolId}/activities?page=1&limit=10&date=2024-09-15&period=morning
```
**الأذونات:** معلم / مدير مدرسة

---

### جلب نشاط بالـ ID
```
GET /api/{schoolId}/activities/{id}
```
**الأذونات:** معلم / مدير مدرسة

---

### إنشاء نشاط
```
POST /api/{schoolId}/activities
```
**الطلب:**
```json
{
  "title": "نشاط رياضي",
  "category": "physical",
  "date": "2024-09-15",
  "period": "morning",
  "startTime": "09:00",
  "description": "نشاط ت HACKيسي"
}
```
**فئات الأنشطة:** `physical` | `creative` | `cognitive` | `social` | `moral` | `linguistic`
**الأذونات:** معلم

---

### تعديل نشاط
```
PUT /api/{schoolId}/activities/{id}
```
**الأذونات:** معلم

---

### إتمام نشاط
```
POST /api/{schoolId}/activities/{id}/complete
```
**الطلب:**
```json
{
  "date": "2024-09-15",
  "period": "morning"
}
```
**الأذونات:** معلم

---

### حذف نشاط
```
DELETE /api/{schoolId}/activities/{id}
```
**الأذونات:** معلم

---

### تقدم تلميذ في الأنشطة
```
GET /api/{schoolId}/activities/student/{studentId}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalActivities": 30,
    "completedActivities": 25,
    "missedActivities": 3,
    "plannedActivities": 2,
    "records": [{ "activityId": "...", "participated": true, "rating": 5 }]
  }
}
```
**الأذونات:** معلم / ولي أمر

---

### جلب المشاركات
```
GET /api/{schoolId}/activities/{activityId}/participations
```
**الأذونات:** معلم

---

### تسجيل مشاركة
```
POST /api/{schoolId}/activities/{activityId}/participate
```
**الطلب:**
```json
{
  "studentId": "...",
  "participated": true,
  "rating": 5,
  "notes": "ممتاز"
}
```
**الأذونات:** معلم

---

### تسجيل جماعي
```
POST /api/{schoolId}/activities/{activityId}/participate/bulk
```
**الطلب:**
```json
{
  "records": [
    { "studentId": "...", "participated": true, "rating": 5 },
    { "studentId": "...", "participated": false }
  ]
}
```
**الأذونات:** معلم

---

## 16. quranProgressService — التقدم القرآني

### جلب السور
```
GET /api/{schoolId}/quran/surahs
```
**الأذونات:** معلم / مدير مدرسة / ولي أمر

---

### جلب تقدم تلميذ
```
GET /api/{schoolId}/quran/student/{studentId}?includeNotReached=true
```
**الاستجابة:**
```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "surahId": 1,
      "surahName": "الفاتحة",
      "status": "memorized",
      "completionType": "full",
      "memorizationType": "complete",
      "grade": "excellent",
      "hizb": 1,
      "page": 1
    }
  ],
  "stats": {
    "currentSurah": 25,
    "completedHizbs": 15,
    "memorizedCount": 20,
    "progressPercent": 65
  }
}
```
**الأذونات:** معلم / ولي أمر (طفله فقط)

---

### تحديث حالة سورة
```
POST /api/{schoolId}/quran/update
```
**الطلب:**
```json
{
  "studentId": "...",
  "surahId": 25,
  "status": "memorized",
  "completionType": "full",
  "memorizationType": "complete",
  "grade": "excellent",
  "hizb": 15,
  "page": 300
}
```
**القيم المحتملة:**
- `status`: `not_reached` | `memorizing` | `memorized`
- `completionType`: `full` | `part`
- `memorizationType`: `complete` | `partial`
- `grade`: `excellent` | `good` | `average` | `weak`

**الأذونات:** معلم

---

### تحديث ملخص التلميذ
```
POST /api/{schoolId}/quran/student-summary
```
**الطلب:**
```json
{
  "studentId": "...",
  "currentSurahNumber": 25,
  "hizbs": 15
}
```
**الأذونات:** معلم

---

### تهيئة التقدم
```
POST /api/{schoolId}/quran/initialize
```
**الطلب:**
```json
{
  "studentId": "..."
}
```
**ملاحظة:** يُنشئ سجلات لكل السور بحالة `not_reached`
**الأذونات:** معلم

---

## 17. messageService — الرسائل

### جلب المحادثات
```
GET /api/{schoolId}/messages/conversations
```
**الأذونات:** أي دور

---

### جلب رسائل محادثة
```
GET /api/{schoolId}/messages/conversations/{conversationId}
```
**الأذونات:** أي دور (مشارك في المحادثة)

---

### إرسال رسالة
```
POST /api/{schoolId}/messages
```
**الطلب:**
```json
{
  "recipientId": "...",
  "content": "مرحباً"
}
```
**الأذونات:** أي دور

---

### إرسال رسالة جماعية
```
POST /api/{schoolId}/messages/group
```
**الطلب:**
```json
{
  "recipientIds": ["id1", "id2", "id3"],
  "content": "إعلان هام"
}
```
**الأذونات:** مدير مدرسة / معلم

---

### جلب المستلمين المتاحين
```
GET /api/{schoolId}/messages/recipients
```
**الأذونات:** أي دور

---

### عدد الرسائل غير المقروءة
```
GET /api/{schoolId}/messages/unread
```
**الاستجابة:**
```json
{
  "success": true,
  "data": { "unreadCount": 5 }
}
```
**الأذونات:** أي دور

---

### تعليم كمقروءة
```
PATCH /api/{schoolId}/messages/conversations/{conversationId}/read
```
**الأذونات:** أي دور (مشارك في المحادثة)

---

## 18. notificationService — الإشعارات

### جلب الإشعارات
```
GET /api/{schoolId}/notifications
```
**الأذونات:** أي دور

---

### تعليم إشعار كمقروء
```
PATCH /api/{schoolId}/notifications/{id}/read
```
**الأذونات:** أي دور

---

### تعليم الكل كمقروء
```
PATCH /api/{schoolId}/notifications/read-all
```
**الأذونات:** أي دور

---

## 19. timetableService — الجدول الزمني

### جلب إعدادات الجدول
```
GET /api/timetable/settings?schoolId={schoolId}
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "schoolId": "...",
    "studyDays": ["saturday", "sunday", "monday", "tuesday", "wednesday"],
    "periods": [
      { "id": "...", "label": "الفترة الأولى", "startTime": "08:00", "endTime": "09:00" }
    ]
  }
}
```
**الأذونات:** مدير مدرسة / معلم / ولي أمر

---

### تحديث إعدادات الجدول
```
PUT /api/timetable/settings
```
**الطلب:**
```json
{
  "schoolId": "...",
  "studyDays": ["saturday", "sunday", "monday"],
  "periods": [
    { "label": "الفترة الأولى", "startTime": "08:00", "endTime": "09:00" },
    { "label": "الفترة الثانية", "startTime": "09:00", "endTime": "10:00" }
  ]
}
```
**الأذونات:** مدير مدرسة

---

### جلب خانات الجدول
```
GET /api/timetable/slots?schoolId={schoolId}&day=saturday
```
**الاستعلام:** `day` اختياري — تصفية بيوم محدد
**الاستجابة:**
```json
{
  "success": true,
  "data": [{
    "id": "...",
    "schoolId": "...",
    "teacherId": "...",
    "teacher": { "id": "...", "firstName": "محمد", "lastName": "أحمد" },
    "day": "saturday",
    "periodId": "...",
    "type": "course",
    "courseId": "...",
    "course": { "id": "...", "name": "دورة القرآن" },
    "color": "#6366f1",
    "startDate": "2024-09-01"
  }]
}
```
**الأذونات:** مدير مدرسة

---

### جلب خانات المعلم
```
GET /api/timetable/slots/mine?schoolId={schoolId}
```
**الأذونات:** معلم

---

### جلب خانات طفل (ولي أمر)
```
GET /api/timetable/slots/child/{studentId}?schoolId={schoolId}
```
**الأذونات:** ولي أمر (الطفل مرتبط به)

---

### إنشاء خانة
```
POST /api/timetable/slots
```
**الطلب:**
```json
{
  "schoolId": "...",
  "teacherId": "...",
  "day": "saturday",
  "periodId": "...",
  "type": "course",
  "courseId": "...",
  "color": "#6366f1",
  "startDate": "2024-09-01"
}
```
**أنواع الخانات:** `course` | `activity` | `classroom`
**الأذونات:** مدير مدرسة

---

### تعديل خانة
```
PUT /api/timetable/slots/{slotId}
```
**الطلب:** جزئي — أي حقل قابل للتعديل
**الأذونات:** مدير مدرسة

---

### حذف خانة
```
DELETE /api/timetable/slots/{slotId}
```
**الأذونات:** مدير مدرسة

---

### نقل خانة (سحب/إفلات)
```
PATCH /api/timetable/slots/{slotId}/move
```
**الطلب:**
```json
{
  "day": "sunday",
  "periodId": "..."
}
```
**الأذونات:** مدير مدرسة

---

### جلب طلبات التغيير
```
GET /api/timetable/requests?schoolId={schoolId}
```
**الأذونات:** مدير مدرسة

---

### إنشاء طلب تغيير
```
POST /api/timetable/requests
```
**الطلب:**
```json
{
  "schoolId": "...",
  "slotId": "...",
  "requestedDay": "sunday",
  "requestedPeriodId": "...",
  "reason": "تعارض مع حصة أخرى"
}
```
**الحالة الأولية:** `pending`
**الأذونات:** معلم

---

### معالجة طلب تغيير
```
PATCH /api/timetable/requests/{requestId}
```
**الطلب:**
```json
{
  "status": "approved",
  "adminNote": "تمت الموافقة"
}
```
**القيم المحتملة لـ `status`:** `approved` | `rejected`
**الأذونات:** مدير مدرسة

---

### حذف الطلبات القديمة (تنظيف أسبوعي)
```
DELETE /api/timetable/requests/cleanup?schoolId={schoolId}
```
**ملاحظة:** يحذف الطلبات الأقدم من أسبوع واحد
**الأذونات:** مدير مدرسة

---

## 20. statsService — الإحصائيات

### إحصائيات المسؤول العام
```
GET /api/super-admin/stats?period=week
```
**الفترات:** `week` | `month` | `year`
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalSchools": 10,
    "totalStudents": 500,
    "totalTeachers": 50,
    "recentActivities": [...]
  }
}
```
**الأذونات:** مسؤول عام

---

### إحصائيات لوحة تحكم المدرسة
```
GET /api/{schoolId}/stats
```
**الأذونات:** مدير مدرسة

---

### إحصائيات لوحة تحكم المعلم
```
GET /api/{schoolId}/stats/teacher
```
**الأذونات:** معلم

---

### إحصائيات لوحة تحكم ولي الأمر
```
GET /api/{schoolId}/stats/parent/{childId}
```
**الأذونات:** ولي أمر (الطفل مرتبط به)

---

### إحصائيات المنصة العامة (عام)
```
GET /api/public/platform-stats
```
**الأذونات:** عام

---

### إحصائيات مدرسة عامة (عام)
```
GET /api/public/schools/{slug}/stats
```
**الاستجابة:**
```json
{
  "success": true,
  "data": {
    "totalStudents": 150,
    "totalTeachers": 15,
    "totalCourses": 5,
    "totalClassrooms": 8,
    "totalActivities": 30
  }
}
```
**الأذونات:** عام

---

## ملخص الـ Endpoints حسب الدور

### مسؤول عام (super_admin)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/auth/super-admin/login` | تسجيل الدخول |
| GET | `/super-admin/stats` | إحصائيات المنصة |
| GET | `/schools` | جميع المدارس |
| POST | `/schools` | إنشاء مدرسة |
| GET | `/schools/{id}` | تفاصيل مدرسة |
| PUT | `/schools/{id}` | تعديل مدرسة |
| DELETE | `/schools/{id}` | حذف مدرسة |
| PATCH | `/schools/{id}/freeze` | تجميد |
| PATCH | `/schools/{id}/unfreeze` | إلغاء تجميد |
| GET | `/super-admin/schools/{id}/admin` | جلب مدير المدرسة |

### مدير المدرسة (school_admin)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| POST | `/auth/school/{id}/login` | تسجيل الدخول |
| GET | `/{schoolId}/stats` | إحصائيات المدرسة |
| GET/POST/PUT/DELETE | `/{schoolId}/admin/teachers/*` | CRUD المعلمين |
| GET/POST/PUT/DELETE | `/{schoolId}/admin/students/*` | CRUD التلاميذ |
| GET/POST/PUT/DELETE | `/{schoolId}/admin/parents/*` | CRUD أولياء الأمور |
| GET/POST/PUT/DELETE | `/{schoolId}/classrooms/*` | CRUD الأقسام |
| GET/POST/PUT/DELETE | `/{schoolId}/courses/*` | CRUD الدورات |
| GET/POST/PUT/DELETE | `/{schoolId}/attendance/*` | الحضور والغياب |
| GET/POST | `/{schoolId}/payments/*` | المدفوعات |
| GET/PUT | `/timetable/settings` | إعدادات الجدول |
| GET/POST/PUT/DELETE/PATCH | `/timetable/slots/*` | إدارة خانات الجدول |
| GET/PATCH | `/timetable/requests/*` | طلبات التغيير |
| DELETE | `/timetable/requests/cleanup` | تنظيف الطلبات القديمة |
| GET | `/{schoolId}/messages/*` | الرسائل |
| GET/PATCH | `/{schoolId}/notifications/*` | الإشعارات |
| PUT | `/{schoolId}/admin/settings` | إعدادات المدرسة |

### معلم (teacher)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/{schoolId}/teacher/students` | تلاميذه |
| GET | `/{schoolId}/courses` | دوراته |
| GET/POST/PUT/DELETE | `/{schoolId}/programs/*` | البرنامج + الوحدات |
| GET/POST/PUT/DELETE | `/{schoolId}/lessons/*` | الدروس |
| GET/POST/DELETE | `/{schoolId}/courses/{id}/sessions/*` | الحصص |
| GET/POST/PUT/PATCH/DELETE | `/{schoolId}/courses/{id}/attendance/*` | حضور الدورة |
| GET/POST/PUT/DELETE | `/{schoolId}/activities/*` | الأنشطة (حضانة) |
| GET/POST | `/{schoolId}/quran/*` | التقدم القرآني |
| GET | `/timetable/slots/mine` | جدول المعلم |
| POST | `/timetable/requests` | طلب تغيير جدول |
| GET/POST/PATCH | `/{schoolId}/messages/*` | الرسائل |

### ولي أمر (parent)
| الطريقة | المسار | الوصف |
|---------|--------|-------|
| GET | `/{schoolId}/parent/children` | أطفاله |
| GET | `/{schoolId}/parent/children/{id}/progress` | تقدم الطفل |
| GET | `/{schoolId}/attendance/student/{id}` | حضور الطفل |
| GET | `/{schoolId}/course-attendance/student/{id}` | حضور الدورات |
| GET | `/{schoolId}/payments/student/{id}` | مدفوعات الطفل |
| GET | `/{schoolId}/activities/student/{id}` | أنشطة الطفل |
| GET | `/{schoolId}/quran/student/{id}` | التقدم القرآني |
| GET | `/timetable/slots/child/{studentId}` | جدول الطفل |
| GET/POST/PATCH | `/{schoolId}/messages/*` | الرسائل |
| GET/PATCH | `/{schoolId}/notifications/*` | الإشعارات |
