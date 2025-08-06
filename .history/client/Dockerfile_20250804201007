FROM node:16-alpine

WORKDIR /app

# نسخ ملفات التبعيات
COPY package*.json ./

# تثبيت التبعيات
RUN npm ci

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# تثبيت serve لتشغيل التطبيق المبني
RUN npm install -g serve

# تعريض المنفذ
EXPOSE 3000

# تشغيل التطبيق
CMD ["serve", "-s", "build", "-l", "3000"] 