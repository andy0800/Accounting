const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Visa = require('../models/Visa');
const Secretary = require('../models/Secretary');
const RentalContract = require('../models/RentalContract');
const RentalPayment = require('../models/RentalPayment');
const RentalUnit = require('../models/RentalUnit');
const RentingSecretary = require('../models/RentingSecretary');
const moment = require('moment');

// دالة مساعدة لتنسيق التاريخ
const formatDate = (date) => {
  if (!date) return '';
  try {
    return moment(date).format('DD/MM/YYYY');
  } catch (error) {
    console.error('خطأ في تنسيق التاريخ:', error);
    return '';
  }
};

// دالة مساعدة لإنشاء رؤوس ثنائية اللغة
const bilingualHeader = (arabic, english) => {
  return `${arabic} / ${english}`;
};

// تصدير جميع التأشيرات
router.get('/visas/all', async (req, res) => {
  try {
    console.log('بدء تصدير جميع التأشيرات...');
    const { secretary } = req.query;
    
    let filter = {};
    if (secretary) {
      filter.secretary = secretary;
    }

    console.log('جاري البحث عن التأشيرات...');
    const visas = await Visa.find(filter)
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 });

    console.log(`تم العثور على ${visas.length} تأشيرة`);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('التأشيرات');

    // تعريف الأعمدة
    worksheet.columns = [
      { header: 'المرجع', key: 'reference', width: 15 },
      { header: 'الاسم', key: 'name', width: 25 },
      { header: 'تاريخ الميلاد', key: 'dateOfBirth', width: 15 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم الجواز', key: 'passportNumber', width: 20 },
      { header: 'رقم التأشيرة', key: 'visaNumber', width: 20 },
      { header: 'السكرتيرة', key: 'secretary', width: 20 },
      { header: 'المرحلة الحالية', key: 'currentStage', width: 15 },
      { header: 'تاريخ إصدار التأشيرة', key: 'visaIssueDate', width: 15 },
      { header: 'تاريخ انتهاء التأشيرة', key: 'visaExpiryDate', width: 15 },
      { header: 'الموعد النهائي', key: 'visaDeadline', width: 15 },
      { header: 'إجمالي المصروفات', key: 'totalExpenses', width: 15 },
      { header: 'سعر البيع', key: 'sellingPrice', width: 15 },
      { header: 'الربح', key: 'profit', width: 15 },
      { header: 'أرباح السكرتيرة', key: 'secretaryEarnings', width: 20 },
      { header: 'ربح الشركة', key: 'companyProfit', width: 15 },
      { header: 'سكرتيرة البيع', key: 'sellingSecretary', width: 20 },
      { header: 'عمولة البيع', key: 'sellingCommission', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 25 },
      { header: 'هاتف العميل', key: 'customerPhone', width: 20 },
      { header: 'تاريخ الإنشاء', key: 'createdAt', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 }
    ];

    console.log('جاري إضافة البيانات...');
    // إضافة البيانات
    visas.forEach((visa, index) => {
      try {
        const reference = `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`;
        
        worksheet.addRow({
          reference,
          name: visa.name || '',
          dateOfBirth: formatDate(visa.dateOfBirth),
          nationality: visa.nationality || '',
          passportNumber: visa.passportNumber || '',
          visaNumber: visa.visaNumber || '',
          secretary: visa.secretary ? visa.secretary.name : '',
          currentStage: visa.currentStage || '',
          visaIssueDate: formatDate(visa.visaIssueDate),
          visaExpiryDate: formatDate(visa.visaExpiryDate),
          visaDeadline: formatDate(visa.visaDeadline),
          totalExpenses: visa.totalExpenses || 0,
          sellingPrice: visa.sellingPrice || 0,
          profit: visa.profit || 0,
          secretaryEarnings: visa.secretaryEarnings || 0,
          companyProfit: (visa.profit || 0) - (visa.secretaryEarnings || 0),
          sellingSecretary: visa.sellingSecretary ? 'نعم' : 'لا',
          sellingCommission: visa.sellingCommission || 0,
          customerName: visa.customerName || '',
          customerPhone: visa.customerPhone || '',
          createdAt: formatDate(visa.createdAt),
          status: visa.status || ''
        });
      } catch (rowError) {
        console.error(`خطأ في إضافة صف ${index}:`, rowError);
      }
    });

    console.log('جاري تنسيق الملف...');
    // تنسيق صف العنوان
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // تنسيق أعمدة العملة
    worksheet.getColumn('totalExpenses').numFmt = '#,##0.00';
    worksheet.getColumn('sellingPrice').numFmt = '#,##0.00';
    worksheet.getColumn('profit').numFmt = '#,##0.00';
    worksheet.getColumn('secretaryEarnings').numFmt = '#,##0.00';
    worksheet.getColumn('companyProfit').numFmt = '#,##0.00';
    worksheet.getColumn('sellingCommission').numFmt = '#,##0.00';

    // تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=visas-all-${moment().format('YYYY-MM-DD')}.xlsx`);

    console.log('جاري كتابة الملف...');
    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
    console.log('تم تصدير الملف بنجاح');
  } catch (error) {
    console.error('خطأ في تصدير التأشيرات:', error);
    res.status(500).json({ message: `خطأ في تصدير البيانات: ${error.message}` });
  }
});

