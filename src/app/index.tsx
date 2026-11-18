import { getLastTab } from '@/src/lib/last-tab'
import { Redirect } from 'expo-router'

/** Cold start: reopen the last tab the user was on (itinerary by default). */
export default function Index() {
  return <Redirect href={`/${getLastTab()}`} />
}
