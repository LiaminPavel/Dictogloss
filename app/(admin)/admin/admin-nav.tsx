"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  isActive: (pathname: string) => boolean;
};

const navItems: NavItem[] = [
  {
    href: "/admin/dashboard",
    label: "Dashboard",
    isActive: (pathname) => pathname.startsWith("/admin/dashboard"),
  },
  {
    href: "/admin/lessons/new",
    label: "Create lesson",
    isActive: (pathname) => pathname.startsWith("/admin/lessons/new"),
  },
];

export function AdminNav(): React.ReactElement {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-2">
      {navItems.map((item) => {
        const active = item.isActive(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-md px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-zinc-900 text-white"
                : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
