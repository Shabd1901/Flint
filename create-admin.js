const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://ahodzhuainqiutvkxwjx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFob2R6aHVhaW5xaXV0dmt4d2p4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NjM3OTgzNCwiZXhwIjoyMTAxOTU1ODM0fQ.CgyTXMaZO_Vb6vVIzHtOBapfG-5XU6Olf2BFvmaJ05A'
);

async function createMaintainer() {
  console.log('Creating user in auth.users...');
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: 'a@gmail.com',
    password: '123456',
    email_confirm: true
  });

  if (authErr) {
    console.error('Error creating user:', authErr);
    return;
  }

  const userId = authData.user.id;
  console.log('User created with ID:', userId);

  console.log('Creating profile...');
  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: 'a@gmail.com',
    name: 'Admin User',
    role: 'maintainer'
  });

  if (profileErr) {
    console.error('Error creating profile:', profileErr);
  } else {
    console.log('Successfully created maintainer account!');
  }
}

createMaintainer();
