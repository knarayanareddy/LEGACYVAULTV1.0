import * as fs from 'fs';
import * as path from 'path';

const srcIdlPath = path.join(process.cwd(), 'legacyvault/target/idl/legacyvault.json');
const destIdlPath = path.join(process.cwd(), 'api/src/config/idl.ts');

async function main() {
  if (!fs.existsSync(srcIdlPath)) {
    console.error(`Source IDL not found at ${srcIdlPath}`);
    process.exit(1);
  }

  const idl = JSON.parse(fs.readFileSync(srcIdlPath, 'utf8'));
  
  // Convert to TypeScript export format
  const content = `import { Idl } from '@coral-xyz/anchor';\n\nexport const IDL: any = ${JSON.stringify(idl, null, 2)};\n`;

  fs.writeFileSync(destIdlPath, content);
  console.log(`SUCCESS: API IDL synchronized from ${srcIdlPath}`);
}

main();
