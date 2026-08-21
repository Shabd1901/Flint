const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const url = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].replace(/\"/g, '').trim();
const key = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY=')).split('=')[1].replace(/\"/g, '').trim();
const { createClient } = require('@supabase/supabase-js');
const adminSupabase = createClient(url, key);
async function run() {
  const { data: orgAdminsData } = await adminSupabase.from('org_admins').select('*');
  console.log('Org Admins:', orgAdminsData);
  const adminIds = new Set(orgAdminsData.map(o => o.admin_id));
  const { data: profiles } = await adminSupabase.from('profiles').select('id, name, email').in('id', Array.from(adminIds));
  console.log('Profiles:', profiles);
}
run();
