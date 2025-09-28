FROM node:20-alpine

WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت التبعيات
# استخدم --omit=dev بدلاً من only=production لضمان توافق npm الأحدث
RUN npm ci --omit=dev

# نسخ الكود المصدري
COPY . .

# إنشاء مجلد الملفات المرفوعة
RUN mkdir -p uploads

# تعريض المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["npm", "start"] 