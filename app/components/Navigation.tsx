'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="sticky top-0 z-40 border-b border-white/10 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <h1 className="text-2xl font-bold gradient-text">Mantis Music</h1>
          </Link>

          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-4 py-2 rounded-lg transition ${
                isActive('/')
                  ? 'gradient-bg text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Home
            </Link>
            <Link
              href="/search"
              className={`px-4 py-2 rounded-lg transition ${
                isActive('/search')
                  ? 'gradient-bg text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              Search
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
