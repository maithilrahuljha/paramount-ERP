/**
 * PMN ERP Platform - Home Page
 * Redirects to login or dashboard based on auth status
 */

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function HomePage() {
  const cookieStore = await cookies();
  const authToken = cookieStore.get('auth_token');
  
  if (authToken) {
    redirect('/crm');
  } else {
    redirect('/login');
  }
}
