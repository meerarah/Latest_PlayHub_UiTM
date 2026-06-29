
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://zlsoolsujvoyerzzizhr.supabase.co';
const supabaseAnonKey = 'sb_publishable_Trt_RDhT2ku-sMF0Y7KkPw_ueGsbVw9';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function findColumns() {
  console.log("Identifying columns for 'Admin' table...");
  // We'll try to insert a garbage column name to get a list of valid columns from the error message.
  const { error } = await supabase.from('Admin').insert([{ this_column_does_not_exist: 'test' }]);
  if (error) {
    console.log("Error message (should contain valid columns):", error.message);
  }
}

findColumns();
