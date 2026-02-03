'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    CalendarDays,
    ShoppingBag,
    Users,
    Package,
    Shield,
    BarChart3,
    Settings,
    MessageSquareText,
    Users2,
    Menu,
    Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { useState } from 'react';

const navItems = [
    { href: '/today', label: 'Today', icon: CalendarDays },
    { href: '/orders', label: 'Orders', icon: ShoppingBag },
    { href: '/customers', label: 'Customers', icon: Users },
    { href: '/inventory', label: 'Inventory', icon: Package },
    { href: '/family', label: 'Family', icon: Users2 },
    { href: '/warranty', label: 'Warranty', icon: Shield },
    { href: '/web-admin', label: 'Web Admin', icon: Globe },
    { href: '/templates', label: 'Templates', icon: MessageSquareText },
    { href: '/reports', label: 'Reports', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
];

function NavContent({ isMobile = false, onItemClick }: { isMobile?: boolean, onItemClick?: () => void }) {
    const pathname = usePathname();

    return (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <div className={cn("border-b border-white/20", isMobile ? "p-4" : "p-6")}>
                <div className="flex items-center gap-4">
                    <img
                        src="/logo.jpg"
                        alt="Tiệm Bản Quyền Logo"
                        className="w-12 h-12 rounded-full object-cover shadow-lg border-2 border-white/50"
                    />
                    <div>
                        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">
                            TBQ
                        </h1>
                        <p className="text-xs font-medium text-gray-500/80 uppercase tracking-widest">Tiệm Bản Quyền</p>
                    </div>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={onItemClick}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-300 group min-h-[48px] active:scale-[0.98]',
                                isActive
                                    ? 'bg-gradient-to-r from-indigo-500/90 to-violet-600/90 text-white shadow-lg shadow-indigo-500/20 translate-x-1'
                                    : 'text-gray-600 hover:bg-white/40 hover:text-indigo-600 hover:shadow-sm'
                            )}
                        >
                            <Icon className={cn(
                                "h-5 w-5 transition-transform duration-300 group-hover:scale-110",
                                isActive ? "text-white" : "text-gray-400 group-hover:text-indigo-500"
                            )} />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className={cn("border-t border-white/20 backdrop-blur-sm bg-white/10", isMobile ? "p-4" : "p-6")}>
                <div className="flex items-center justify-center gap-2 text-xs font-medium text-gray-400/80">
                    <span>© 2026 TBQ</span>
                    <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse"></span>
                    <span>iOS 26 Beta (v1.1)</span>
                </div>
            </div>
        </div>
    );
}

export function Sidebar() {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Desktop Sidebar - Hidden on mobile */}
            <aside className="w-64 h-screen liquid-sidebar hidden md:flex flex-col sticky top-0 shrink-0 z-50">
                <NavContent />
            </aside>

            {/* Mobile Header - Visible only on mobile */}
            <header className="md:hidden flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b sticky top-0 z-50">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo.jpg"
                        alt="Logo"
                        className="w-10 h-10 rounded-full border border-gray-200"
                    />
                    <div className="flex flex-col">
                        <span className="font-bold text-gray-900 text-lg leading-tight">TBQ</span>
                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">Tiệm Bản Quyền</span>
                    </div>
                </div>

                <Sheet open={open} onOpenChange={setOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                            <Menu className="h-6 w-6 text-gray-700" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 border-r-0 w-72 bg-[#FAFAFA]">
                        <SheetTitle className="sr-only">Menu</SheetTitle>
                        <SheetDescription className="sr-only">Navigation Menu</SheetDescription>
                        <NavContent isMobile onItemClick={() => setOpen(false)} />
                    </SheetContent>
                </Sheet>
            </header>
        </>
    );
}
