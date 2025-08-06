const axios = require('axios');

async function testAccountsAPI() {
  try {
    console.log('Testing accounts API...');
    
    // Test the secretaries accounts endpoint
    const response = await axios.get('http://localhost:5000/api/accounts/secretaries');
    
    console.log('Success! Found', response.data.length, 'secretary accounts');
    
    // Check if each account has the required statistics property
    response.data.forEach((account, index) => {
      if (!account.statistics) {
        console.error(`Account ${index} is missing statistics property`);
      } else {
        console.log(`Account ${index}: ${account.secretary.name} - Statistics available`);
      }
    });
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testAccountsAPI(); 