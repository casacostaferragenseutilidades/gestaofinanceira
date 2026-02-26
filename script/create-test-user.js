import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestUser() {
  try {
    console.log('Creating test user...');

    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@financeirototal.com',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        name: 'Administrador'
      }
    });

    if (error) {
      console.error('Error creating user:', error);

      // If user already exists, try to get user info
      if (error.message.includes('already registered')) {
        console.log('User already exists, trying to sign in...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@financeirototal.com',
          password: 'admin123'
        });

        if (signInError) {
          console.error('Sign in error:', signInError);
        } else {
          console.log('Sign in successful:', signInData);
        }
      }
    } else {
      console.log('User created successfully:', data);
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestUser();
