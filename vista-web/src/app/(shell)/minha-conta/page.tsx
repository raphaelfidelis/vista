import type { Metadata } from 'next';
import { getMe } from '@/lib/auth.api';
import { AccountView } from './AccountView';

export const metadata: Metadata = { title: 'Minha conta · Vista' };

export default async function AccountPage() {
  return <AccountView user={await getMe()} />;
}
