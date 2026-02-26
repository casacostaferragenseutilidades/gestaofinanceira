import { createClient } from '@supabase/supabase-js';

// Supabase configuration with anon key (for public signup)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createUsers() {
  try {
    console.log('Creating users in Supabase using signup...');

    // Create admin user
    console.log('Creating admin user...');
    const { data: adminData, error: adminError } = await supabase.auth.signUp({
      email: 'admin@financeirototal.com',
      password: 'admin123',
      options: {
        data: {
          name: 'Administrador',
          role: 'admin'
        }
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
    const { data: userData, error: userError } = await supabase.auth.signUp({
      email: 'user@financeirototal.com',
      password: 'user123',
      options: {
        data: {
          name: 'Usuário Teste',
          role: 'user'
        }
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

    console.log('\n=== Users creation completed ===');
    console.log('Now you can login with:');
    console.log('Email: admin@financeirototal.com, Password: admin123');
    console.log('Email: user@financeirototal.com, Password: user123');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createUsers();
