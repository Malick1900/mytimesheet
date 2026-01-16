import { Head, usePage, Link } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import StatusBadge from '@/Components/StatusBadge';
import { PageProps, TimeEntry } from '@/types';

interface WeekDay {
    date: string;
    dayName: string;
    dayNum: number;
    isToday: boolean;
    isWeekend: boolean;
    minutes: number;
}

interface DashboardProps {
    employeeStats: {
        weekHours: number;
        monthHours: number;
        lastMonthHours: number;
        draftCount: number;
        submittedCount: number;
        approvedCount: number;
        rejectedCount: number;
    };
    recentEntries: TimeEntry[];
    weekDays: WeekDay[];
    managerStats: {
        pendingValidations: number;
        teamSize: number;
        validatedThisWeek: number;
        rejectedThisWeek: number;
    };
    pendingSubmissions: TimeEntry[];
    teamActivity: TimeEntry[];
    adminStats: {
        totalEmployees: number;
        totalUsers: number;
        totalSubsidiaries: number;
        totalServices: number;
        monthEntries: number;
    };
    recentUsers: any[];
    isManager: boolean;
    isAdmin: boolean;
    currentMonth: string;
}

export default function Dashboard({
    employeeStats,
    recentEntries = [],
    weekDays = [],
    managerStats,
    pendingSubmissions = [],
    teamActivity = [],
    adminStats,
    recentUsers = [],
    isManager,
    isAdmin,
    currentMonth,
}: DashboardProps) {
    const { auth } = usePage<PageProps>().props;

    const formatHours = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const getProgressColor = (current: number, previous: number) => {
        if (previous === 0) return 'text-gray-400';
        const diff = ((current - previous) / previous) * 100;
        if (diff > 0) return 'text-green-500';
        if (diff < 0) return 'text-red-500';
        return 'text-gray-400';
    };

    const getProgressText = (current: number, previous: number) => {
        if (previous === 0) return 'Nouveau mois';
        const diff = ((current - previous) / previous) * 100;
        if (diff > 0) return `+${diff.toFixed(0)}% vs mois dernier`;
        if (diff < 0) return `${diff.toFixed(0)}% vs mois dernier`;
        return 'Identique au mois dernier';
    };

    return (
        <AppLayout currentPage="dashboard" title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                {/* Header avec salutation */}
                <div className="bg-gradient-to-r from-corporate-blue to-blue-600 text-white p-6 rounded-xl">
                    <h1 className="text-2xl font-bold">
                        Bonjour, {auth.user.email?.split('@')[0] || 'Utilisateur'} 👋
                    </h1>
                    <p className="text-blue-100 mt-1">
                        {isAdmin ? '🛡️ Administrateur' : isManager ? '👔 Manager' : '👤 Employé'} • {currentMonth}
                    </p>
                </div>

                {/* ==================== SECTION EMPLOYÉ ==================== */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Stats personnelles */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Heures semaine/mois */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">📅</span>
                                    <span className="text-xs text-gray-400">Cette semaine</span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800 mt-2">
                                    {formatHours(employeeStats?.weekHours || 0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Heures travaillées</p>
                            </div>
                            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between">
                                    <span className="text-2xl">📊</span>
                                    <span className={`text-xs ${getProgressColor(employeeStats?.monthHours || 0, employeeStats?.lastMonthHours || 0)}`}>
                                        {getProgressText(employeeStats?.monthHours || 0, employeeStats?.lastMonthHours || 0)}
                                    </span>
                                </div>
                                <p className="text-3xl font-bold text-gray-800 mt-2">
                                    {formatHours(employeeStats?.monthHours || 0)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Ce mois</p>
                            </div>
                        </div>

                        {/* Statut des entrées */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4">📋 Statut de mes entrées (ce mois)</h3>
                            <div className="grid grid-cols-4 gap-3">
                                <div className="text-center p-3 bg-gray-50 rounded-lg">
                                    <p className="text-2xl font-bold text-gray-600">{employeeStats?.draftCount || 0}</p>
                                    <p className="text-xs text-gray-500">Brouillons</p>
                                </div>
                                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                    <p className="text-2xl font-bold text-yellow-600">{employeeStats?.submittedCount || 0}</p>
                                    <p className="text-xs text-yellow-600">En attente</p>
                                </div>
                                <div className="text-center p-3 bg-green-50 rounded-lg">
                                    <p className="text-2xl font-bold text-green-600">{employeeStats?.approvedCount || 0}</p>
                                    <p className="text-xs text-green-600">Validées</p>
                                </div>
                                <div className="text-center p-3 bg-red-50 rounded-lg">
                                    <p className="text-2xl font-bold text-red-600">{employeeStats?.rejectedCount || 0}</p>
                                    <p className="text-xs text-red-600">Rejetées</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mini calendrier semaine */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">🗓️ Ma semaine</h3>
                        <div className="space-y-2">
                            {weekDays.map((day) => (
                                <div
                                    key={day.date}
                                    className={`flex items-center gap-3 p-2 rounded-lg ${
                                        day.isToday ? 'bg-corporate-blue/10 border border-corporate-blue/20' : 
                                        day.isWeekend ? 'bg-gray-50' : ''
                                    }`}
                                >
                                    <div className={`w-10 h-10 rounded-lg flex flex-col items-center justify-center text-xs ${
                                        day.isToday ? 'bg-corporate-blue text-white' : 
                                        day.isWeekend ? 'bg-gray-200 text-gray-500' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                        <span className="font-medium">{day.dayName}</span>
                                        <span className="font-bold">{day.dayNum}</span>
                                    </div>
                                    <div className="flex-1">
                                        {day.minutes > 0 ? (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                    <div 
                                                        className="bg-corporate-green h-2 rounded-full" 
                                                        style={{ width: `${Math.min((day.minutes / 480) * 100, 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {formatHours(day.minutes)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                {day.isWeekend ? 'Week-end' : 'Pas d\'entrée'}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href={route('timesheet.index')}
                            className="mt-4 block text-center text-sm text-corporate-blue hover:underline"
                        >
                            Voir mon calendrier →
                        </Link>
                    </div>
                </div>

                {/* ==================== SECTION MANAGER ==================== */}
                {(isManager || isAdmin) && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Stats manager */}
                        <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-5 rounded-xl">
                            <h3 className="font-semibold mb-4 flex items-center gap-2">
                                👔 {isAdmin ? 'Vue Globale' : 'Mon Équipe'}
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-3xl font-bold">{managerStats?.teamSize || 0}</p>
                                    <p className="text-indigo-200 text-xs">Employés</p>
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{managerStats?.pendingValidations || 0}</p>
                                    <p className="text-indigo-200 text-xs">À valider</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-green-300">+{managerStats?.validatedThisWeek || 0}</p>
                                    <p className="text-indigo-200 text-xs">Validées (sem.)</p>
                                </div>
                                <div>
                                    <p className="text-xl font-bold text-red-300">{managerStats?.rejectedThisWeek || 0}</p>
                                    <p className="text-indigo-200 text-xs">Rejetées (sem.)</p>
                                </div>
                            </div>
                            <Link
                                href={route('validation.index')}
                                className="mt-4 block text-center text-sm bg-white/20 hover:bg-white/30 py-2 rounded-lg transition-colors"
                            >
                                Gérer les validations →
                            </Link>
                        </div>

                        {/* Soumissions en attente */}
                        <div className="lg:col-span-2 bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-800">⏳ Soumissions en attente</h3>
                                {pendingSubmissions.length > 0 && (
                                    <span className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full font-medium">
                                        {managerStats?.pendingValidations || 0} total
                                    </span>
                                )}
                            </div>
                            {pendingSubmissions.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-4xl">✅</span>
                                    <p className="mt-2">Aucune soumission en attente</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {pendingSubmissions.slice(0, 5).map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <div className="w-9 h-9 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold text-sm">
                                                {entry.employee?.first_name?.charAt(0)}{entry.employee?.last_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {entry.employee?.last_name} {entry.employee?.first_name}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {entry.subsidiary?.name} • {formatHours(entry.minutes)}
                                                </p>
                                            </div>
                                            <span className="text-xs text-gray-400">
                                                {new Date(entry.work_date).toLocaleDateString('fr-FR')}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ==================== SECTION ADMIN ==================== */}
                {isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-blue-500">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">👥</span>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{adminStats?.totalEmployees || 0}</p>
                                    <p className="text-xs text-gray-500">Employés actifs</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-green-500">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏢</span>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{adminStats?.totalSubsidiaries || 0}</p>
                                    <p className="text-xs text-gray-500">Filiales actives</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-purple-500">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚙️</span>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{adminStats?.totalServices || 0}</p>
                                    <p className="text-xs text-gray-500">Services actifs</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-orange-500">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📝</span>
                                <div>
                                    <p className="text-2xl font-bold text-gray-800">{adminStats?.monthEntries || 0}</p>
                                    <p className="text-xs text-gray-500">Entrées ce mois</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ==================== ACTIVITÉ RÉCENTE ==================== */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Mes entrées récentes */}
                    <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-semibold text-gray-800 mb-4">📅 Mes entrées récentes</h3>
                        {recentEntries.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <span className="text-4xl">📭</span>
                                <p className="mt-2">Aucune entrée récente</p>
                                <Link
                                    href={route('timesheet.index')}
                                    className="mt-2 inline-block text-sm text-corporate-blue hover:underline"
                                >
                                    Ajouter une entrée →
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {recentEntries.slice(0, 5).map((entry) => (
                                    <div
                                        key={entry.id}
                                        className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-lg bg-blue-50 text-corporate-blue flex items-center justify-center font-bold text-sm">
                                            {new Date(entry.work_date).getDate()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {entry.subsidiary?.name || 'Filiale'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {entry.service?.name || 'Service'} • {formatHours(entry.minutes)}
                                            </p>
                                        </div>
                                        <StatusBadge status={entry.status} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Activité équipe (Manager/Admin) ou Actions rapides (Employé) */}
                    {(isManager || isAdmin) ? (
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4">🔔 Activité de l'équipe</h3>
                            {teamActivity.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">
                                    <span className="text-4xl">📭</span>
                                    <p className="mt-2">Aucune activité récente</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {teamActivity.slice(0, 6).map((entry) => (
                                        <div
                                            key={entry.id}
                                            className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors"
                                        >
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                                                entry.status === 'APPROVED' ? 'bg-green-100 text-green-600' :
                                                entry.status === 'REJECTED' ? 'bg-red-100 text-red-600' :
                                                'bg-yellow-100 text-yellow-600'
                                            }`}>
                                                {entry.employee?.first_name?.charAt(0)}{entry.employee?.last_name?.charAt(0)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs text-gray-800 truncate">
                                                    <span className="font-medium">{entry.employee?.first_name}</span>
                                                    {' - '}
                                                    {entry.status === 'APPROVED' ? 'validé' :
                                                     entry.status === 'REJECTED' ? 'rejeté' : 'soumis'}
                                                </p>
                                                <p className="text-xs text-gray-400">{entry.subsidiary?.name}</p>
                                            </div>
                                            <StatusBadge status={entry.status} />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-800 mb-4">⚡ Actions rapides</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <Link
                                    href={route('timesheet.index')}
                                    className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
                                >
                                    <span className="text-3xl">📝</span>
                                    <span className="text-sm font-medium text-blue-700">Saisir mes heures</span>
                                </Link>
                                <Link
                                    href={route('reports.index')}
                                    className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors"
                                >
                                    <span className="text-3xl">📊</span>
                                    <span className="text-sm font-medium text-green-700">Voir mes rapports</span>
                                </Link>
                            </div>
                            {employeeStats?.draftCount > 0 && (
                                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <p className="text-sm text-yellow-700">
                                        ⚠️ Vous avez <strong>{employeeStats.draftCount} brouillon(s)</strong> à soumettre
                                    </p>
                                </div>
                            )}
                            {employeeStats?.rejectedCount > 0 && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-sm text-red-700">
                                        ❌ <strong>{employeeStats.rejectedCount} entrée(s)</strong> rejetée(s) à corriger
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
