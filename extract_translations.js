const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('src/utils/translations.js', 'utf8');

function extractObject(fullContent, key) {
    const startStr = `${key}: {`;
    const startIndex = fullContent.indexOf(startStr);
    if (startIndex === -1) return null;
    
    let braceCount = 1;
    let index = startIndex + startStr.length;
    let result = '';
    
    while (braceCount > 0 && index < fullContent.length) {
        const char = fullContent[index];
        if (char === '{') braceCount++;
        else if (char === '}') braceCount--;
        
        if (braceCount > 0) result += char;
        index++;
    }
    
    const obj = {};
    // Regex to match 'key': 'value' or "key": "value" across lines
    const regex = /['"](.+?)['"]:\s*['"]([\s\S]*?)['"](?=,|\s*})/g;
    let match;
    while ((match = regex.exec(result)) !== null) {
        let value = match[2];
        value = value.replace(/\\n/g, '\n').replace(/\\'/g, "'").replace(/\\"/g, '"').replace(/\\\\/g, '\\');
        obj[match[1]] = value;
    }
    return obj;
}

const en = extractObject(content, 'en');
const es = extractObject(content, 'es');

const localesDir = path.join('public', 'locales');
if (!fs.existsSync(localesDir)) fs.mkdirSync(localesDir, { recursive: true });

if (en) {
    const enDir = path.join(localesDir, 'en');
    if (!fs.existsSync(enDir)) fs.mkdirSync(enDir, { recursive: true });
    fs.writeFileSync(path.join(enDir, 'translation.json'), JSON.stringify(en, null, 2)); 
}

if (es) {
    const esDir = path.join(localesDir, 'es');
    if (!fs.existsSync(esDir)) fs.mkdirSync(esDir, { recursive: true });
    fs.writeFileSync(path.join(esDir, 'translation.json'), JSON.stringify(es, null, 2)); 
}
