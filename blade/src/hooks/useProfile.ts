import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'

// dexie-react-hooks only re-renders when the resolved value differs from the default
// (undefined). A brand-new database resolves `get()` to undefined too, so without the `?? null`
// coercion the hook would never fire its first update and the app would hang on "loading".
export function useProfile() {
  return useLiveQuery(async () => (await db.profile.get('profile')) ?? null, [])
}

export function useSettings() {
  return useLiveQuery(async () => (await db.settings.get('settings')) ?? null, [])
}
