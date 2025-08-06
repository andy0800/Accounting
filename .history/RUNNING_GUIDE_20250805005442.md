# دليل تشغيل نظام إدارة التأشيرات والمحاسبة

## نظرة عامة
هذا الدليل يوضح كيفية تشغيل نظام إدارة التأشيرات والمحاسبة باللغة العربية باستخدام طرق مختلفة.

## المتطلبات الأساسية

### البرامج المطلوبة
- **Node.js** (الإصدار 16 أو أحدث)
- **npm** أو **yarn**
- **MongoDB** (الإصدار 4.4 أو أحدث)
- **Git** (لتحميل المشروع)

### للتحقق من الإصدارات
```bash
node --version
npm --version
mongod --version
git --version
```

## الطريقة الأولى: التشغيل المحلي (Local Development)

### 1. تحميل المشروع
```bash
# استنساخ المشروع
git clone <رابط-المشروع>
cd نظام-إدارة-التأشيرات

# أو إذا كان المشروع موجود بالفعل
cd "Accounting System"
```

### 2. تثبيت التبعيات
```bash
# تثبيت جميع التبعيات (الخادم والواجهة)
npm run install-all

# أو تثبيت كل منهما منفصلاً
cd server && npm install
cd ../client && npm install
cd ..
```

### 3. إعداد قاعدة البيانات

#### خيار أ: MongoDB المحلي
```bash
# تشغيل MongoDB
mongod

# في نافذة جديدة، إنشاء قاعدة البيانات
mongo
use نظام-التأشيرات
exit
```

