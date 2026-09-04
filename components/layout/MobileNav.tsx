"use client";

import { useUser } from "@clerk/nextjs";
import { LayoutDashboardIcon, MessageCircleIcon, UsersIcon, HomeIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Home",
    href: "/",
    icon: HomeIcon,
  },
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  {
    label: "Communities",
    href: "/communities",
    icon: UsersIcon,
  },
  {
    label: "Chat",
    href: "/chat",
    icon: MessageCircleIcon,
  },
];

export default function MobileNav() {
  const { isSignedIn } = useUser();
  const pathname = usePathname();

  // Only render for signed-in users, and only on mobile screens
  if (!isSignedIn) return null;

  return (
    <nav className="mobile-nav flex md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn("mobile-nav-item", isActive && "mobile-nav-item--active")}
          >
            <span className="mobile-nav-icon-wrap">
              <Icon
                className={cn(
                  "mobile-nav-icon",
                  isActive && "mobile-nav-icon--active"
                )}
              />
              {isActive && <span className="mobile-nav-dot" />}
            </span>
            <span className="mobile-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
