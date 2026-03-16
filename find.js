const fs = require('fs');
const path = require('path');

function findFiles(dir, filter) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (!fullPath.includes('node_modules') && !fullPath.includes('.git')) {
        findFiles(fullPath, filter);
      }
    } else if (fullPath.endsWith(filter)) {
      console.log(fullPath);
    }
  }
}

findFiles('E:\\mercado sinergia\\back', 'paquetePublicado.service.ts');
