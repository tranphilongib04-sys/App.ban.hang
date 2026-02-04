const fetch = require('node-fetch');
const token = '1DNS9YHAAKPRBJCK7FL7YZMT40FBXIEVUS58KPUJYD6ZDW0SG8GHPJCSCON4AQH1';
fetch('https://my.sepay.vn/userapi/transactions/list', {
  headers: { Authorization: 'Bearer ' + token }
})
.then(res => res.json())
.then(data => console.log(JSON.stringify(data, null, 2)))
.catch(err => console.error(err));
