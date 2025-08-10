#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const API_BASE_URL = process.env.API_URL || 'https://bjjserver-995707778143.europe-west1.run.app';
const ENDPOINTS = [
  'belts/count',
  'belts/frequency',
  'profiles/count',
  'promotions/count'
];

// Helper function to make HTTP requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    // Add basic authentication headers
    const auth = Buffer.from('cardano:lovelace').toString('base64');
    const options = {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    };
    
    const req = protocol.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            status: res.statusCode,
            data: jsonData,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            status: res.statusCode,
            data: data,
            headers: res.headers,
            error: 'Failed to parse JSON'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

// Test all endpoints
async function testAllEndpoints() {
  console.log(`🔍 Testing API connection to: ${API_BASE_URL}\n`);
  
  for (const endpoint of ENDPOINTS) {
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log(`📡 Testing: ${endpoint}`);
    
    try {
      const result = await makeRequest(url);
      if (result.status >= 200 && result.status < 300) {
        console.log(`✅ Success (${result.status}): ${JSON.stringify(result.data)}`);
      } else {
        console.log(`⚠️  Unexpected status (${result.status}): ${JSON.stringify(result.data)}`);
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
    
    console.log(''); // Empty line for readability
  }
}

// Test CORS headers
async function testCORS() {
  console.log('🔒 Testing CORS headers...\n');
  
  try {
    const result = await makeRequest(`${API_BASE_URL}/belts/count`);
    const corsHeader = result.headers['access-control-allow-origin'];
    
    if (corsHeader) {
      console.log(`✅ CORS enabled: ${corsHeader}`);
    } else {
      console.log(`⚠️  No CORS headers found`);
    }
    
    console.log(`📋 Response headers:`, Object.keys(result.headers));
  } catch (error) {
    console.log(`❌ CORS test failed: ${error.message}`);
  }
}

// Main execution
async function main() {
  try {
    await testAllEndpoints();
    await testCORS();
    
    console.log('🎯 API testing complete!');
    console.log('\n💡 Tips:');
    console.log('• If you see errors, make sure your backend server is running');
    console.log('• Update the API_URL environment variable if needed: export API_URL=http://your-server:port');
    console.log('• Check that your backend accepts requests from this domain');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { testAllEndpoints, testCORS };
