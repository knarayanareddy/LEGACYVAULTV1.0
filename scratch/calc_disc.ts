import { sha256 } from 'js-sha256';

const name = "global:initialize_global_config";
const hash = sha256.digest(name);
const discriminator = hash.slice(0, 8);
console.log("Discriminator:", Array.from(discriminator));
