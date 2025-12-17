// Quick script to insert cities into Supabase
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://api.craftlocal.net';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzM0NDAwMDAwLCJleHAiOjIwNTAwMDAwMDB9.ALT0l4BuD8yD9_TSEpasKyr7IIRuhcEYDqaEUBRBYVM';

const supabase = createClient(supabaseUrl, supabaseKey);

const cities = [
  {
    name: 'Chicago',
    slug: 'chicago',
    state: 'Illinois',
    description: 'Discover handmade treasures from the Windy City\'s vibrant maker community',
    is_active: true,
    launch_date: '2024-01-01'
  },
  {
    name: 'Milwaukee',
    slug: 'milwaukee',
    state: 'Wisconsin',
    description: 'Coming soon - Join the waitlist for Milwaukee\'s artisan marketplace',
    is_active: false,
    launch_date: '2024-12-01'
  },
  {
    name: 'Detroit',
    slug: 'detroit',
    state: 'Michigan',
    description: 'Coming soon - Motor City makers marketplace launching soon',
    is_active: false,
    launch_date: '2025-01-01'
  }
];

async function insertCities() {
  console.log('Checking existing cities...');
  
  // First, check if cities already exist
  const { data: existing, error: fetchError } = await supabase
    .from('cities')
    .select('*');
  
  if (fetchError) {
    console.error('Error fetching cities:', fetchError);
    return;
  }
  
  console.log(`Found ${existing?.length || 0} existing cities`);
  
  if (existing && existing.length > 0) {
    console.log('Existing cities:', existing.map(c => `${c.name} (${c.slug})`).join(', '));
    console.log('\nCities already exist! No need to insert.');
    return;
  }
  
  // Insert cities
  console.log('\nInserting cities...');
  const { data, error } = await supabase
    .from('cities')
    .insert(cities)
    .select();
  
  if (error) {
    console.error('Error inserting cities:', error);
    return;
  }
  
  console.log('✅ Successfully inserted cities:');
  data?.forEach(city => {
    console.log(`  - ${city.name} (${city.slug}) - ${city.is_active ? 'ACTIVE' : 'Coming Soon'}`);
  });
}

insertCities();
