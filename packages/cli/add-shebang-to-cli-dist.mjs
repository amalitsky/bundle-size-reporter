import { promises as fsPromises } from 'fs';

const encoding = 'utf8';
const shebang = '#!/usr/bin/env node';
const filePath = './dist/index.mjs';

const content = await fsPromises.readFile(filePath, {
  flag: 'r',
  encoding,
});

if (content.startsWith(shebang)) {
  throw Error('Shebang already present in the file');
}

const updatedContent = `${ shebang }\n${ content }`;

await fsPromises.writeFile(filePath, updatedContent, {
  flag: 'r+',
  encoding,
});
