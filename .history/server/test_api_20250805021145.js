const axios = require('axios');

async function testSecretaryCreation() {
  try {
    console.log('Testing secretary creation...');
    
    const response = await axios.post('http://localhost:5000/api/secretaries', {
      name: 'Test Secretary',
      email: 'test@test.com',
      phone: '123456789'
    });
    
    console.log('Success:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Full error:', error);
  }
}

testSecretaryCreation(); 