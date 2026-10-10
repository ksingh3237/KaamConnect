const fs = require('fs');
const path = require('path');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(file));
    } else {
      if (file.endsWith('.tsx')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = getFiles('app');
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('router.back()')) {
    content = content.replace(/router\.back\(\)/g, "router.canGoBack() ? router.back() : router.replace('/')");
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated ' + filePath);
  }
});
