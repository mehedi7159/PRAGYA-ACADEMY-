import fs from 'fs';

let content = fs.readFileSync('update_batches.ts', 'utf-8');
content = content.replace("const fs = require('fs');", "import fs from 'fs';");
fs.writeFileSync('update_batches2.ts', content);
