-- S1-A2: Update handle_new_user trigger to sync full_name from auth metadata
-- The signup form stores full_name in auth.users.raw_user_meta_data.
-- This trigger update reads it and populates profiles.full_name on insert.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
