# منصة متعددة المدارس — التوثيق الشامل

## نظرة عامة

منصة إدارة مدارس متعددة types تدعم 3 أنواع مدارس (قرآنية، خاصة، حضانة) مع 4 أدوار مستخدمين.
بنيتها: React 19 + TypeScript + Vite + MUI 7 + Tailwind CSS 4

---

## الهيكل العام للنظام

```
المسؤول العام (super_admin)
├── إدارة المدارس (إنشاء/تعديل/حذف/تجميد)
├── إحصائيات المنصة العامة
└── تفاصيل كل مدرسة

مدير المدرسة (school_admin)
├── إدارة المعلمين (إنشاء/تعديل/حذف)
├── إدارة أولياء الأمور
├── إدارة التلاميذ (إنشاء/تعديل/حذف/FLICT)
├── إدارة الأقسام (Fs)
├── إدارة الدورات (إنشاء/تعديل/تسجيل تلاميذ)
├── سجل الحضور والغياب
├── إدارة المدفوعات
├── الجدول الزمني (إعدادات + شبكة سحب/إفلات)
├── الرسائل
├── الإشعارات
└── إعدادات المدرسة

المعلم (teacher)
├── لوحة تحكم شخصية
├── برنامج المادة (FS + دروس + حصص)
├── سجل الحضور والغياب
├── تتبع تقدم التلاميذ
├── الأنشطة (للحضانة)
├── الجدول الزمني (عرض + طلب تغيير)
├── الرسائل
└── الإشعارات

ولي الأمر (parent)
├── لوحة تحكم شخصية
├── تفاصيل الطفل (تقدم + حضور + جدول)
├── الرسائل
└── الإشعارات
```

---

## أنواع المدارس وpecifics

### 1. المدرسة القرآنية (`quranic`)
- **لوحة المدير:** أقسام + تلاميذ + أولياء + معلمين + دورات + حضور + مدفوعات
- **لوحة المعلم:** برنامج + تقدم تلاميذ + حضور
- **تتبع التقدم:** حفظ سور + أحزاب + حالة كل سورة (لم يصل/يحفظ/محفوظ)
- **الميزات:** لا أنشطة، لا حصص في البرنامج

### 2. المدرسة الخاصة (`private`)
- **لوحة المدير:** نفس الهيكل + دورات مسجّلة بالتلاميذ
- **لوحة المعلم:** برنامج + حصص + حضور
- **تتبع التقدم:** لكل دورة وحدات ودروس + حالة الدرس
- **الميزات:** نظام حصص + تسجيل تلاميذ في دورات

### 3. روضة/حضانة (`kindergarten`)
- **لوحة المدير:** أقسام + تلاميذ + أولياء + معلمين + دورات + حضور + مدفوعات
- **لوحة المعلم:** أنشطة + حضور
- **تتبع التقدم:** أنشطة + مشاركات + تقييم
- **الميزات:** 6 فئات أنشطة (بدية/إبداعية/إدراكية/اجتماعية/أخلاقية/لغوية)

---

## نظام المصادقة والصلاحيات

### التوكنات
- **JWT Access Token:** يُخزّن في `localStorage` مع prefix حسب الدور
  - مسؤول عام: `superAdmin_accessToken`
  - أي دور آخر: `{schoolSlug}_accessToken`
- **Refresh Token:** مماثل مع `_refreshToken`
- **تجديد التوكن:** تلقائي عند 401 مع deduplication

### خطوط الحماية (Guards)
```
GuestGuard   → يمنع المسجّل من صفحة الدخول
AuthGuard    → يطلب تسجيل الدخول (يحوّل لـ login)
RoleGuard    → يتحقق من الدور المسموح
SchoolGuard  → يتحقق من تطابق schoolSlug مع المستخدم
```

### الأدوار والأذونات
| الدور | super_admin | school_admin | teacher | parent |
|-------|------------|--------------|---------|--------|
| إدارة المدارس | ✅ | ❌ | ❌ | ❌ |
| إدارة المعلمين | ❌ | ✅ | ❌ | ❌ |
| إدارة التلاميذ | ❌ | ✅ | جزئي | ❌ |
| سجل الحضور | ❌ | ✅ | ✅ (دورة واحدة) | مشاهدة |
| الدورات | ❌ | ✅ | مشاهدة | مشاهدة |
| المدفوعات | ❌ | ✅ | ❌ | مشاهدة |
| الجدول الزمني | ❌ | إعدادات + شبكة | عرض + طلب تغيير | مشاهدة (لطفيله) |
| الرسائل | ❌ | ✅ | ✅ | ✅ |
| البرنامج | ❌ | ❌ | ✅ | ❌ |

