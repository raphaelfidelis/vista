import { notFound, redirect } from 'next/navigation';
import { modules } from '@/lib/modules';

export default function Home() {
  const first = modules[0];

  if (!first) {
    notFound();
  }

  redirect(first.href);
}
