require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
sb.from('orgs').select('*, org_admins(admin_id, profiles(name, email))').then(res => console.log(JSON.stringify(res, null, 2)));
