const fs = require('fs');
const path = require('path');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith('.page.tsx')) out.push(p);
  }
  return out;
}

const files = walk(path.join(__dirname, 'src', 'app', 'pages'));
const noUseTranslation = [];
const hardcodedPageHeader = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  if (!/useTranslation/.test(text)) noUseTranslation.push(file.replace(__dirname + path.sep, ''));
  if (/PageHeader[\s\S]*title="/.test(text)) hardcodedPageHeader.push(file.replace(__dirname + path.sep, ''));
}
console.log('PAGE_FILES=' + files.length);
console.log('NO_USE_TRANSLATION=' + noUseTranslation.length);
for (const f of noUseTranslation) console.log(f);
console.log('HARDCODED_PAGEHEADER_TITLE=' + hardcodedPageHeader.length);
for (const f of hardcodedPageHeader) console.log(f);
