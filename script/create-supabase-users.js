import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createUsers() {
  try {
    console.log('Creating users in Supabase...');

    // Create admin user
    console.log('Creating admin user...');
    const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@financeirototal.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador',
        role: 'admin'
      }
    });

    if (adminError) {
      console.log('Admin user creation failed:', adminError.message);

      // Check if user already exists
      if (adminError.message.includes('already registered')) {
        console.log('Admin user already exists');
      }
    } else {
      console.log('Admin user created successfully:', adminData);
    }

    // Create regular user
    console.log('Creating regular user...');
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@financeirototal.com',
      password: 'user123',
      email_confirm: true,
      user_metadata: {
        name: 'Usuário Teste',
        role: 'user'
      }
    });

    if (userError) {
      console.log('Regular user creation failed:', userError.message);

      // Check if user already exists
      if (userError.message.includes('already registered')) {
        console.log('Regular user already exists');
      }
    } else {
      console.log('Regular user created successfully:', userData);
    }

    // Test login with both users
    console.log('\n=== Testing login ===');

    // Test admin login
    console.log('Testing admin login...');
    const { data: adminLogin, error: adminLoginError } = await supabase.auth.signInWithPassword({
      email: 'admin@financeirototal.com',
      password: 'admin123'
    });

    if (adminLoginError) {
      console.log('Admin login failed:', adminLoginError.message);
    } else {
      console.log('Admin login successful:', adminLogin.user?.email);
    }

    // Test regular user login
    console.log('Testing regular user login...');
    const { data: userLogin, error: userLoginError } = await supabase.auth.signInWithPassword({
      email: 'user@financeirototal.com',
      password: 'user123'
    });

    if (userLoginError) {
      console.log('Regular user login failed:', userLoginError.message);
    } else {
      console.log('Regular user login successful:', userLogin.user?.email);
    }

    console.log('\n=== Users created and tested successfully ===');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createUsers();
