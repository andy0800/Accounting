const mongoose = require('mongoose');

const fw1AccountSchema = new mongoose.Schema({
  balance: {
    type: Number,
    default: 0,
  },
  incomeTotal: {
    type: Number,
    default: 0,
  },
  spendingTotal: {
    type: Number,
    default: 0,
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

fw1AccountSchema.statics.getAccount = async function() {
  let account = await this.findOne();
  if (!account) {
    account = await this.create({
      balance: 0,
      incomeTotal: 0,
      spendingTotal: 0,
      incomeCounter: 0,
      spendingCounter: 0,
    });
  }
  return account;
};

fw1AccountSchema.statics.getNextReference = async function(type) {
  const account = await this.getAccount();
  let counter;
  let prefix;

  if (type === 'income') {
    account.incomeCounter += 1;
    counter = account.incomeCounter;
    prefix = 'F1-INC';
  } else {
    account.spendingCounter += 1;
    counter = account.spendingCounter;
    prefix = 'F1-SPD';
  }

  await account.save();
  return `${prefix}-${counter.toString().padStart(3, '0')}`;
};

module.exports = mongoose.model('FW1Account', fw1AccountSchema);

