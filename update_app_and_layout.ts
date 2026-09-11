import fs from 'fs';

// 1. Update App.tsx
let appStr = fs.readFileSync('src/App.tsx', 'utf8');
appStr = appStr.replace(/import \{ SmartBatches \} from '\.\/pages\/SmartBatches';\n/, '');
appStr = appStr.replace(/case 'smart-batches': return <SmartBatches \/>;\n\s+/, '');
fs.writeFileSync('src/App.tsx', appStr);

// 2. Update Layout.tsx
let layoutStr = fs.readFileSync('src/components/Layout.tsx', 'utf8');
// remove smart-batches menu, keep 'batches' but label it 'Smart Batches'
layoutStr = layoutStr.replace(/\{ id: 'smart-batches',\s*label: language === 'en' \? 'Smart Batches' : 'স্মার্ট ব্যাচ',\s*icon: Layers \},\s*\n/, '');
layoutStr = layoutStr.replace(
  /\{ id: 'batches', label: language === 'en' \? 'Core Batches' : 'ব্যাচসমূহ', icon: Layers \}/,
  "{ id: 'batches', label: language === 'en' ? 'Batches' : 'ব্যাচসমূহ', icon: Layers }"
);
fs.writeFileSync('src/components/Layout.tsx', layoutStr);

// Delete SmartBatches.tsx
if(fs.existsSync('src/pages/SmartBatches.tsx')) {
  fs.unlinkSync('src/pages/SmartBatches.tsx');
}
