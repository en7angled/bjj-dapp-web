'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, Users, BarChart3, Plus, Home, User, Moon, Sun, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { beltColors } from '@/lib/utils';
import type { BJJBelt } from '@/types/api';
import { useEffect, useState } from 'react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Belts', href: '/belts', icon: Trophy },
  { name: 'Profiles', href: '/profiles', icon: Users },
  // Promotions and Analytics removed; handled within other pages
  { name: 'My Profile', href: '/profile', icon: User },
];

export function Navigation() {
  const pathname = usePathname();
  // Default to dark to match server render; sync real preference after mount
  const [theme, setTheme] = useState<'light'|'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // On mount, hydrate from localStorage and apply
    try {
      const saved = (localStorage.getItem('theme') as 'light'|'dark' | null);
      const next = saved ?? 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      setTheme(next);
    } catch {
      document.documentElement.classList.toggle('dark', true);
      setTheme('dark');
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    try { localStorage.setItem('theme', theme); } catch {}
  }, [theme, mounted]);

  const { user: profile, isAuthenticated } = useAuth();
  const currentBelt: BJJBelt | null = (profile && 'current_rank' in (profile as any))
    ? ((profile as any).current_rank?.belt as BJJBelt | undefined) ?? null
    : null;
  const navProfileIcon = isAuthenticated && currentBelt ? (
    <span className="inline-flex items-center justify-center rounded-full w-5 h-5 mr-2" style={{ backgroundColor: beltColors[currentBelt] }}>
      <Award className="w-3.5 h-3.5" style={{ color: currentBelt === 'White' ? '#111827' : '#FFFFFF' }} />
    </span>
  ) : (
    <User className="w-4 h-4 mr-2" />
  );

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="ml-2 text-xl font-bold text-gray-900">
                BJJ Belt System
              </span>
            </div>
          </div>
          
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  {item.name === 'My Profile' ? navProfileIcon : <item.icon className="w-4 h-4 mr-2" />}
                  {item.name}
                </Link>
              );
            })}
            {mounted && (
              <button
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="ml-4 inline-flex items-center px-2 py-1 border rounded text-sm text-gray-600 hover:text-gray-900"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? (<Sun className="w-4 h-4" />) : (<Moon className="w-4 h-4" />)}
              </button>
            )}
          </div>

          <div className="flex items-center sm:hidden">
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
