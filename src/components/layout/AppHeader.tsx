'use client';

import * as React from "react";
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
} from "@/components/ui/navigation-menu";
import { ChevronDown } from 'lucide-react';

const navLinks = [
  { href: '/goals', label: 'Tujuan', description: 'Atur & lacak target tabungan.' },
  { href: '/investments', label: 'Investasi', description: 'Pantau perkembangan aset.' },
  { href: '/debts', label: 'Utang/Piutang', description: 'Kelola catatan utang & piutang.' },
];

const settingsLinks = [
    { href: '/data-master', label: 'Data Master', description: 'Kelola kategori & sumber dana.'},
    { href: '/settings', label: 'Pengaturan App', description: 'Sinkronisasi data & pengaturan lain.'}
]

const Logo = () => (
    <div className="flex items-center gap-2">
        <svg version="1.2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 182 187" width="37" height="37">
        <title>KeuanganKu</title>
        <defs>
            <image  width="681" height="184" id="img1" href="data:image/png;base64,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" />
        </defs>
        <style></style>
        <use id="Background" href="#img1" x="4" y="2" className="fill-primary-foreground"/>
        </svg>
        <span className="text-xl font-bold text-primary-foreground">KeuanganKu</span>
    </div>
);


const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = "ListItem"


export default function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-primary/90 text-primary-foreground shadow-md backdrop-blur-sm sticky top-0 z-40">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/">
            <Logo />
        </Link>
        <div className="flex items-center gap-2">
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <Link href="/" legacyBehavior passHref>
                            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), pathname === '/' ? 'bg-primary/80' : '')}>
                                Home
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <Link href="/cash-flow" legacyBehavior passHref>
                            <NavigationMenuLink className={cn(navigationMenuTriggerStyle(), pathname === '/cash-flow' ? 'bg-primary/80' : '')}>
                                Arus Kas
                            </NavigationMenuLink>
                        </Link>
                    </NavigationMenuItem>

                    <NavigationMenuItem>
                        <NavigationMenuTrigger>
                           Lacak
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                            {navLinks.map((component) => (
                            <ListItem
                                key={component.label}
                                title={component.label}
                                href={component.href}
                            >
                                {component.description}
                            </ListItem>
                            ))}
                        </ul>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                     <NavigationMenuItem>
                        <NavigationMenuTrigger>
                           Pengaturan
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[500px]">
                            {settingsLinks.map((component) => (
                            <ListItem
                                key={component.label}
                                title={component.label}
                                href={component.href}
                            >
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
      </nav>
    </header>
  );
}