---

## بنية الملفات

```
src/
├── components/           # مكونات مشتركة
│   ├── common/           # 22 مكون (DataTable, Input, Popover, SchoolLogo...)
│   ├── dashboard/        # 4 مكونات (MetricCard, DataCard, PageShell, UsageBar)
│   ├── landing/          # 12+ مكون للصفحة المزخرفة
│   ├── messages/         # 5 مكونات للرسائل
│   └── notifications/    # مكون الإشعارات
│
├── contexts/             # 4 سياقات (Auth, School, Theme, Notification)
│
├── guards/               # 4 حمايات (Auth, Guest, Role, School)
│
├── hooks/                # 9 hooks مخصصة
│
├── layouts/              # تخطيطات الصفحات + sidebar
│
├── routes/               # التوجيه الهرمي
│
├── services/             # 18 خدمة API
│
├── theme/                # الثيمات (Carbon Light/Dark + Glass)
│
├── types/                # 16 ملف أنواع
│
├── utils/                # أدوات مساعدة
│
└── views/                # صفحات العرض
    ├── landing/          # صفحات الهبوط + تسجيل الدخول
    ├── superAdmin/       # صفحات المسؤول العام
    ├── schoolAdmin/      # صفحات مدير المدرسة
    ├── teacher/          # صفحات المعلم
    ├── parent/           # صفحات ولي الأمر
    └── shared/           # صفحات مشتركة (Profile, QuranProgressView)
```

---

## نظام API

### الإعداد الأساسي
- **Base URL:** `/api`
- **Request Interceptor:** يضيف `Authorization: Bearer {token}`
- **Response Interceptor:** يكشف 401/403 ويحاول تجديد التوكن تلقائياً
- **publicApi:** للصفحات العامة بدون مصادقة

### الخدمات الأساسية (19 خدمة)
| الخدمة | الوظيفة |
|--------|---------|
| authService | تسجيل الدخول/الخروج + تحديث الملف الشخصي |
| schoolService | CRUD المدارس + تجميد + إحصائيات + إعدادات |
| studentService | CRUD التلاميذ + تعيين قسم + تقدم الدورات |
| teacherManagementService | CRUD المعلمين |
| parentService | CRUD أولياء الأمور + أطفالهم |
| classroomService | CRUD الأقسام + تعيين معلم |
| courseService | CRUD الدورات + تسجيل/إلغاء تلاميذ |
| courseSessionService | إدارة الحصص (إتمام/حذف) |
| courseAttendanceService | حضور الدورات (يومي/بالحصة/بالتلميذ) |
| attendanceService | الحضور العام (يومي/ملخص/تبرير) |
| paymentService | المدفوعات + سندات + تقارير |
| lessonService | CRUD الدروس |
| programService | CRUD البرامج + الوحدات |
| activityService | CRUD الأنشطة + مشاركات التلاميذ |
| quranProgressService | التقدم القرآني |
| timetableService | الجدول الزمني + إعدادات + طلبات التغيير |
| messageService | الرسائل + المحادثات |
| notificationService | الإشعارات |
| statsService | الإحصائيات (عام/مدرسة/معلم/ولي أمر) |

---

## نظام التوجيه

### المسارات العامة
| المسار | الصفحة | الحماية |
|--------|--------|---------|
| `/` | الصفحة الرئيسية | عام |
| `/s/:schoolId` | صفحة المدرسة | عام |
| `/superAdmin/login` | دخول المسؤول | GuestGuard |
| `/s/:schoolId/login` | دخول المدرسة | GuestGuard |

### مسارات المسؤول العام
| المسار | الصفحة |
|--------|--------|
| `/superAdmin/dashboard` | لوحة التحكم |
| `/superAdmin/schools` | قائمة المدارس |
| `/superAdmin/schools/create` | إنشاء مدرسة |
| `/superAdmin/schools/:id` | تفاصيل المدرسة |
| `/superAdmin/schools/:id/edit` | تعديل المدرسة |
| `/superAdmin/analytics` | التحليلات |
| `/superAdmin/profile` | الملف الشخصي |

