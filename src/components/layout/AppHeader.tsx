'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Wallet } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/data-master', label: 'Data Master' },
];

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="flex items-center gap-2">
            <Wallet className="h-7 w-7" />
            <span className="text-xl font-bold">KeuanganKu</span>
        </Link>
        <div className="flex items-center gap-6">
          {navLinks.map((link) => (
            <Link key={link.href} href={link.href}>
              <span
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary-foreground/80',
                  pathname === link.href ? 'text-primary-foreground' : 'text-primary-foreground/70'
                )}
              >
                {link.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
