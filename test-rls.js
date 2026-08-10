global.WebSocket = require('ws');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function setupUser(email, password, role, name) {
  let { data: { user }, error } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (error) {
    if (error.code === 'email_exists' || error.message.includes('already')) {
       const { data: usersData } = await adminClient.auth.admin.listUsers();
       user = usersData.users.find(u => u.email === email);
       await adminClient.auth.admin.updateUserById(user.id, { password });
    } else {
       throw error;
    }
  }

  // Upsert profile (bypassing RLS with service_role)
  const { error: profileError } = await adminClient
    .from('profiles')
    .upsert({ id: user.id, role, name, email })
    .select();

  if (profileError) throw profileError;
  return user;
}

async function runTests() {
  console.log('--- Starting RLS Tests ---');

  try {
    // 1. Setup Data
    console.log('Setting up test users...');
    const maintainer = await setupUser('m1@test.com', 'password123', 'maintainer', 'M1');
    const admin1 = await setupUser('a1@test.com', 'password123', 'admin', 'A1');
    const admin2 = await setupUser('a2@test.com', 'password123', 'admin', 'A2');
    const candidate1 = await setupUser('c1@test.com', 'password123', 'candidate', 'C1');

    console.log('Setting up test orgs...');
    await adminClient.from('orgs').delete().in('name', ['Org1', 'Org2']);

    const { data: org1, error: e1 } = await adminClient.from('orgs').insert({ admin_id: admin1.id, name: 'Org1' }).select().single();
    if(e1) throw e1;
    const { data: org2, error: e2 } = await adminClient.from('orgs').insert({ admin_id: admin2.id, name: 'Org2' }).select().single();
    if(e2) throw e2;

    console.log('Setting up enrollments...');
    await adminClient.from('enrollments').delete().eq('candidate_id', candidate1.id);
    await adminClient.from('enrollments').insert({ org_id: org1.id, candidate_id: candidate1.id });

    console.log('Setting up exams...');
    await adminClient.from('exams').delete().in('title', ['Exam1', 'Exam2']);
    const { data: exam1, error: e3 } = await adminClient.from('exams').insert({ org_id: org1.id, title: 'Exam1', duration_minutes: 60, status: 'live' }).select().single();
    if (e3) throw e3;
    const { data: exam2, error: e4 } = await adminClient.from('exams').insert({ org_id: org2.id, title: 'Exam2', duration_minutes: 60, status: 'live' }).select().single();
    if (e4) throw e4;

    // 2. Perform actions as different roles
    async function createAuthenticatedClient(email, password) {
      const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { autoRefreshToken: false, persistSession: false }
      });
      const { error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return client;
    }

    console.log('\n--- Running Assertions ---');
    let allPassed = true;

    // --- Maintainer Tests ---
    const mClient = await createAuthenticatedClient('m1@test.com', 'password123');
    const { data: mOrgs, error: mErr } = await mClient.from('orgs').select('*');
    if (mErr) console.error('Maintainer org error:', mErr);
    if (mOrgs && mOrgs.length >= 2) console.log('✅ Maintainer can read all orgs');
    else { console.error('❌ Maintainer should read all orgs, found:', mOrgs?.length); allPassed = false; }

    // --- Admin Tests ---
    const a1Client = await createAuthenticatedClient('a1@test.com', 'password123');
    const { data: a1Orgs, error: a1Err } = await a1Client.from('orgs').select('*');
    if (a1Err) console.error('Admin1 org error:', a1Err);
    if (a1Orgs && a1Orgs.length === 1 && a1Orgs[0].name === 'Org1') console.log('✅ Admin1 can only read Org1');
    else { console.error('❌ Admin1 isolation failed', a1Orgs); allPassed = false; }

    const { data: a1Exams, error: a1Err2 } = await a1Client.from('exams').select('*');
    if (a1Err2) console.error('Admin1 exams error:', a1Err2);
    if (a1Exams && a1Exams.length === 1 && a1Exams[0].title === 'Exam1') console.log('✅ Admin1 can only read Exam1');
    else { console.error('❌ Admin1 exam isolation failed', a1Exams); allPassed = false; }

    // --- Candidate Tests ---
    const c1Client = await createAuthenticatedClient('c1@test.com', 'password123');
    const { data: c1Orgs, error: c1Err } = await c1Client.from('orgs').select('*');
    if (c1Err) console.error('Candidate1 org error:', c1Err);
    if (c1Orgs && c1Orgs.length === 1 && c1Orgs[0].name === 'Org1') console.log('✅ Candidate1 can only read enrolled Org1');
    else { console.error('❌ Candidate1 org isolation failed', c1Orgs); allPassed = false; }

    const { data: c1Exams, error: c1Err2 } = await c1Client.from('exams').select('*');
    if (c1Err2) console.error('Candidate1 exams error:', c1Err2);
    if (c1Exams && c1Exams.length === 1 && c1Exams[0].title === 'Exam1') console.log('✅ Candidate1 can only read enrolled Exam1');
    else { console.error('❌ Candidate1 exam isolation failed', c1Exams); allPassed = false; }

    if (allPassed) {
       console.log('\n🎉 All RLS isolation tests passed successfully!');
    } else {
       console.log('\n⚠️ Some tests failed.');
    }

  } catch (err) {
    console.error('Test script failed:', err);
  }
}

runTests();
