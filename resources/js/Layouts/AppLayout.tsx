import { Link, usePage, router } from '@inertiajs/react';
import { PropsWithChildren, useState, useEffect, useRef } from 'react';
import Logo from '@/Components/Logo';
import { PageProps, UserRole } from '@/types';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    data: any;
    read_at: string | null;
    created_at: string;
}

interface NavItem {
    id: string;
    label: string;
    icon: string;
    href: string;
    roles: UserRole[];
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', href: '/dashboard', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { id: 'timesheet', label: 'Mes Heures', icon: '🕒', href: '/timesheet', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { id: 'validation', label: 'Validations', icon: '✅', href: '/validation', roles: ['MANAGER', 'ADMIN'] },
    { id: 'reports', label: 'Rapports', icon: '📈', href: '/reports', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
    { id: 'estimation', label: 'Estimation', icon: '💰', href: '/estimation', roles: ['MANAGER', 'ADMIN'] },
    { id: 'subsidiary-services', label: 'Services/Filiales', icon: '🔗', href: '/admin/subsidiary-services', roles: ['ADMIN'] },
    { id: 'subsidiaries', label: 'Filiales', icon: '🏢', href: '/admin/subsidiaries', roles: ['ADMIN'] },
    { id: 'services', label: 'Services', icon: '🏷️', href: '/admin/services', roles: ['ADMIN'] },
    { id: 'employees', label: 'Employés', icon: '👥', href: '/admin/employees', roles: ['ADMIN'] },
    { id: 'users', label: 'Utilisateurs', icon: '🔐', href: '/admin/users', roles: ['ADMIN'] },
];

interface AppLayoutProps extends PropsWithChildren {
    currentPage?: string;
    title?: string;
}

export default function AppLayout({ children, currentPage, title }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;
    
    // État du sidebar (ouvert/fermé) - persisté dans localStorage
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebarOpen');
            return saved !== null ? JSON.parse(saved) : true;
        }
        return true;
    });

    // État des notifications
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
    const notifRef = useRef<HTMLDivElement>(null);

    // Charger les notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch('/notifications/unread');
            const data = await response.json();
            setNotifications(data.notifications || []);
            setUnreadCount(data.unread_count || 0);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    // Marquer une notification comme lue
    const markAsRead = async (notificationId: string) => {
        try {
            await fetch(`/notifications/${notificationId}/read`, { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    // Marquer toutes comme lues
    const markAllAsRead = async () => {
        try {
            await fetch('/notifications/read-all', { method: 'POST', headers: { 'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '' } });
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    // Sauvegarder l'état dans localStorage
    useEffect(() => {
        localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }, [sidebarOpen]);

    // Charger les notifications au montage et périodiquement
    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Toutes les 30 secondes
        return () => clearInterval(interval);
    }, []);

    // Fermer le dropdown quand on clique ailleurs
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
                setNotifDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const userRoles = user.roles?.map(r => r.name) || ['EMPLOYEE'];
    const primaryRole = userRoles.includes('ADMIN') ? 'ADMIN' : userRoles.includes('MANAGER') ? 'MANAGER' : 'EMPLOYEE';
    
    const filteredItems = navItems.filter(item => 
        item.roles.some(role => userRoles.includes(role))
    );

    const displayName = user.employee?.full_name || user.employee?.first_name || user.email.split('@')[0];

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffMins < 1) return 'À l\'instant';
        if (diffMins < 60) return `Il y a ${diffMins}min`;
        if (diffHours < 24) return `Il y a ${diffHours}h`;
        return `Il y a ${diffDays}j`;
    };

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'TASK_SUBMITTED': return '📋';
            case 'TASK_APPROVED': return '✅';
            case 'TASK_REJECTED': return '❌';
            default: return '🔔';
        }
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-corporate-blue text-white flex flex-col shadow-2xl z-30 transition-all duration-300`}>
                {/* Header avec logo et bouton toggle */}
                <div className={`${sidebarOpen ? 'p-6' : 'p-4'} flex items-center justify-between`}>
                    {sidebarOpen ? (
                        <Logo size="sm" className="brightness-0 invert" />
                    ) : (
                        <div className="w-full flex justify-center">
                            <span className="text-2xl font-bold">MT</span>
                        </div>
                    )}
                </div>

                {/* Bouton toggle */}
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className={`mx-auto mb-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all ${sidebarOpen ? '-mr-4 relative z-50' : ''}`}
                    title={sidebarOpen ? 'Réduire le menu' : 'Agrandir le menu'}
                >
                    <span className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
                        ◀
                    </span>
                </button>
                
                <nav className={`flex-1 ${sidebarOpen ? 'px-4' : 'px-2'} space-y-1 overflow-y-auto`}>
                    {sidebarOpen && (
                        <p className="px-4 text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-2 opacity-50">
                            Menu Principal
                        </p>
                    )}
                    {filteredItems.map((item) => (
                        <Link
                            key={item.id}
                            href={item.href}
                            className={`w-full flex items-center ${sidebarOpen ? 'gap-3 px-4' : 'justify-center px-2'} py-3 rounded-xl transition-all duration-200 group ${
                                currentPage === item.id 
                                    ? 'bg-white text-corporate-blue shadow-lg font-bold' 
                                    : 'hover:bg-white/10 text-blue-50'
                            }`}
                            title={!sidebarOpen ? item.label : undefined}
                        >
                            <span className={`text-xl transition-transform group-hover:scale-110 ${currentPage === item.id ? '' : 'opacity-70'}`}>
                                {item.icon}
                            </span>
                            {sidebarOpen && <span className="text-sm">{item.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className={`${sidebarOpen ? 'p-6' : 'p-2'} mt-auto`}>
                    {sidebarOpen ? (
                        <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                            <Link href="/profile" className="flex items-center gap-3 mb-3 hover:opacity-80 transition-opacity">
                                <div className="w-10 h-10 rounded-full bg-corporate-green flex items-center justify-center font-bold text-white border-2 border-white/20">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-bold truncate">{displayName}</span>
                                    <span className="text-[9px] uppercase tracking-tighter text-blue-200 font-bold opacity-70">
                                        {primaryRole}
                                    </span>
                                </div>
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors"
                            >
                                Déconnexion
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-2">
                            <Link href="/profile" title={displayName}>
                                <div className="w-10 h-10 rounded-full bg-corporate-green flex items-center justify-center font-bold text-white border-2 border-white/20 hover:scale-110 transition-transform">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                                title="Déconnexion"
                            >
                                🚪
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-10 z-20">
                    <div className="flex items-center gap-4">
                        {/* Bouton hamburger pour mobile */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            ☰
                        </button>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-extrabold text-gray-800 tracking-tight">
                                {title || navItems.find(n => n.id === currentPage)?.label || 'Dashboard'}
                            </h2>
                            <span className="text-[10px] text-gray-400 font-medium">
                                MyTimesheet / {title || navItems.find(n => n.id === currentPage)?.label}
                            </span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Période</span>
                            <span className="text-sm font-bold text-corporate-blue">
                                {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100"></div>
                        
                        {/* Notifications Dropdown */}
                        <div className="relative" ref={notifRef}>
                            <button 
                                onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                                className="relative p-2 bg-gray-50 rounded-full text-gray-400 hover:bg-blue-50 hover:text-corporate-blue transition-all"
                            >
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                                🔔
                            </button>
                            
                            {notifDropdownOpen && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                                    <div className="p-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800 text-sm">🔔 Notifications</h3>
                                        {unreadCount > 0 && (
                                            <button 
                                                onClick={markAllAsRead}
                                                className="text-xs text-corporate-blue hover:underline"
                                            >
                                                Tout marquer comme lu
                                            </button>
                                        )}
                                    </div>
                                    <div className="max-h-80 overflow-y-auto">
                                        {notifications.length === 0 ? (
                                            <div className="p-6 text-center text-gray-400">
                                                <span className="text-3xl">📭</span>
                                                <p className="mt-2 text-sm">Aucune notification</p>
                                            </div>
                                        ) : (
                                            notifications.map((notif) => (
                                                <div 
                                                    key={notif.id}
                                                    onClick={() => markAsRead(notif.id)}
                                                    className={`p-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors ${
                                                        !notif.read_at ? 'bg-blue-50/50' : ''
                                                    }`}
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                                                                {notif.message}
                                                            </p>
                                                            <p className="text-xs text-gray-400 mt-1">
                                                                {formatTimeAgo(notif.created_at)}
                                                            </p>
                                                        </div>
                                                        {!notif.read_at && (
                                                            <span className="w-2 h-2 bg-corporate-blue rounded-full flex-shrink-0 mt-2"></span>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                
                <div className="flex-1 overflow-y-auto bg-gray-50/30 p-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
