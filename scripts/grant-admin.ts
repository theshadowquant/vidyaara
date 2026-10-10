import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envLocalPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envLocalPath)) {
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const [key, ...rest] = trimmed.split('=');
    if (key && rest.length > 0 && !process.env[key.trim()]) {
      process.env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
    }
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const email = 'theshadowquant@gmail.com';
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  const user = users.find((u) => u.email === email);
  if (user) {
    const { error: roleErr } = await supabase
      .from('admin_roles')
      .upsert({ user_id: user.id });
    if (roleErr) {
      console.error('Error assigning role:', roleErr);
    } else {
      console.log(`✅ Granted admin role to ${email} (User ID: ${user.id})`);
    }
  } else {
    console.log(`ℹ️ User ${email} does not exist in Supabase Auth yet. Please create it in Auth -> Users.`);
  }
}

main();
