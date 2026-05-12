import { sha256 } from 'js-sha256';

const names = [
  "global:initialize_global_config",
  "global:create_vault",
  "global:update_vault_settings",
  "global:freeze_vault",
  "global:unfreeze_vault",
  "global:add_guardian",
  "global:remove_guardian",
  "global:add_beneficiary"
];

for (const name of names) {
  const hash = sha256.digest(name);
  const discriminator = hash.slice(0, 8);
  console.log(`${name}:`, Array.from(discriminator));
}