#### خيار ب: MongoDB Atlas (السحابي)
1. إنشاء حساب على [MongoDB Atlas](https://www.mongodb.com/atlas)
2. إنشاء cluster جديد
3. الحصول على رابط الاتصال
4. إضافة الرابط إلى ملف `.env`

### 4. إعداد متغيرات البيئة

#### إنشاء ملف `.env` في مجلد `server`
```bash
cd server
cp env.example .env
```

#### تعديل ملف `.env`
```env
MONGODB_URI=mongodb://localhost:27017/نظام-التأشيرات
PORT=5000
NODE_ENV=development
```

### 5. تشغيل النظام

#### الطريقة الأولى: تشغيل كلاهما معاً
```bash
# من المجلد الرئيسي
npm run dev
```

#### الطريقة الثانية: تشغيل كل منهما منفصلاً
```bash
# تشغيل الخادم (في نافذة منفصلة)
npm run server

# تشغيل الواجهة (في نافذة منفصلة)
npm run client
```

### 6. الوصول للنظام
- **الواجهة الأمامية**: http://localhost:3000
- **الخادم الخلفي**: http://localhost:5000
- **API**: http://localhost:5000/api

## الطريقة الثانية: التشغيل باستخدام Docker

### 1. التأكد من تثبيت Docker
```bash
docker --version
docker-compose --version
```

### 2. تشغيل النظام بالكامل
```bash
# بناء وتشغيل جميع الخدمات
docker-compose up --build

# أو تشغيل في الخلفية
docker-compose up -d --build
```

### 3. الوصول للنظام
- **الواجهة الأمامية**: http://localhost:3000
- **الخادم الخلفي**: http://localhost:5000
- **MongoDB**: localhost:27017

### 4. إيقاف النظام
```bash
# إيقاف جميع الخدمات
docker-compose down

# إيقاف وحذف البيانات
docker-compose down -v
```

## الطريقة الثالثة: التشغيل للإنتاج

### 1. بناء المشروع
```bash
# بناء الواجهة الأمامية
cd client
npm run build
cd ..

# تشغيل الخادم للإنتاج
cd server
npm start
```

### 2. استخدام PM2 (للإنتاج)
```bash
# تثبيت PM2
npm install -g pm2

# تشغيل الخادم
pm2 start server/index.js --name "نظام-التأشيرات"

# تشغيل الواجهة الأمامية
pm2 start "npm start" --name "واجهة-التأشيرات" --cwd client

# عرض الحالة
pm2 status

# إيقاف الخدمات
pm2 stop جميع
```

## استكشاف الأخطاء

### مشاكل شائعة وحلولها

#### 1. خطأ في الاتصال بقاعدة البيانات
```bash
# التأكد من تشغيل MongoDB
mongod

# أو استخدام Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 2. خطأ في تثبيت التبعيات
```bash
# حذف node_modules وإعادة التثبيت
rm -rf node_modules
rm -rf server/node_modules
rm -rf client/node_modules
npm run install-all
```

#### 3. خطأ في تشغيل الواجهة الأمامية
```bash
# التأكد من تثبيت جميع التبعيات
cd client
npm install
npm start
```

#### 4. خطأ في تشغيل الخادم
```bash
# التأكد من وجود ملف .env
cd server
ls -la .env
# إذا لم يكن موجوداً، انسخ env.example
cp env.example .env
```

#### 5. مشاكل في اللغة العربية
```bash
# التأكد من تثبيت الخطوط العربية
npm install @fontsource/roboto
```

### فحص السجلات
```bash
# سجلات الخادم
cd server
npm run dev

# سجلات Docker
docker-compose logs -f

# سجلات PM2
pm2 logs
```

## إعدادات إضافية

### 1. إعداد MongoDB Atlas
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/نظام-التأشيرات?retryWrites=true&w=majority
```

### 2. إعداد المنافذ المخصصة
```env
PORT=5000
REACT_APP_API_URL=http://localhost:5000
```

### 3. إعداد البيئة للإنتاج
```env
NODE_ENV=production
```

## اختبار النظام

### 1. اختبار الاتصال
```bash
# اختبار الخادم
curl http://localhost:5000/api/accounts/summary

# اختبار الواجهة
curl http://localhost:3000
```

### 2. اختبار قاعدة البيانات
```bash
# الاتصال بـ MongoDB
mongo
use نظام-التأشيرات
show collections
exit
```

### 3. اختبار التصدير
1. إنشاء تأشيرة جديدة
2. إضافة مصروفات
3. تصدير التقرير
4. التحقق من ملف Excel

## النسخ الاحتياطية

### 1. نسخ احتياطي لقاعدة البيانات
```bash
# إنشاء نسخة احتياطية
mongodump --db نظام-التأشيرات --out backup/

# استعادة النسخة الاحتياطية
mongorestore --db نظام-التأشيرات backup/نظام-التأشيرات/
```

### 2. نسخ احتياطي للملفات
```bash
# نسخ مجلد uploads
cp -r server/uploads backup/uploads

# نسخ ملفات الإعداد
cp server/.env backup/
```

## الأمان

### 1. تغيير كلمات المرور الافتراضية
```env
# في ملف .env
MONGODB_URI=mongodb://username:newpassword@localhost:27017/نظام-التأشيرات
```

### 2. إعداد HTTPS (للإنتاج)
```bash
# تثبيت شهادة SSL
# إعداد reverse proxy (nginx)
```

## المراقبة

### 1. مراقبة الأداء
```bash
# مراقبة استخدام الذاكرة
node --inspect server/index.js

# مراقبة قاعدة البيانات
db.stats()
db.visas.getIndexes()
```

### 2. مراقبة السجلات
```bash
# سجلات النظام
tail -f /var/log/syslog

# سجلات التطبيق
pm2 logs
```

## التحديثات

### 1. تحديث النظام
```bash
# جلب التحديثات
git pull origin main

# تحديث التبعيات
npm run install-all

# إعادة تشغيل النظام
pm2 restart جميع
```

### 2. تحديث Docker
```bash
# إعادة بناء الصور
docker-compose build --no-cache

# إعادة تشغيل الخدمات
docker-compose up -d
```

## الدعم

### في حالة مواجهة مشاكل:
1. التحقق من سجلات النظام
2. التأكد من إعدادات البيئة
3. اختبار الاتصال بقاعدة البيانات
4. مراجعة ملف README.md
5. التواصل مع فريق الدعم

### روابط مفيدة:
- **الواجهة الأمامية**: http://localhost:3000
- **API Documentation**: http://localhost:5000/api
- **MongoDB Compass**: للوصول لقاعدة البيانات
- **Docker Hub**: للصور الجاهزة

---

**ملاحظة**: تأكد من قراءة جميع التعليمات بعناية قبل تشغيل النظام في بيئة الإنتاج. 