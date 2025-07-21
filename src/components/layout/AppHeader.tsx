'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/data-master', label: 'Data Master' },
];

const Logo = () => (
    <div className="flex items-center gap-2 text-white">
        <svg
            width="32"
            height="32"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
        >
            <path d="M10 90C10 90 25 35 60 45L70 30L95 55" stroke="#38A1F4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 90C10 90 25 55 60 65L70 50L95 75" stroke="#38A1F4" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" opacity="0.6"/>
            <path d="M10 90C10 90 45 80 70 50L80 40L95 55" stroke="#4CAF50" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span className="text-xl font-bold">KeuanganKu</span>
    </div>
);


export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
            <Logo />
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
