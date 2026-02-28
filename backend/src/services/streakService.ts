import { supabase } from '../supabase'

export async function getStreakForUser(userId: string) {
  const { data, error } = await supabase.rpc('calculate_streak', {
    p_user_id: userId,
  })

  if (error) {
    console.error('Error calling calculate_streak function:', error)
    throw new Error('Could not calculate streak.')
  }

  // The RPC function returns an array with a single object
  return data && data.length > 0 ? data[0] : null
}
