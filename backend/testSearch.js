// testSearch.js
require('dotenv').config();
const { getDiagramImage } = require('./utils/imageSearch');

(async () => {
  console.log('Testing Google Image Search...');
  console.log('Using API Key:', process.env.GOOGLE_API_KEY ? 'Loaded ✅' : 'Missing ❌');
  console.log('Using CX:', process.env.GOOGLE_CX ? 'Loaded ✅' : 'Missing ❌');
  
  const query = "CPU Architecture";
  console.log(`\nSearching for: "${query}"`);
  
  const urls = await getDiagramImage(query);
  
  if (urls && urls.length > 0) {
    console.log('\n✅ Success! Found images:');
    urls.forEach((url, i) => console.log(`${i + 1}: ${url}`));
  } else {
    console.log('\n❌ Failed to find images or API error occurred.');
  }
})();