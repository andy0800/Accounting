const mongoose = require('mongoose');

const bankInfoSchema = new mongoose.Schema({
  bankName: { type: String, default: 'بنك الكويت الوطني' },
  accountName: { type: String, default: 'شركة فرصتكم' },
  accountNumber: { type: String, default: '1234567890' },
  iban: { type: String, default: 'KW00NBOK0000000000000000000000' },
}, { _id: false });

const fursatkumAccountSchema = new mongoose.Schema({
  bankBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  cashBalance: {
    type: Number,
    default: 0,
    min: 0,
  },
  incomeCounter: {
    type: Number,
    default: 0,
  },
  spendingCounter: {
    type: Number,
    default: 0,
  },
  bankInfo: {
    type: bankInfoSchema,
    default: () => ({}),
  },
}, {
  timestamps: true,
});

// Static method to get or create the singleton account
fursatkumAccountSchema.statics.getAccount = async function() {
  let account = await this.findOne();
  if (!account) {
    account = await this.create({
      bankBalance: 0,
      cashBalance: 0,
      incomeCounter: 0,
      spendingCounter: 0,
      bankInfo: {},
    });
  }
  return account;
};

// Method to generate next reference number
fursatkumAccountSchema.statics.getNextReference = async function(type) {
  const account = await this.getAccount();
  let counter;
  let prefix;

  if (type === 'income') {
    account.incomeCounter += 1;
    counter = account.incomeCounter;
    prefix = 'F-INC';
  } else {
    account.spendingCounter += 1;
    counter = account.spendingCounter;
    prefix = 'F-SPD';
  }

  await account.save();
  return `${prefix}-${counter.toString().padStart(3, '0')}`;
};

module.exports = mongoose.model('FursatkumAccount', fursatkumAccountSchema);