// تصدير التأشيرات حسب الحالة
router.get('/visas/:status', async (req, res) => {
  try {
    const { status } = req.params;
    const { secretary } = req.query;
    
    let filter = { status };
    if (secretary) {
      filter.secretary = secretary;
    }

    const visas = await Visa.find(filter)
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('التأشيرات');

    // تعريف الأعمدة
    worksheet.columns = [
      { header: 'المرجع', key: 'reference', width: 15 },
      { header: 'الاسم', key: 'name', width: 25 },
      { header: 'تاريخ الميلاد', key: 'dateOfBirth', width: 15 },
      { header: 'الجنسية', key: 'nationality', width: 15 },
      { header: 'رقم الجواز', key: 'passportNumber', width: 20 },
      { header: 'رقم التأشيرة', key: 'visaNumber', width: 20 },
      { header: 'السكرتيرة', key: 'secretary', width: 20 },
      { header: 'المرحلة الحالية', key: 'currentStage', width: 15 },
      { header: 'تاريخ إصدار التأشيرة', key: 'visaIssueDate', width: 15 },
      { header: 'تاريخ انتهاء التأشيرة', key: 'visaExpiryDate', width: 15 },
      { header: 'الموعد النهائي', key: 'visaDeadline', width: 15 },
      { header: 'إجمالي المصروفات', key: 'totalExpenses', width: 15 },
      { header: 'سعر البيع', key: 'sellingPrice', width: 15 },
      { header: 'الربح', key: 'profit', width: 15 },
      { header: 'أرباح السكرتيرة', key: 'secretaryEarnings', width: 20 },
      { header: 'ربح الشركة', key: 'companyProfit', width: 15 },
      { header: 'سكرتيرة البيع', key: 'sellingSecretary', width: 20 },
      { header: 'عمولة البيع', key: 'sellingCommission', width: 15 },
      { header: 'اسم العميل', key: 'customerName', width: 25 },
      { header: 'هاتف العميل', key: 'customerPhone', width: 20 },
      { header: 'تاريخ الإنشاء', key: 'createdAt', width: 15 },
      { header: 'الحالة', key: 'status', width: 15 }
    ];

    // إضافة البيانات
    visas.forEach(visa => {
      const reference = `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`;
      
             worksheet.addRow({
         reference,
         name: visa.name || '',
         dateOfBirth: formatDate(visa.dateOfBirth),
         nationality: visa.nationality || '',
         passportNumber: visa.passportNumber || '',
         visaNumber: visa.visaNumber || '',
         secretary: visa.secretary ? visa.secretary.name : '',
         currentStage: visa.currentStage || '',
         visaIssueDate: formatDate(visa.visaIssueDate),
         visaExpiryDate: formatDate(visa.visaExpiryDate),
         visaDeadline: formatDate(visa.visaDeadline),
         totalExpenses: visa.totalExpenses || 0,
         sellingPrice: visa.sellingPrice || 0,
         profit: visa.profit || 0,
         secretaryEarnings: visa.secretaryEarnings || 0,
         companyProfit: (visa.profit || 0) - (visa.secretaryEarnings || 0),
         sellingSecretary: visa.sellingSecretary ? 'نعم' : 'لا',
         sellingCommission: visa.sellingCommission || 0,
         customerName: visa.customerName || '',
         customerPhone: visa.customerPhone || '',
         createdAt: formatDate(visa.createdAt),
         status: visa.status || ''
       });
    });

    // تنسيق صف العنوان
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // تنسيق أعمدة العملة
    worksheet.getColumn('totalExpenses').numFmt = '#,##0.00';
    worksheet.getColumn('sellingPrice').numFmt = '#,##0.00';
    worksheet.getColumn('profit').numFmt = '#,##0.00';
    worksheet.getColumn('secretaryEarnings').numFmt = '#,##0.00';
    worksheet.getColumn('companyProfit').numFmt = '#,##0.00';
    worksheet.getColumn('sellingCommission').numFmt = '#,##0.00';

    // تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=visas-${status}-${moment().format('YYYY-MM-DD')}.xlsx`);

    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تصدير تقرير السكرتيرة
router.get('/secretary/:id', async (req, res) => {
  try {
    const secretary = await Secretary.findById(req.params.id);
    if (!secretary) {
      return res.status(404).json({ message: 'السكرتيرة غير موجودة' });
    }

    const visas = await Visa.find({ secretary: req.params.id })
      .populate('secretary', 'name code')
      .sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(`تقرير ${secretary.name}`);

    // إضافة قسم الملخص
    worksheet.addRow(['تقرير السكرتيرة']);
    worksheet.addRow(['']);
    worksheet.addRow(['الاسم:', secretary.name]);
    worksheet.addRow(['الرمز:', secretary.code]);
    worksheet.addRow(['إجمالي الأرباح:', secretary.totalEarnings]);
    worksheet.addRow(['إجمالي الدين:', secretary.totalDebt]);
    worksheet.addRow(['']);

    // إضافة الإحصائيات
    const activeVisas = visas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = visas.filter(v => v.status === 'معروضة_للبيع');
    const soldVisas = visas.filter(v => v.status === 'مباعة');
    const cancelledVisas = visas.filter(v => v.status === 'ملغاة');

    worksheet.addRow(['الإحصائيات']);
    worksheet.addRow(['التأشيرات النشطة:', activeVisas.length]);
    worksheet.addRow(['المعروضة للبيع:', availableVisas.length]);
    worksheet.addRow(['التأشيرات المباعة:', soldVisas.length]);
    worksheet.addRow(['التأشيرات الملغاة:', cancelledVisas.length]);
    worksheet.addRow(['']);

    // إضافة تفاصيل التأشيرات
    worksheet.addRow(['تفاصيل التأشيرات']);
    worksheet.addRow(['']);

    // تعريف الأعمدة لتفاصيل التأشيرات
    worksheet.addRow([
      'المرجع', 'الاسم', 'الحالة', 'المرحلة الحالية', 'إجمالي المصروفات',
      'سعر البيع', 'الربح', 'أرباح السكرتيرة', 'اسم العميل',
      'تاريخ الإنشاء', 'تاريخ الإكمال', 'تاريخ البيع'
    ]);

    // إضافة بيانات التأشيرات
    visas.forEach(visa => {
      const reference = `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`;
      
      worksheet.addRow([
        reference,
        visa.name,
        visa.status,
        visa.currentStage,
        visa.totalExpenses,
        visa.sellingPrice || 0,
        visa.profit || 0,
        visa.secretaryEarnings || 0,
        visa.customerName || '',
        moment(visa.createdAt).format('DD/MM/YYYY'),
        visa.completedAt ? moment(visa.completedAt).format('DD/MM/YYYY') : '',
        visa.soldAt ? moment(visa.soldAt).format('DD/MM/YYYY') : ''
      ]);
    });

    // تنسيق ورقة العمل
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 16 };

    const statsHeader = worksheet.getRow(10);
    statsHeader.font = { bold: true };

    const visaHeader = worksheet.getRow(17);
    visaHeader.font = { bold: true };
    visaHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // تنسيق أعمدة العملة
    const currencyColumns = ['E', 'F', 'G', 'H'];
    currencyColumns.forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0.00';
    });

    // تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=secretary-${secretary.code}-${moment().format('YYYY-MM-DD')}.xlsx`);

    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تصدير التقرير المالي للشركة
router.get('/company-report', async (req, res) => {
  try {
    const allVisas = await Visa.find().populate('secretary', 'name code');
    const secretaries = await Secretary.find();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير الشركة');

    // إضافة ملخص الشركة
    worksheet.addRow(['تقرير شركة فرصتكم']);
    worksheet.addRow(['']);
    worksheet.addRow(['تاريخ التوليد:', moment().format('DD/MM/YYYY HH:mm')]);
    worksheet.addRow(['']);

    // حساب الإحصائيات
    const soldVisas = allVisas.filter(v => v.status === 'مباعة');
    const cancelledVisas = allVisas.filter(v => v.status === 'ملغاة');
    const activeVisas = allVisas.filter(v => v.status === 'قيد_الشراء');
    const availableVisas = allVisas.filter(v => v.status === 'معروضة_للبيع');

    const totalExpenses = allVisas.reduce((sum, visa) => sum + visa.totalExpenses, 0);
    const totalProfit = soldVisas.reduce((sum, visa) => sum + visa.profit, 0);
    const totalSecretaryEarnings = soldVisas.reduce((sum, visa) => sum + visa.secretaryEarnings, 0);
    const totalCompanyProfit = totalProfit - totalSecretaryEarnings;
    const totalSecretaryDebt = secretaries.reduce((sum, sec) => sum + sec.totalDebt, 0);

    // إضافة إحصائيات الملخص
    worksheet.addRow(['إحصائيات الملخص']);
    worksheet.addRow(['إجمالي التأشيرات:', allVisas.length]);
    worksheet.addRow(['التأشيرات النشطة:', activeVisas.length]);
    worksheet.addRow(['المعروضة للبيع:', availableVisas.length]);
    worksheet.addRow(['التأشيرات المباعة:', soldVisas.length]);
    worksheet.addRow(['التأشيرات الملغاة:', cancelledVisas.length]);
    worksheet.addRow(['إجمالي المصروفات:', totalExpenses]);
    worksheet.addRow(['إجمالي الربح:', totalProfit]);
    worksheet.addRow(['إجمالي أرباح السكرتارية:', totalSecretaryEarnings]);
    worksheet.addRow(['ربح الشركة:', totalCompanyProfit]);
    worksheet.addRow(['إجمالي ديون السكرتارية:', totalSecretaryDebt]);
    worksheet.addRow(['متوسط الربح لكل تأشيرة:', soldVisas.length > 0 ? totalProfit / soldVisas.length : 0]);
    worksheet.addRow(['']);

    // إضافة ملخص السكرتارية
    worksheet.addRow(['ملخص السكرتارية']);
    worksheet.addRow(['الاسم', 'الرمز', 'إجمالي التأشيرات', 'التأشيرات المباعة', 'إجمالي الأرباح', 'إجمالي الدين']);

    secretaries.forEach(secretary => {
      const secretaryVisas = allVisas.filter(v => v.secretary._id.toString() === secretary._id.toString());
      const secretarySoldVisas = secretaryVisas.filter(v => v.status === 'مباعة');
      const secretaryEarnings = secretarySoldVisas.reduce((sum, v) => sum + v.secretaryEarnings, 0);

      worksheet.addRow([
        secretary.name,
        secretary.code,
        secretaryVisas.length,
        secretarySoldVisas.length,
        secretaryEarnings,
        secretary.totalDebt
      ]);
    });

    worksheet.addRow(['']);

    // إضافة قائمة التأشيرات التفصيلية
    worksheet.addRow(['قائمة التأشيرات التفصيلية']);
    worksheet.addRow(['']);

    // تعريف الأعمدة
    worksheet.addRow([
      'المرجع', 'الاسم', 'السكرتيرة', 'الحالة', 'إجمالي المصروفات',
      'سعر البيع', 'الربح', 'أرباح السكرتيرة', 'ربح الشركة',
      'اسم العميل', 'تاريخ الإنشاء', 'تاريخ البيع'
    ]);

    // إضافة بيانات التأشيرات
    allVisas.forEach(visa => {
      const reference = `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`;
      const companyProfit = visa.profit ? visa.profit - visa.secretaryEarnings : 0;
      
      worksheet.addRow([
        reference,
        visa.name,
        visa.secretary.name,
        visa.status,
        visa.totalExpenses,
        visa.sellingPrice || 0,
        visa.profit || 0,
        visa.secretaryEarnings || 0,
        companyProfit,
        visa.customerName || '',
        moment(visa.createdAt).format('DD/MM/YYYY'),
        visa.soldAt ? moment(visa.soldAt).format('DD/MM/YYYY') : ''
      ]);
    });

    // تنسيق ورقة العمل
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };

    const summaryHeader = worksheet.getRow(6);
    summaryHeader.font = { bold: true };

    const secretaryHeader = worksheet.getRow(20);
    secretaryHeader.font = { bold: true };
    secretaryHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    const visaHeader = worksheet.getRow(28 + secretaries.length);
    visaHeader.font = { bold: true };
    visaHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // تنسيق أعمدة العملة
    const currencyColumns = ['G', 'H', 'I', 'J', 'K', 'L', 'M'];
    currencyColumns.forEach(col => {
      worksheet.getColumn(col).numFmt = '#,##0.00';
    });

    // تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=company-report-${moment().format('YYYY-MM-DD')}.xlsx`);

    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// تصدير تقرير المصروفات
router.get('/expenses/:visaId', async (req, res) => {
  try {
    const visa = await Visa.findById(req.params.visaId)
      .populate('secretary', 'name code');
    
    if (!visa) {
      return res.status(404).json({ message: 'التأشيرة غير موجودة' });
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('تقرير المصروفات');

    // إضافة معلومات التأشيرة
    worksheet.addRow(['تقرير مصروفات التأشيرة']);
    worksheet.addRow(['']);
    worksheet.addRow(['المرجع:', `${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}`]);
    worksheet.addRow(['الاسم:', visa.name]);
          worksheet.addRow(['السكرتيرة:', visa.secretary.name]);
    worksheet.addRow(['الحالة:', visa.status]);
    worksheet.addRow(['إجمالي المصروفات:', visa.totalExpenses]);
    worksheet.addRow(['']);

    // إضافة المصروفات حسب المرحلة
    const stages = [
      { name: 'المرحلة أ', expenses: visa.stageAExpenses },
      { name: 'المرحلة ب', expenses: visa.stageBExpenses },
      { name: 'المرحلة ج', expenses: visa.stageCExpenses },
      { name: 'المرحلة د', expenses: visa.stageDExpenses },
      { name: 'الاستبدال', expenses: visa.replacementExpenses }
    ];

    stages.forEach(stage => {
      if (stage.expenses.length > 0) {
        worksheet.addRow([stage.name]);
        worksheet.addRow(['التاريخ', 'الوصف', 'المبلغ']);
        
        stage.expenses.forEach(expense => {
          worksheet.addRow([
            moment(expense.date).format('DD/MM/YYYY'),
            expense.description,
            expense.amount
          ]);
        });
        
        const stageTotal = stage.expenses.reduce((sum, exp) => sum + exp.amount, 0);
        worksheet.addRow(['', 'الإجمالي:', stageTotal]);
        worksheet.addRow(['']);
      }
    });

    // تنسيق ورقة العمل
    const titleRow = worksheet.getRow(1);
    titleRow.font = { bold: true, size: 16 };

    // تنسيق عمود العملة
    worksheet.getColumn('C').numFmt = '#,##0.00';

    // تعيين رؤوس الاستجابة
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=expenses-${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}-${moment().format('YYYY-MM-DD')}.xlsx`);

    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


// Rental exports
router.get('/rental-secretaries', async (req, res) => {
  try {
    const secretaries = await RentingSecretary.find().sort({ createdAt: -1 });
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('سكرتارية التأجير');

    worksheet.columns = [
      { header: bilingualHeader('الاسم', 'Name'), key: 'name', width: 25 },
      { header: bilingualHeader('الهاتف', 'Phone'), key: 'phone', width: 18 },
      { header: bilingualHeader('البريد الإلكتروني', 'Email'), key: 'email', width: 25 },
      { header: bilingualHeader('العنوان', 'Address'), key: 'address', width: 30 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 12 },
      { header: bilingualHeader('عدد المستندات', 'Documents Count'), key: 'docs', width: 18 },
      { header: bilingualHeader('تاريخ الإنشاء', 'Created At'), key: 'createdAt', width: 18 },
    ];

    secretaries.forEach((sec) => {
      worksheet.addRow({
        name: sec.name,
        phone: sec.phone,
        email: sec.email || '',
        address: sec.address || '',
        status: sec.status,
        docs: (sec.documents || []).length,
        createdAt: formatDate(sec.createdAt),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-secretaries-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير سكرتارية التأجير', error: error.message });
  }
});

router.get('/rental-units', async (req, res) => {
  try {
    const units = await RentalUnit.find()
      .populate('currentContract', 'referenceNumber status startDate')
      .sort({ unitNumber: 1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الوحدات المؤجرة');

    worksheet.columns = [
      { header: bilingualHeader('رقم الوحدة', 'Unit Number'), key: 'unitNumber', width: 18 },
      { header: bilingualHeader('نوع الوحدة', 'Type'), key: 'unitType', width: 20 },
      { header: bilingualHeader('العنوان', 'Address'), key: 'address', width: 30 },
      { header: bilingualHeader('الإيجار الشهري (د.ك)', 'Monthly Rent (KWD)'), key: 'rentAmount', width: 20 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 15 },
      { header: bilingualHeader('رقم العقد الحالي', 'Current Contract'), key: 'contract', width: 20 },
      { header: bilingualHeader('تاريخ آخر تحديث', 'Updated At'), key: 'updatedAt', width: 18 },
    ];

    worksheet.getColumn('rentAmount').numFmt = '#,##0.000';

    units.forEach((unit) => {
      worksheet.addRow({
        unitNumber: unit.unitNumber,
        unitType: unit.unitType,
        address: unit.address,
        rentAmount: unit.rentAmount,
        status: unit.status,
        contract: unit.currentContract ? unit.currentContract.referenceNumber : '',
        updatedAt: formatDate(unit.updatedAt),
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-units-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير الوحدات', error: error.message });
  }
});

router.get('/rental-contracts', async (req, res) => {
  try {
    const contracts = await RentalContract.find()
      .populate('unitId', 'unitNumber unitType address')
      .populate('rentalSecretaryId', 'name phone');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('عقود التأجير');

    worksheet.columns = [
      { header: bilingualHeader('رقم المرجع', 'Reference'), key: 'reference', width: 18 },
      { header: bilingualHeader('الوحدة', 'Unit'), key: 'unit', width: 18 },
      { header: bilingualHeader('نوع الوحدة', 'Unit Type'), key: 'unitType', width: 18 },
      { header: bilingualHeader('السكرتير', 'Secretary'), key: 'secretary', width: 20 },
      { header: bilingualHeader('الإيجار الشهري (د.ك)', 'Rent (KWD)'), key: 'rent', width: 18 },
      { header: bilingualHeader('تاريخ البدء', 'Start Date'), key: 'startDate', width: 15 },
      { header: bilingualHeader('عدد الشهور', 'Duration (Months)'), key: 'duration', width: 18 },
      { header: bilingualHeader('يوم الاستحقاق', 'Due Day'), key: 'dueDay', width: 15 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 12 },
    ];

    worksheet.getColumn('rent').numFmt = '#,##0.000';

    contracts.forEach((contract) => {
      worksheet.addRow({
        reference: contract.referenceNumber,
        unit: contract.unitId ? contract.unitId.unitNumber : contract.unitSnapshot?.unitNumber,
        unitType: contract.unitId ? contract.unitId.unitType : contract.unitSnapshot?.unitType,
        secretary: contract.rentalSecretaryId ? contract.rentalSecretaryId.name : contract.secretarySnapshot?.name,
        rent: contract.rentAmount,
        startDate: formatDate(contract.startDate),
        duration: contract.durationMonths,
        dueDay: contract.dueDay,
        status: contract.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-contracts-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير العقود', error: error.message });
  }
});

router.get('/rental-payments', async (req, res) => {
  try {
    const payments = await RentalPayment.find()
      .populate({
        path: 'contractId',
        populate: [
          { path: 'unitId', select: 'unitNumber unitType' },
          { path: 'rentalSecretaryId', select: 'name phone' },
        ],
      })
      .sort({ paymentDate: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('مدفوعات التأجير');

    worksheet.columns = [
      { header: bilingualHeader('التاريخ', 'Date'), key: 'date', width: 18 },
      { header: bilingualHeader('الشهر', 'Month'), key: 'month', width: 12 },
      { header: bilingualHeader('رقم العقد', 'Contract Ref'), key: 'contract', width: 20 },
      { header: bilingualHeader('الوحدة', 'Unit'), key: 'unit', width: 18 },
      { header: bilingualHeader('السكرتير', 'Secretary'), key: 'secretary', width: 20 },
      { header: bilingualHeader('المبلغ (د.ك)', 'Amount (KWD)'), key: 'amount', width: 18 },
      { header: bilingualHeader('طريقة الدفع', 'Method'), key: 'method', width: 15 },
      { header: bilingualHeader('مرجع العملية', 'Transaction Ref'), key: 'transaction', width: 22 },
      { header: bilingualHeader('المتبقي', 'Remaining'), key: 'remaining', width: 15 },
    ];

    worksheet.getColumn('amount').numFmt = '#,##0.000';
    worksheet.getColumn('remaining').numFmt = '#,##0.000';

    payments.forEach((payment) => {
      worksheet.addRow({
        date: formatDate(payment.paymentDate),
        month: payment.monthYear,
        contract: payment.contractId?.referenceNumber,
        unit: payment.contractId?.unitId?.unitNumber || payment.contractId?.unitSnapshot?.unitNumber,
        secretary: payment.contractId?.rentalSecretaryId?.name || payment.contractId?.secretarySnapshot?.name,
        amount: payment.amount,
        method: payment.method,
        transaction: payment.transactionRef || '',
        remaining: payment.remainingBalance,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-payments-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير المدفوعات', error: error.message });
  }
});

router.get('/rental-management', async (req, res) => {
  try {
    const contracts = await RentalContract.find()
      .populate('unitId', 'unitNumber unitType')
      .populate('rentalSecretaryId', 'name phone');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('إدارة الإيجارات');

    worksheet.columns = [
      { header: bilingualHeader('الشهر', 'Month'), key: 'monthYear', width: 12 },
      { header: bilingualHeader('تاريخ الاستحقاق', 'Due Date'), key: 'dueDate', width: 18 },
      { header: bilingualHeader('الوحدة', 'Unit'), key: 'unit', width: 18 },
      { header: bilingualHeader('السكرتير', 'Secretary'), key: 'secretary', width: 20 },
      { header: bilingualHeader('المبلغ المستحق (د.ك)', 'Due Amount (KWD)'), key: 'dueAmount', width: 22 },
      { header: bilingualHeader('المدفوع', 'Paid'), key: 'paid', width: 18 },
      { header: bilingualHeader('المتبقي', 'Remaining'), key: 'remaining', width: 18 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 15 },
    ];

    worksheet.getColumn('dueAmount').numFmt = '#,##0.000';
    worksheet.getColumn('paid').numFmt = '#,##0.000';
    worksheet.getColumn('remaining').numFmt = '#,##0.000';

    contracts.forEach((contract) => {
      contract.months.forEach((month) => {
        worksheet.addRow({
          monthYear: month.monthYear,
          dueDate: formatDate(month.dueDate),
          unit: contract.unitId ? contract.unitId.unitNumber : contract.unitSnapshot?.unitNumber,
          secretary: contract.rentalSecretaryId ? contract.rentalSecretaryId.name : contract.secretarySnapshot?.name,
          dueAmount: month.dueAmount,
          paid: month.totalPaid,
          remaining: month.remainingAmount,
          status: month.status,
        });
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-management-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير إدارة الإيجارات', error: error.message });
  }
});

router.get('/rental-accounting', async (req, res) => {
  try {
    const targetMonth = req.query.month || moment().format('YYYY-MM');
    const contracts = await RentalContract.find()
      .populate('unitId', 'unitNumber unitType')
      .populate('rentalSecretaryId', 'name phone');

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('محاسبة التأجير');

    worksheet.columns = [
      { header: bilingualHeader('الشهر', 'Month'), key: 'month', width: 12 },
      { header: bilingualHeader('الوحدة', 'Unit'), key: 'unit', width: 18 },
      { header: bilingualHeader('السكرتير', 'Secretary'), key: 'secretary', width: 20 },
      { header: bilingualHeader('المبلغ المتوقع (د.ك)', 'Expected (KWD)'), key: 'expected', width: 22 },
      { header: bilingualHeader('المبلغ المدفوع', 'Paid Amount'), key: 'paid', width: 18 },
      { header: bilingualHeader('المتبقي', 'Remaining'), key: 'remaining', width: 18 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 15 },
    ];

    worksheet.getColumn('expected').numFmt = '#,##0.000';
    worksheet.getColumn('paid').numFmt = '#,##0.000';
    worksheet.getColumn('remaining').numFmt = '#,##0.000';

    contracts.forEach((contract) => {
      const monthEntry = contract.months.find((m) => m.monthYear === targetMonth);
      if (!monthEntry) return;

      worksheet.addRow({
        month: targetMonth,
        unit: contract.unitId ? contract.unitId.unitNumber : contract.unitSnapshot?.unitNumber,
        secretary: contract.rentalSecretaryId ? contract.rentalSecretaryId.name : contract.secretarySnapshot?.name,
        expected: monthEntry.dueAmount,
        paid: monthEntry.totalPaid,
        remaining: monthEntry.remainingAmount,
        status: monthEntry.status,
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=rental-accounting-${targetMonth}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير محاسبة التأجير', error: error.message });
  }
});

// ==================== HOME SERVICE EXPORTS ====================

const HSInvoice = require('../models/HSInvoice');
const HSTransaction = require('../models/HSTransaction');
const HSAccount = require('../models/HSAccount');
const FursatkumInvoice = require('../models/FursatkumInvoice');
const FursatkumTransaction = require('../models/FursatkumTransaction');
const FursatkumAccount = require('../models/FursatkumAccount');

// Export Home Service Invoices
router.get('/home-service/invoices', async (req, res) => {
  try {
    const { type, status = 'active' } = req.query;
    const filters = { status };
    if (type && type !== 'all') {
      filters.type = type;
    }

    const invoices = await HSInvoice.find(filters)
      .populate('createdBy', 'username')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('فواتير الخدمات المنزلية');

    worksheet.columns = [
      { header: bilingualHeader('رقم المرجع', 'Reference'), key: 'reference', width: 15 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 15 },
      { header: bilingualHeader('الاسم', 'Name'), key: 'name', width: 25 },
      { header: bilingualHeader('القيمة (د.ك)', 'Value (KWD)'), key: 'value', width: 18 },
      { header: bilingualHeader('التاريخ', 'Date'), key: 'date', width: 15 },
      { header: bilingualHeader('التفاصيل', 'Details'), key: 'details', width: 30 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 12 },
      { header: bilingualHeader('تم التعديل', 'Edited'), key: 'isEdited', width: 12 },
      { header: bilingualHeader('أنشأها', 'Created By'), key: 'createdBy', width: 18 },
      { header: bilingualHeader('تاريخ الإنشاء', 'Created At'), key: 'createdAt', width: 18 },
    ];

    worksheet.getColumn('value').numFmt = '#,##0.000';

    const typeLabels = {
      income: 'فاتورة دخل / Income',
      spending: 'إيصال صرف / Spending',
    };

    const statusLabels = {
      active: 'نشط / Active',
      deleted: 'محذوف / Deleted',
    };

    invoices.forEach((invoice) => {
      worksheet.addRow({
        reference: invoice.referenceNumber,
        type: typeLabels[invoice.type] || invoice.type,
        name: invoice.name,
        value: invoice.value,
        date: formatDate(invoice.date),
        details: invoice.details || '',
        status: statusLabels[invoice.status] || invoice.status,
        isEdited: invoice.isEdited ? 'نعم / Yes' : 'لا / No',
        createdBy: invoice.createdBy ? invoice.createdBy.username : '',
        createdAt: formatDate(invoice.createdAt),
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=home-service-invoices-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير الفواتير', error: error.message });
  }
});

// Export Home Service Deleted Invoices
router.get('/home-service/deleted', async (req, res) => {
  try {
    const invoices = await HSInvoice.find({ status: 'deleted' })
      .populate('createdBy', 'username')
      .populate('deletedBy', 'username')
      .sort({ deletedAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الفواتير المحذوفة');

    worksheet.columns = [
      { header: bilingualHeader('رقم المرجع', 'Reference'), key: 'reference', width: 15 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 15 },
      { header: bilingualHeader('الاسم', 'Name'), key: 'name', width: 25 },
      { header: bilingualHeader('القيمة (د.ك)', 'Value (KWD)'), key: 'value', width: 18 },
      { header: bilingualHeader('تاريخ الفاتورة', 'Invoice Date'), key: 'date', width: 15 },
      { header: bilingualHeader('التفاصيل', 'Details'), key: 'details', width: 30 },
      { header: bilingualHeader('أنشأها', 'Created By'), key: 'createdBy', width: 18 },
      { header: bilingualHeader('حذفها', 'Deleted By'), key: 'deletedBy', width: 18 },
      { header: bilingualHeader('تاريخ الحذف', 'Deleted At'), key: 'deletedAt', width: 18 },
    ];

    worksheet.getColumn('value').numFmt = '#,##0.000';

    const typeLabels = {
      income: 'فاتورة دخل / Income',
      spending: 'إيصال صرف / Spending',
    };

    invoices.forEach((invoice) => {
      worksheet.addRow({
        reference: invoice.referenceNumber,
        type: typeLabels[invoice.type] || invoice.type,
        name: invoice.name,
        value: invoice.value,
        date: formatDate(invoice.date),
        details: invoice.details || '',
        createdBy: invoice.createdBy ? invoice.createdBy.username : '',
        deletedBy: invoice.deletedBy ? invoice.deletedBy.username : '',
        deletedAt: formatDate(invoice.deletedAt),
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=home-service-deleted-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير الفواتير المحذوفة', error: error.message });
  }
});

// Export Home Service Accounting
router.get('/home-service/accounting', async (req, res) => {
  try {
    const account = await HSAccount.getAccount();
    const transactions = await HSTransaction.find()
      .populate('performedBy', 'username')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    
    const summarySheet = workbook.addWorksheet('ملخص المحاسبة');
    summarySheet.addRow([bilingualHeader('ملخص المحاسبة', 'Accounting Summary')]);
    summarySheet.addRow([]);
    summarySheet.addRow([bilingualHeader('رصيد التمويل', 'Funding Credit'), account.fundingCredit]);
    summarySheet.addRow([bilingualHeader('أرباح الدخل', 'Income Profit'), account.incomeProfit]);
    summarySheet.addRow([]);
    summarySheet.addRow([bilingualHeader('تاريخ التصدير', 'Export Date'), formatDate(new Date())]);
    
    summarySheet.getRow(1).font = { bold: true, size: 14 };
    summarySheet.getColumn(2).numFmt = '#,##0.000';

    const transSheet = workbook.addWorksheet('سجل المعاملات');
    transSheet.columns = [
      { header: bilingualHeader('التاريخ', 'Date'), key: 'date', width: 18 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 20 },
      { header: bilingualHeader('الفئة', 'Category'), key: 'category', width: 15 },
      { header: bilingualHeader('المبلغ', 'Amount'), key: 'amount', width: 18 },
      { header: bilingualHeader('الرصيد بعد', 'Balance After'), key: 'balanceAfter', width: 18 },
      { header: bilingualHeader('رقم الفاتورة', 'Invoice Ref'), key: 'invoiceRef', width: 15 },
      { header: bilingualHeader('الوصف', 'Description'), key: 'description', width: 35 },
      { header: bilingualHeader('بواسطة', 'By'), key: 'performedBy', width: 18 },
    ];

    transSheet.getColumn('amount').numFmt = '#,##0.000';
    transSheet.getColumn('balanceAfter').numFmt = '#,##0.000';

    const typeLabels = {
      add_funds: 'إضافة رصيد / Add Funds',
      income: 'دخل / Income',
      spending: 'صرف / Spending',
      income_reversal: 'عكس دخل / Income Reversal',
      spending_reversal: 'عكس صرف / Spending Reversal',
      income_adjustment: 'تعديل دخل / Income Adjustment',
      spending_adjustment: 'تعديل صرف / Spending Adjustment',
    };

    const categoryLabels = {
      funding: 'تمويل / Funding',
      income: 'دخل / Income',
    };

    transactions.forEach((trans) => {
      transSheet.addRow({
        date: formatDate(trans.date),
        type: typeLabels[trans.type] || trans.type,
        category: categoryLabels[trans.category] || trans.category,
        amount: trans.amount,
        balanceAfter: trans.balanceAfter,
        invoiceRef: trans.invoiceRef || '',
        description: trans.description || '',
        performedBy: trans.performedBy ? trans.performedBy.username : '',
      });
    });

    const headerRow = transSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=home-service-accounting-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير المحاسبة', error: error.message });
  }
});

// ==================== FURSATKUM ACCOUNTING EXPORTS ====================

// Export Fursatkum Invoices
router.get('/fursatkum/invoices', async (req, res) => {
  try {
    const { type, ledger, status = 'active' } = req.query;
    const filters = { status };
    if (type && type !== 'all') filters.type = type;
    if (ledger && ledger !== 'all') filters.ledger = ledger;

    const invoices = await FursatkumInvoice.find(filters)
      .populate('createdBy', 'username')
      .sort({ date: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('فواتير فرصتكم');

    worksheet.columns = [
      { header: bilingualHeader('رقم المرجع', 'Reference'), key: 'reference', width: 16 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 14 },
      { header: bilingualHeader('الدفة', 'Ledger'), key: 'ledger', width: 14 },
      { header: bilingualHeader('الاسم', 'Name'), key: 'name', width: 25 },
      { header: bilingualHeader('القيمة (د.ك)', 'Value (KWD)'), key: 'value', width: 16 },
      { header: bilingualHeader('المرجع البنكي', 'Bank Ref'), key: 'bankRef', width: 18 },
      { header: bilingualHeader('التاريخ', 'Date'), key: 'date', width: 14 },
      { header: bilingualHeader('التفاصيل', 'Details'), key: 'details', width: 32 },
      { header: bilingualHeader('الحالة', 'Status'), key: 'status', width: 12 },
      { header: bilingualHeader('تم التعديل', 'Edited'), key: 'isEdited', width: 12 },
      { header: bilingualHeader('أنشأها', 'Created By'), key: 'createdBy', width: 16 },
    ];

    worksheet.getColumn('value').numFmt = '#,##0.000';

    const typeLabels = {
      income: 'فاتورة دخل / Income',
      spending: 'إيصال صرف / Spending',
    };
    const ledgerLabels = {
      bank: 'حساب بنكي / Bank',
      cash: 'صندوق نقدي / Cash',
    };
    const statusLabels = {
      active: 'نشط / Active',
      deleted: 'محذوف / Deleted',
    };

    invoices.forEach((invoice) => {
      worksheet.addRow({
        reference: invoice.referenceNumber,
        type: typeLabels[invoice.type] || invoice.type,
        ledger: ledgerLabels[invoice.ledger] || invoice.ledger,
        name: invoice.name,
        value: invoice.value,
        bankRef: invoice.ledger === 'bank' ? (invoice.bankReference || '') : '',
        date: formatDate(invoice.date),
        details: invoice.details || '',
        status: statusLabels[invoice.status] || invoice.status,
        isEdited: invoice.isEdited ? 'نعم / Yes' : 'لا / No',
        createdBy: invoice.createdBy ? invoice.createdBy.username : '',
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=fursatkum-invoices-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير فواتير فرصتكم', error: error.message });
  }
});

// Export Fursatkum Deleted Invoices
router.get('/fursatkum/deleted', async (req, res) => {
  try {
    const invoices = await FursatkumInvoice.find({ status: 'deleted' })
      .populate('createdBy', 'username')
      .populate('deletedBy', 'username')
      .sort({ deletedAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('الفواتير المحذوفة');

    worksheet.columns = [
      { header: bilingualHeader('رقم المرجع', 'Reference'), key: 'reference', width: 16 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 14 },
      { header: bilingualHeader('الدفة', 'Ledger'), key: 'ledger', width: 14 },
      { header: bilingualHeader('الاسم', 'Name'), key: 'name', width: 25 },
      { header: bilingualHeader('القيمة (د.ك)', 'Value (KWD)'), key: 'value', width: 16 },
      { header: bilingualHeader('المرجع البنكي', 'Bank Ref'), key: 'bankRef', width: 18 },
      { header: bilingualHeader('تاريخ الفاتورة', 'Invoice Date'), key: 'date', width: 14 },
      { header: bilingualHeader('سبب الحذف', 'Delete Reason'), key: 'reason', width: 28 },
      { header: bilingualHeader('أنشأها', 'Created By'), key: 'createdBy', width: 16 },
      { header: bilingualHeader('حذفها', 'Deleted By'), key: 'deletedBy', width: 16 },
      { header: bilingualHeader('تاريخ الحذف', 'Deleted At'), key: 'deletedAt', width: 16 },
    ];

    worksheet.getColumn('value').numFmt = '#,##0.000';

    const typeLabels = { income: 'فاتورة دخل / Income', spending: 'إيصال صرف / Spending' };
    const ledgerLabels = { bank: 'حساب بنكي / Bank', cash: 'صندوق نقدي / Cash' };

    invoices.forEach((invoice) => {
      worksheet.addRow({
        reference: invoice.referenceNumber,
        type: typeLabels[invoice.type] || invoice.type,
        ledger: ledgerLabels[invoice.ledger] || invoice.ledger,
        name: invoice.name,
        value: invoice.value,
        bankRef: invoice.ledger === 'bank' ? (invoice.bankReference || '') : '',
        date: formatDate(invoice.date),
        reason: invoice.deleteReason || '',
        createdBy: invoice.createdBy ? invoice.createdBy.username : '',
        deletedBy: invoice.deletedBy ? invoice.deletedBy.username : '',
        deletedAt: formatDate(invoice.deletedAt),
      });
    });

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=fursatkum-deleted-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير الفواتير المحذوفة', error: error.message });
  }
});

// Export Fursatkum Accounting Summary & Transactions
router.get('/fursatkum/accounting', async (req, res) => {
  try {
    const account = await FursatkumAccount.getAccount();
    const transactions = await FursatkumTransaction.find()
      .populate('performedBy', 'username')
      .sort({ date: -1 });

    const [incomeAgg, spendingAgg] = await Promise.all([
      FursatkumInvoice.aggregate([
        { $match: { type: 'income', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
      FursatkumInvoice.aggregate([
        { $match: { type: 'spending', status: 'active' } },
        { $group: { _id: null, total: { $sum: '$value' } } },
      ]),
    ]);

    const totalIncome = incomeAgg.length ? incomeAgg[0].total : 0;
    const totalSpendings = spendingAgg.length ? spendingAgg[0].total : 0;

    const workbook = new ExcelJS.Workbook();

    const summarySheet = workbook.addWorksheet('ملخص المحاسبة');
    summarySheet.addRow([bilingualHeader('ملخص المحاسبة - فرصتكم', 'Fursatkum Accounting Summary')]);
    summarySheet.addRow([]);
    summarySheet.addRow([bilingualHeader('رصيد البنك', 'Bank Balance'), account.bankBalance]);
    summarySheet.addRow([bilingualHeader('رصيد الصندوق', 'Cash Balance'), account.cashBalance]);
    summarySheet.addRow([bilingualHeader('إجمالي الدخل', 'Total Income'), totalIncome]);
    summarySheet.addRow([bilingualHeader('إجمالي المصروفات', 'Total Spendings'), totalSpendings]);
    summarySheet.addRow([]);
    summarySheet.addRow([bilingualHeader('البنك', 'Bank'), account.bankInfo.bankName]);
    summarySheet.addRow([bilingualHeader('اسم الحساب', 'Account Name'), account.bankInfo.accountName]);
    summarySheet.addRow([bilingualHeader('رقم الحساب', 'Account Number'), account.bankInfo.accountNumber]);
    summarySheet.addRow([bilingualHeader('IBAN', 'IBAN'), account.bankInfo.iban]);
    summarySheet.addRow([]);
    summarySheet.addRow([bilingualHeader('تاريخ التصدير', 'Export Date'), formatDate(new Date())]);
    summarySheet.getColumn(2).numFmt = '#,##0.000';
    summarySheet.getRow(1).font = { bold: true, size: 14 };

    const transSheet = workbook.addWorksheet('سجل المعاملات');
    transSheet.columns = [
      { header: bilingualHeader('التاريخ', 'Date'), key: 'date', width: 18 },
      { header: bilingualHeader('النوع', 'Type'), key: 'type', width: 20 },
      { header: bilingualHeader('الدفة', 'Ledger'), key: 'ledger', width: 14 },
      { header: bilingualHeader('المبلغ', 'Amount'), key: 'amount', width: 16 },
      { header: bilingualHeader('الرصيد بعد', 'Balance After'), key: 'balanceAfter', width: 16 },
      { header: bilingualHeader('رقم الفاتورة', 'Invoice Ref'), key: 'invoiceRef', width: 16 },
      { header: bilingualHeader('الوصف', 'Description'), key: 'description', width: 32 },
      { header: bilingualHeader('السبب', 'Reason'), key: 'reason', width: 24 },
      { header: bilingualHeader('بواسطة', 'By'), key: 'performedBy', width: 16 },
    ];

    transSheet.getColumn('amount').numFmt = '#,##0.000';
    transSheet.getColumn('balanceAfter').numFmt = '#,##0.000';

    const typeLabels = {
      income: 'دخل / Income',
      spending: 'صرف / Spending',
      income_reversal: 'عكس دخل / Income Reversal',
      spending_reversal: 'عكس صرف / Spending Reversal',
      income_adjustment: 'تعديل دخل / Income Adjustment',
      spending_adjustment: 'تعديل صرف / Spending Adjustment',
    };
    const ledgerLabels = {
      bank: 'حساب بنكي / Bank',
      cash: 'صندوق نقدي / Cash',
    };

    transactions.forEach((trans) => {
      transSheet.addRow({
        date: formatDate(trans.date),
        type: typeLabels[trans.type] || trans.type,
        ledger: ledgerLabels[trans.ledger] || trans.ledger,
        amount: trans.amount,
        balanceAfter: trans.balanceAfter,
        invoiceRef: trans.invoiceRef || '',
        description: trans.description || '',
        reason: trans.reason || '',
        performedBy: trans.performedBy ? trans.performedBy.username : '',
      });
    });

    const headerRow = transSheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=fursatkum-accounting-${moment().format('YYYY-MM-DD')}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: 'خطأ في تصدير محاسبة فرصتكم', error: error.message });
  }
});


module.exports = router; 