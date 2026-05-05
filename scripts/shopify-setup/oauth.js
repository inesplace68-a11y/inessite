import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ENV_PATH = path.join(__dirname, '.env');

const {
  SHOPIFY_STORE,
  SHOPIFY_CLIENT_ID,
  SHOPIFY_CLIENT_SECRET,
} = process.env;

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!SHOPIFY_STORE) fail('SHOPIFY_STORE manquant dans .env');
if (!SHOPIFY_CLIENT_ID) fail('SHOPIFY_CLIENT_ID vide dans .env');
if (!SHOPIFY_CLIENT_SECRET) fail('SHOPIFY_CLIENT_SECRET vide dans .env');

const tokenUrl = `https://${SHOPIFY_STORE}/admin/oauth/access_token`;

const body = new URLSearchParams({
  grant_type: 'client_credentials',
  client_id: SHOPIFY_CLIENT_ID,
  client_secret: SHOPIFY_CLIENT_SECRET,
});

console.log('\n═══════════════════════════════════════════════════════');
console.log('🔐 SHOPIFY CLIENT CREDENTIALS GRANT');
console.log('═══════════════════════════════════════════════════════');
console.log(`POST ${tokenUrl}`);
console.log('grant_type=client_credentials\n');

const resp = await fetch(tokenUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    Accept: 'application/json',
  },
  body,
});

const rawText = await resp.text();
let parsed = null;
try {
  parsed = JSON.parse(rawText);
} catch {
  /* keep parsed = null */
}

if (!resp.ok) {
  console.error(`❌ HTTP ${resp.status} ${resp.statusText}`);
  console.error('Body :');
  console.error(parsed ? JSON.stringify(parsed, null, 2) : rawText);
  if (parsed?.error === 'application_cannot_be_found') {
    console.error('\n⚠️  L\'app n\'est pas reconnue par cette boutique.');
    console.error('   Le Client Credentials Grant est réservé aux apps configurées comme "managed install" depuis le Dev Dashboard.');
    console.error('   → Pivot recommandé : revenir au flow Authorization Code (URL d\'install + OAuth interactif).\n');
  }
  process.exit(1);
}

if (!parsed) fail(`Réponse non-JSON malgré HTTP ${resp.status}: ${rawText}`);

const { access_token, scope, expires_in } = parsed;
if (!access_token) fail(`Réponse sans access_token. Body: ${rawText}`);

console.log('✅ Réponse Shopify OK');
console.log(`   scope      : ${scope}`);
console.log(`   expires_in : ${expires_in ?? '(non renvoyé)'}\n`);

const envContent = fs.readFileSync(ENV_PATH, 'utf8');
const updated = envContent.replace(
  /^SHOPIFY_ACCESS_TOKEN=.*$/m,
  `SHOPIFY_ACCESS_TOKEN=${access_token}`,
);
if (updated === envContent) {
  fs.appendFileSync(ENV_PATH, `\nSHOPIFY_ACCESS_TOKEN=${access_token}\n`);
} else {
  fs.writeFileSync(ENV_PATH, updated);
}

console.log('═══════════════════════════════════════════════════════');
console.log('✅ Token obtenu et sauvegardé dans .env');
console.log('═══════════════════════════════════════════════════════');
console.log(`Token : ${access_token.slice(0, 8)}…`);
console.log('═══════════════════════════════════════════════════════\n');
