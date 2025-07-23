'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const navLinks = [
  { href: '/goals', label: 'Tujuan', description: 'Atur & lacak target tabungan.' },
  { href: '/investments', label: 'Investasi', description: 'Pantau perkembangan aset.' },
  { href: '/debts', label: 'Utang/Piutang', description: 'Kelola catatan utang & piutang.' },
];

const settingsLinks = [
  { href: '/data-master', label: 'Data Master', description: 'Kelola kategori & sumber dana.' },
  { href: '/settings', label: 'Pengaturan App', description: 'Sinkronisasi data & pengaturan lain.' },
];

const Logo = () => (
  <div className="flex items-center gap-2">
    <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 182 187" width="32" height="37">
      <title>Keuanganku</title>
      <use href="logo.svg" />
    </svg>
    <span className="text-xl font-bold text-primary-foreground">
      KeuanganKu
    </span>
  </div>
);

const ListItem = React.forwardRef<React.ElementRef<'a'>, React.ComponentPropsWithoutRef<'a'>>(
  ({ className, title, children, ...props }, ref) => {
    return (
      <li>
        <NavigationMenuLink asChild>
          <a
            ref={ref}
            className={cn(
              'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
              className
            )}
            {...props}
          >
            <div className="text-sm font-medium leading-none">{title}</div>
            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">{children}</p>
          </a>
        </NavigationMenuLink>
      </li>
    );
  }
);
ListItem.displayName = 'ListItem';

export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
          <Logo />
        </Link>
        <div className="hidden md:flex items-center gap-2">
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle(), pathname === '/' ? 'bg-primary/80' : 'bg-transparent')}
                >
                  <Link href="/">Home</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={cn(navigationMenuTriggerStyle(), pathname === '/cash-flow' ? 'bg-primary/80' : 'bg-transparent')}
                >
                  <Link href="/cash-flow">Arus Kas</Link>
                </NavigationMenuLink>
              </NavigationMenuItem>

              <NavigationMenuItem>
                <NavigationMenuTrigger>Lacak</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                    {navLinks.map((component) => (
                      <ListItem key={component.label} title={component.label} href={component.href}>
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Pengaturan</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                    {settingsLinks.map((component) => (
                      <ListItem key={component.label} title={component.label} href={component.href}>
                        {component.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
          <ThemeToggle />
        </div>
        <div className="md:hidden flex items-center">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Buka Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm">
              <div className="flex flex-col h-full">
                <div className="border-b pb-4 mb-4">
                  <Logo />
                </div>
                <div className="flex-grow">
                  <nav className="flex flex-col gap-2">
                    <SheetClose asChild>
                      <Link
                        href="/"
                        className={cn('text-lg font-medium p-2 rounded-md', pathname === '/' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent')}
                      >
                        Home
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href="/cash-flow"
                        className={cn('text-lg font-medium p-2 rounded-md', pathname === '/cash-flow' ? 'bg-accent text-accent-foreground' : 'hover:bg-accent')}
                      >
                        Arus Kas
                      </Link>
                    </SheetClose>

                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="lacak">
                        <AccordionTrigger className="text-lg font-medium p-2 hover:no-underline">Lacak</AccordionTrigger>
                        <AccordionContent className="pl-4">
                          <ul className="grid gap-3 p-2">
                            {navLinks.map((component) => (
                              <li key={component.label}>
                                <SheetClose asChild>
                                  <Link href={component.href} className="block p-2 rounded-md hover:bg-accent">
                                    <div className="font-semibold">{component.label}</div>
                                    <p className="text-sm text-muted-foreground">{component.description}</p>
                                  </Link>
                                </SheetClose>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="pengaturan">
                        <AccordionTrigger className="text-lg font-medium p-2 hover:no-underline">Pengaturan</AccordionTrigger>
                        <AccordionContent className="pl-4">
                           <ul className="grid gap-3 p-2">
                            {settingsLinks.map((component) => (
                               <li key={component.label}>
                                <SheetClose asChild>
                                  <Link href={component.href} className="block p-2 rounded-md hover:bg-accent">
                                    <div className="font-semibold">{component.label}</div>
                                    <p className="text-sm text-muted-foreground">{component.description}</p>
                                  </Link>
                                </SheetClose>
                              </li>
                            ))}
                          </ul>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </nav>
                </div>
                <div className="mt-auto pt-4 border-t">
                  <ThemeToggle />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </header>
  );
}
