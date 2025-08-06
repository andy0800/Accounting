const express = require('express');
const router = express.Router();
const ExcelJS = require('exceljs');
const Visa = require('../models/Visa');
const Secretary = require('../models/Secretary');
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
        name: visa.name,
        dateOfBirth: visa.dateOfBirth ? moment(visa.dateOfBirth).format('DD/MM/YYYY') : '',
        nationality: visa.nationality,
        passportNumber: visa.passportNumber,
        visaNumber: visa.visaNumber,
        secretary: visa.secretary ? visa.secretary.name : '',
        currentStage: visa.currentStage,
        visaIssueDate: visa.visaIssueDate ? moment(visa.visaIssueDate).format('DD/MM/YYYY') : '',
        visaExpiryDate: visa.visaExpiryDate ? moment(visa.visaExpiryDate).format('DD/MM/YYYY') : '',
        visaDeadline: visa.visaDeadline ? moment(visa.visaDeadline).format('DD/MM/YYYY') : '',
        totalExpenses: visa.totalExpenses || 0,
        sellingPrice: visa.sellingPrice || 0,
        profit: visa.profit || 0,
        secretaryEarnings: visa.secretaryEarnings || 0,
        customerName: visa.customerName || '',
        customerPhone: visa.customerPhone || '',
        createdAt: visa.createdAt ? moment(visa.createdAt).format('DD/MM/YYYY') : '',
        status: visa.status
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
    res.setHeader('Content-Disposition', `attachment; filename=سكرتيرة-${secretary.code}-${moment().format('YYYY-MM-DD')}.xlsx`);

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
    res.setHeader('Content-Disposition', `attachment; filename=تقرير-الشركة-${moment().format('YYYY-MM-DD')}.xlsx`);

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
    res.setHeader('Content-Disposition', `attachment; filename=مصروفات-${visa.secretaryCode}${visa.orderNumber.toString().padStart(3, '0')}-${moment().format('YYYY-MM-DD')}.xlsx`);

    // الكتابة إلى الاستجابة
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 