const fs = require('fs');
const path = require('path');

const files = [
  'HelpSupportScreen.js',
  'LoginScreen.js',
  'ManageAccountScreen.js',
  'MyVehiclesScreen.js',
  'SignUpScreen.js',
  'SignUpStationScreen.js',
  'StationDashboard.js'
];

files.forEach(f => {
  const fp = path.join('src/screens', f);
  let c = fs.readFileSync(fp, 'utf8');
  
  if (!c.includes('import { GlobalAlertRef }')) {
    c = "import { GlobalAlertRef } from '../components/GlobalAlert';\n" + c;
    fs.writeFileSync(fp, c);
    console.log('Added import to ' + f);
  }
});
