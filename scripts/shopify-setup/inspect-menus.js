import 'dotenv/config';

const { SHOPIFY_STORE, SHOPIFY_ACCESS_TOKEN } = process.env;
const ENDPOINT = `https://${SHOPIFY_STORE}/admin/api/2026-01/graphql.json`;

async function gql(query, variables = {}) {
  const r = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'X-Shopify-Access-Token': SHOPIFY_ACCESS_TOKEN,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });
  return r.json();
}

const HANDLES = ['footer-a-propos', 'footer-categories', 'footer-service-client'];

const r = await gql(`
  query {
    menus(first: 50) {
      nodes {
        id handle title
        items { id title type url resourceId }
      }
    }
  }
`);

for (const handle of HANDLES) {
  const m = r.data.menus.nodes.find(x => x.handle === handle);
  console.log(`\n— ${handle} —`);
  if (!m) { console.log('  (introuvable)'); continue; }
  console.log(`  id: ${m.id}`);
  console.log(`  title: ${m.title}`);
  console.log(`  items (${m.items.length}):`);
  for (const it of m.items) {
    console.log(`    • ${it.title} | type=${it.type} | resourceId=${it.resourceId} | url=${it.url}`);
  }
}