### مسارات مدير المدرسة (`/s/:schoolId/admin/...`)
| المسار | الصفحة |
|--------|--------|
| `admin/dashboard` | لوحة التحكم |
| `admin/teachers` | قائمة المعلمين |
| `admin/parents` | قائمة أولياء الأمور |
| `admin/students` | قائمة التلاميذ |
| `admin/classrooms` | قائمة الأقسام |
| `admin/courses` | قائمة الدورات |
| `admin/payments` | المدفوعات |
| `admin/attendance` | الحضور والغياب |
| `admin/timetable` | الجدول الزمني (شبكة سحب/إفلات) |
| `admin/timetable/settings` | إعدادات الجدول (أيام + فترات) |
| `admin/messages` | الرسائل |
| `admin/settings` | الإعدادات |

### مسارات المعلم (`/s/:schoolId/teacher/...`)
| المسار | الصفحة |
|--------|--------|
| `teacher/dashboard` | لوحة التحكم |
| `teacher/program` | برنامج المادة |
| `teacher/progress` | تقدم التلاميذ |
| `teacher/attendance` | الحضور والغياب |
| `teacher/timetable` | الجدول الزمني + طلب تغيير |
| `teacher/activities` | الأنشطة (حضانة فقط) |
| `teacher/messages` | الرسائل |

### مسارات ولي الأمر (`/s/:schoolId/parent/...`)
| المسار | الصفحة |
|--------|--------|
| `parent/dashboard` | لوحة التحكم |
| `parent/:childId/progress` | تقدم الطفل |
| `parent/:childId/attendance` | حضور الطفل |
| `parent/:childId/timetable` | جدول الطفل |
| `parent/messages` | الرسائل |

---

## نظام الثيمات

- **Carbon Light:** ثيم فاتح بألوان Indigo
- **Carbon Dark:** ثيم داكن
- **Glass Effects:** تأثيرات زجاجية في كل المكونات
- **Tajawal Font:** الخط الأساسي (عربي)
- **Inter Font:** الخط الثانوي (إنجليزي)

---

## التبعيات الخارجية

| المكتبة | الاستخدام |
|----------|----------|
| React 19 |핵심 |
| MUI 7 | واجهة المستخدم |
| react-router-dom 7 | التوجيه |
| axios | طلبات HTTP |
| recharts | المخططات البيانية |
| framer-motion | الحركات |
| Tailwind CSS 4 | أنماط CSS |
| TypeScript 5.7 | أنواع البيانات |

---

## بنية البيانات

### الكيانات الرئيسية
- **User:** المستخدم مع الأدوار (super_admin, school_admin, teacher, parent)
- **School:** المدرسة مع النوع (quranic, private, kindergarten)
- **Student:** التلميذ مع 20+ حقل
- **Teacher:** المعلم
- **Parent:** ولي الأمر
- **Classroom:** القسم
- **Course:** الدورة مع 3 أنواع تسعير (شهري/بالحصة/بالدورة)
- **Attendance:** سجل الحضور
- **Payment:** سجل الدفع
- **TimetableSlot:** خانة في الجدول (معلم + يوم + فترة + نوع [دورة/نشاط/قسم] + لون)
- **TimetableSettings:** إعدادات الجدول (أيام الدراسة + الفترات الزمنية)
- **ScheduleChangeRequest:** طلب تغيير جدول (معلم → مدير مع سبب + حالة)

### أنواع التسعير
```
شهرية (month):       سعر × عدد الأشهر
بالحصة (session):    سعر × عدد الحصص
بالدورة (course):    سعر واحد للدورة كاملة
```

---

## ملاحظات تقنية

### المبادئ المعمارية
1. **Lazy Loading:** جميع الصفحات محمّلة بكسل
2. **Guard Pattern:** 4 طبقات حماية
3. **Service Pattern:** كل كيان له خدمة API مستقلة
4. **Context Pattern:** 4 سياقات فقط (لا Redux)
5. **Multi-tenant:** توكنات معزولة حسب المدرسة
6. **Type-first:** ملفات types منفصلة لكل كيان

### تحذيرات أمنية
1. ⚠️ JWT مخزّن في localStorage (يُنصح بـ httpOnly cookies)
2. ⚠️ لا يوجد client-side validation شامل
3. ⚠️ decodeToken لا يتحقق من `exp`
4. ✅ لا يوجد `dangerouslySetInnerHTML`
5. ✅ لا يوجد hardcoded secrets
6. ✅ refresh deduplication في api.ts

### المكتبات المُستبعدة (كانت غير مستعملة)
- antd, @ant-design/icons, esbuild-wasm
