import 'dotenv/config';

const { SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN } = process.env;

function fail(msg) {
  console.error(`\n❌ ${msg}\n`);
  process.exit(1);
}

if (!SHOPIFY_STORE) fail('SHOPIFY_STORE manquant dans .env');
if (!SHOPIFY_ACCESS_TOKEN) fail('SHOPIFY_ACCESS_TOKEN manquant — lance d\'abord oauth.js');

const API_VERSION = '2026-01';
const ENDPOINT = `https://${SHOPIFY_STORE}/admin/api/${API_VERSION}/graphql.json`;

async function gql(query, variables = {}) {
  const resp = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${text}`);
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`Non-JSON: ${text}`); }
  if (json.errors) throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  return json.data;
}

function slugify(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// === DATA ===
const PAGE_TITLES = [
  'La maison',
  'Conciergerie',
  'Authenticité',
  'Presse',
  'Programme Pro',
  'Avis',
  'Contact',
  'Livraisons',
  'Retours',
  'FAQ',
  'Protection acheteur',
];
const PAGES = PAGE_TITLES.map(title => ({ title, handle: slugify(title) }));

const COLLECTIONS = [
  { title: 'Nouveautés', handle: 'nouveautes' },
  { title: 'Objets', handle: 'objets' },
  { title: 'Miroirs', handle: 'miroirs' },
  { title: 'Mobilier', handle: 'mobilier' },
  { title: 'Luminaires', handle: 'luminaires' },
  { title: 'Art', handle: 'art' },
];

const MENUS = [
  {
    title: 'À propos',
    handle: 'footer-a-propos',
    items: [
      { title: 'La maison', type: 'PAGE', target: 'la-maison' },
      { title: 'Conciergerie', type: 'PAGE', target: 'conciergerie' },
      { title: 'Authenticité', type: 'PAGE', target: 'authenticite' },
      { title: 'Presse', type: 'PAGE', target: 'presse' },
      { title: 'Programme Pro', type: 'PAGE', target: 'programme-pro' },
      { title: 'Avis', type: 'PAGE', target: 'avis' },
    ],
  },
  {
    title: 'Catégories',
    handle: 'footer-categories',
    items: [
      { title: 'Nouveautés', type: 'COLLECTION', target: 'nouveautes' },
      { title: 'Objets', type: 'COLLECTION', target: 'objets' },
      { title: 'Miroirs', type: 'COLLECTION', target: 'miroirs' },
      { title: 'Mobilier', type: 'COLLECTION', target: 'mobilier' },
      { title: 'Luminaires', type: 'COLLECTION', target: 'luminaires' },
      { title: 'Art', type: 'COLLECTION', target: 'art' },
    ],
  },
  {
    title: 'Service client',
    handle: 'footer-service-client',
    items: [
      { title: 'Contact', type: 'PAGE', target: 'contact' },
      { title: 'Livraisons', type: 'PAGE', target: 'livraisons' },
      { title: 'Retours', type: 'PAGE', target: 'retours' },
      { title: 'FAQ', type: 'PAGE', target: 'faq' },
      { title: 'Protection acheteur', type: 'PAGE', target: 'protection-acheteur' },
    ],
  },
];

// === PAGES ===
async function findPageByHandle(handle) {
  const data = await gql(`
    query($q: String!) {
      pages(first: 1, query: $q) {
        nodes { id handle title }
      }
    }
  `, { q: `handle:${handle}` });
  return data.pages.nodes[0] || null;
}

async function createPage({ title, handle }) {
  const data = await gql(`
    mutation($page: PageCreateInput!) {
      pageCreate(page: $page) {
        page { id handle title }
        userErrors { field message code }
      }
    }
  `, {
    page: {
      title,
      handle,
      body: '<p>Page en cours de préparation.</p>',
      isPublished: true,
    },
  });
  const errs = data.pageCreate.userErrors;
  if (errs.length) throw new Error(`pageCreate "${title}" → ${JSON.stringify(errs)}`);
  return data.pageCreate.page;
}

// === COLLECTIONS ===
async function findCollectionByHandle(handle) {
  const data = await gql(`
    query($q: String!) {
      collections(first: 1, query: $q) {
        nodes { id handle title }
      }
    }
  `, { q: `handle:${handle}` });
  return data.collections.nodes[0] || null;
}

async function createCollection({ title, handle }) {
  const data = await gql(`
    mutation($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle title }
        userErrors { field message }
      }
    }
  `, {
    input: { title, handle, descriptionHtml: '' },
  });
  const errs = data.collectionCreate.userErrors;
  if (errs.length) throw new Error(`collectionCreate "${title}" → ${JSON.stringify(errs)}`);
  return data.collectionCreate.collection;
}

// === MENUS ===
async function findMenuByHandle(handle) {
  const data = await gql(`
    query {
      menus(first: 50) {
        nodes { id handle title }
      }
    }
  `);
  return data.menus.nodes.find(m => m.handle === handle) || null;
}

async function createMenu({ title, handle, items }) {
  const data = await gql(`
    mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) {
      menuCreate(title: $title, handle: $handle, items: $items) {
        menu { id handle title }
        userErrors { field message code }
      }
    }
  `, { title, handle, items });
  const errs = data.menuCreate.userErrors;
  if (errs.length) throw new Error(`menuCreate "${title}" → ${JSON.stringify(errs)}`);
  return data.menuCreate.menu;
}

// === MAIN ===
const counters = {
  pages:       { created: 0, existing: 0 },
  collections: { created: 0, existing: 0 },
  menus:       { created: 0, existing: 0 },
};
const pageMap = new Map();
const collectionMap = new Map();

console.log('\n═══════════════════════════════════════════════════════');
console.log('📄 PAGES');
console.log('═══════════════════════════════════════════════════════');
for (const p of PAGES) {
  try {
    const existing = await findPageByHandle(p.handle);
    if (existing) {
      console.log(`  ⏭️  ${p.title.padEnd(22)} (${p.handle})`);
      pageMap.set(p.handle, existing.id);
      counters.pages.existing++;
    } else {
      const created = await createPage(p);
      console.log(`  ✅ ${p.title.padEnd(22)} → ${created.id}`);
      pageMap.set(p.handle, created.id);
      counters.pages.created++;
    }
  } catch (e) {
    console.error(`  ⚠️  ${p.title} : ${e.message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('🛍️  COLLECTIONS');
console.log('═══════════════════════════════════════════════════════');
for (const c of COLLECTIONS) {
  try {
    const existing = await findCollectionByHandle(c.handle);
    if (existing) {
      console.log(`  ⏭️  ${c.title.padEnd(15)} (${c.handle})`);
      collectionMap.set(c.handle, existing.id);
      counters.collections.existing++;
    } else {
      const created = await createCollection(c);
      console.log(`  ✅ ${c.title.padEnd(15)} → ${created.id}`);
      collectionMap.set(c.handle, created.id);
      counters.collections.created++;
    }
  } catch (e) {
    console.error(`  ⚠️  ${c.title} : ${e.message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('📋 MENUS');
console.log('═══════════════════════════════════════════════════════');
for (const m of MENUS) {
  try {
    const existing = await findMenuByHandle(m.handle);
    if (existing) {
      console.log(`  ⏭️  ${m.handle} (${m.title})`);
      counters.menus.existing++;
      continue;
    }
    const items = m.items.map(it => {
      const map = it.type === 'PAGE' ? pageMap : collectionMap;
      const id = map.get(it.target);
      if (!id) throw new Error(`resource manquant pour "${it.title}" (${it.type}:${it.target})`);
      return { title: it.title, type: it.type, resourceId: id };
    });
    const created = await createMenu({ title: m.title, handle: m.handle, items });
    console.log(`  ✅ ${m.handle.padEnd(25)} → ${items.length} items → ${created.id}`);
    counters.menus.created++;
  } catch (e) {
    console.error(`  ⚠️  ${m.handle} : ${e.message}`);
  }
}

console.log('\n═══════════════════════════════════════════════════════');
console.log('📊 RÉCAPITULATIF');
console.log('═══════════════════════════════════════════════════════');
console.log(`📄  Pages       : ${counters.pages.created} créées / ${counters.pages.existing} existaient`);
console.log(`🛍️   Collections : ${counters.collections.created} créées / ${counters.collections.existing} existaient`);
console.log(`📋  Menus       : ${counters.menus.created} créés  / ${counters.menus.existing} existaient`);
console.log('═══════════════════════════════════════════════════════\n');
