# Apply Realtime Config Migration

## Quick Fix: Create the `realtime_config` Table

The `realtime_config` table is missing from your database. Follow these steps to create it:

### Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://supabase.com/dashboard
   - Select your project: `ejcuykfircnnqljcemgo`

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Run the Migration**
   - Copy the entire contents of `supabase/migrations/13_create_realtime_config.sql`
   - Paste it into the SQL Editor
   - Click "Run" or press `Cmd+Enter` (Mac) / `Ctrl+Enter` (Windows)

4. **Verify Success**
   - You should see "Success. No rows returned"
   - The table should now be created with default configurations

### Option 2: Using Supabase CLI (If Available)

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref ejcuykfircnnqljcemgo

# Apply the migration
supabase db push
```

### What This Migration Creates

- ✅ `realtime_config` table for OpenAI Realtime API configurations
- ✅ Indexes for performance
- ✅ RLS policies for admin access
- ✅ Helper function `get_active_realtime_config()`
- ✅ Trigger for automatic timestamp updates
- ✅ Default configurations (Realtime Voice Chat & Transcription)

### After Applying

1. Refresh your browser at `/admin/realtime-config`
2. The error message should disappear
3. You should see the default configurations in the table
4. You can now create, edit, and manage realtime configurations

---

**Note**: The migration uses `CREATE TABLE IF NOT EXISTS`, so it's safe to run multiple times.

