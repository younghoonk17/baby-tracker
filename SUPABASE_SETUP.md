# Supabase Database Setup

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create babies table
CREATE TABLE IF NOT EXISTS babies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for babies
ALTER TABLE babies ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own babies
CREATE POLICY "Users can only see their own babies" ON babies
  FOR ALL USING (auth.uid() = user_id);

-- Create sleep_logs table
CREATE TABLE IF NOT EXISTS sleep_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  baby_id UUID NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ, -- NULL means currently sleeping
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for sleep_logs
ALTER TABLE sleep_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see sleep logs for their own babies
CREATE POLICY "Users can see sleep logs for their own babies" ON sleep_logs
  FOR ALL USING (
    baby_id IN (SELECT id FROM babies WHERE user_id = auth.uid())
  );
```
