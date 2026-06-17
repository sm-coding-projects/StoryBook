'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function updateStudioName(studioName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthorized');

  const trimmed = studioName.trim();
  if (!trimmed) throw new Error('Studio name cannot be empty');
  if (trimmed.length > 80) throw new Error('Studio name is too long');

  const { error } = await supabase
    .from('profiles')
    .update({ studio_name: trimmed })
    .eq('user_id', user.id);

  if (error) throw new Error(error.message);

  revalidatePath('/admin', 'layout');
  return { success: true };
}
