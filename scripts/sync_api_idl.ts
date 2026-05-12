import * as fs from 'fs';
import * as path from 'path';

const idlPath = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');
const targetPath = path.join(process.cwd(), 'api/src/config/idl.ts');

const idlContent = fs.readFileSync(idlPath, 'utf8');
const tsContent = `export const IDL: any = ${idlContent};
`;

fs.writeFileSync(targetPath, tsContent);
console.log('API IDL updated from patched IDL.');
