const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const url = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].replace(/\"/g, '').trim();
const key = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/\"/g, '').trim();
const { createClient } = require('@supabase/supabase-js');
const adminClient = createClient(url, key);
async function run() {
  const { data, error } = await adminClient.from('exams').select('*');
  console.log(data);
}
run();
