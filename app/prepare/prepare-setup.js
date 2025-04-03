// Script to execute the SQL files to set up the prepare feature tables and seed data
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '../../.env.local' });

// Create a Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function executeSQL(filePath) {
  try {
    console.log(`Reading SQL file: ${filePath}`);
    const sql = fs.readFileSync(path.resolve(__dirname, filePath), 'utf8');
    
    // Break the SQL into separate statements
    const statements = sql
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    console.log(`Found ${statements.length} SQL statements to execute`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}`);
      
      if (statement.toLowerCase().startsWith('do ')) {
        // For DO blocks that may contain multiple statements
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement + ';' });
        if (error) {
          console.error(`Error executing DO block: ${error.message}`);
          throw error;
        }
      } else {
        // For regular SQL statements
        const { error } = await supabase.rpc('exec_sql', { sql_statement: statement + ';' });
        if (error) {
          console.error(`Error executing statement: ${error.message}`);
          throw error;
        }
      }
    }
    
    console.log(`Successfully executed all statements from ${filePath}`);
    return true;
  } catch (error) {
    console.error(`Failed to execute SQL from ${filePath}:`, error);
    return false;
  }
}

async function setupPrepareFeature() {
  console.log('Setting up the prepare feature in Supabase...');
  
  try {
    // First create the stored procedure for executing SQL (if it doesn't exist)
    const createProcedureSql = `
    CREATE OR REPLACE FUNCTION exec_sql(sql_statement text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_statement;
    END;
    $$;
    `;
    
    const { error: procError } = await supabase.rpc('exec_sql', { 
      sql_statement: createProcedureSql 
    }).catch(() => {
      // If the function doesn't exist yet, create it directly
      return supabase.sql(createProcedureSql);
    });
    
    if (procError) {
      console.error('Error creating exec_sql procedure:', procError);
      return false;
    }
    
    // Now execute the schema and seed files
    await executeSQL('./schema.sql');
    await executeSQL('./seed-data.sql');
    
    console.log('Prepare feature setup completed successfully!');
    return true;
  } catch (error) {
    console.error('Error setting up prepare feature:', error);
    return false;
  }
}

// Run the setup
setupPrepareFeature()
  .then(success => {
    if (success) {
      console.log('Setup completed successfully.');
      process.exit(0);
    } else {
      console.error('Setup failed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error during setup:', error);
    process.exit(1);
  }); 