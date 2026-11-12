import { createClient } from '@supabase/supabase-js';
export function createSupabaseClient(supabaseUrl, supabaseKey) {
    const url = supabaseUrl || (typeof process !== 'undefined' ? process?.env?.NEXT_PUBLIC_SUPABASE_URL : '') || '';
    const key = supabaseKey || (typeof process !== 'undefined' ? process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY : '') || '';
    if (!url || !key) {
        console.warn('Supabase URL or Key missing. Check .env.local configuration.');
    }
    return createClient(url, key);
}
