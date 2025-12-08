const mongoose = require('mongoose');

const hsAccountSchema = new mongoose.Schema({
  fundingCredit: {
    type: Number,
    default: 0,
    min: 0,
  },
  incomeProfit: {
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
}, {
  timestamps: true,
});

// Static method to get or create the singleton account
hsAccountSchema.statics.getAccount = async function() {
  let account = await this.findOne();
  if (!account) {
    account = await this.create({
      fundingCredit: 0,
      incomeProfit: 0,
      incomeCounter: 0,
      spendingCounter: 0,
    });
  }
  return account;
};

// Method to generate next reference number
hsAccountSchema.statics.getNextReference = async function(type) {
  const account = await this.getAccount();
  let counter;
  let prefix;
  
  if (type === 'income') {
    account.incomeCounter += 1;
    counter = account.incomeCounter;
    prefix = 'INC';
  } else {
    account.spendingCounter += 1;
    counter = account.spendingCounter;
    prefix = 'SPD';
  }
  
  await account.save();
  return `${prefix}-${counter.toString().padStart(3, '0')}`;
};

module.exports = mongoose.model('HSAccount', hsAccountSchema);

