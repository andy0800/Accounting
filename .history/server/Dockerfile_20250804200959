FROM node:16-alpine

WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci --only=production

# نسخ الكود المصدري
COPY . .

# إنشاء مجلد الملفات المرفوعة
RUN mkdir -p uploads

# تعريض المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["npm", "start"] 