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
  if (c.includes('alert(')) {
    // We only replace exactly 'alert(' and not things like 'Alert.alert(' (which doesn't exist, but just in case)
    // We use a safe regex that checks for word boundary before 'alert'
    c = c.replace(/\balert\((.*?)\)/g, 'GlobalAlertRef.current?.alert(\'Notice\', $1)');
    
    // Add import if not present
    if (!c.includes('GlobalAlertRef')) {
      c = "import { GlobalAlertRef } from '../components/GlobalAlert';\n" + c;
    }
    
    fs.writeFileSync(fp, c);
    console.log('Updated ' + f);
  }
});
