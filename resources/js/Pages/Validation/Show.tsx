import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import AuthButton from '@/Components/AuthButton';
import StatusBadge from '@/Components/StatusBadge';
import { TimeEntry, Employee } from '@/types';

interface ValidationShowProps {
    employee: Employee;
    entries: TimeEntry[];
    currentMonth: string;
}

interface DayData {
    day: number;
    date: Date;
    entries: TimeEntry[];
    totalMinutes: number;
    isCurrentMonth: boolean;
}

export default function ValidationShow({ 
    employee, 
    entries = [], 
    currentMonth = new Date().toISOString().slice(0, 7),
}: ValidationShowProps) {
    // Filtrer les entrées: ne pas afficher les DRAFT (seulement SUBMITTED, APPROVED, REJECTED)
    const filteredEntries = useMemo(() => 
        entries.filter(e => e.status !== 'DRAFT'), 
        [entries]
    );

    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectingEntry, setRejectingEntry] = useState<TimeEntry | null>(null);

    const { data, setData, post, processing } = useForm({
        rejection_reason: '',
    });

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    const [year, month] = currentMonth.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const formatDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const calendarDays = useMemo(() => {
        const days: DayData[] = [];
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        
        let startDay = firstDay.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1;

        const prevMonth = new Date(year, month - 1, 0);
        const prevMonthDays = prevMonth.getDate();
        for (let i = startDay - 1; i >= 0; i--) {
            const day = prevMonthDays - i;
            const date = new Date(year, month - 2, day);
            days.push({
                day,
                date,
                entries: [],
                totalMinutes: 0,
                isCurrentMonth: false,
            });
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = formatDateStr(date);
            const dayEntries = filteredEntries.filter(e => e.work_date === dateStr);
            const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
            
            days.push({
                day,
                date,
                entries: dayEntries,
                totalMinutes,
                isCurrentMonth: true,
            });
        }

        const remainingDays = 42 - days.length;
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month, day);
            days.push({
                day,
                date,
                entries: [],
                totalMinutes: 0,
                isCurrentMonth: false,
            });
        }

        return days;
    }, [year, month, filteredEntries]);

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const handleDayClick = (dayData: DayData) => {
        const dateStr = formatDateStr(dayData.date);
        const dayEntries = filteredEntries.filter(e => e.work_date === dateStr);
        const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
        
        setSelectedDay({
            ...dayData,
            entries: dayEntries,
            totalMinutes,
        });
        setIsDrawerOpen(true);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED': return 'bg-corporate-green';
            case 'SUBMITTED': return 'bg-yellow-500';
            case 'REJECTED': return 'bg-red-500';
            default: return 'bg-gray-400';
        }
    };

    const navigatePrevMonth = () => {
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        router.get(route('validation.show', employee.id), { month: `${prevYear}-${prevMonth.toString().padStart(2, '0')}` });
    };

    const navigateNextMonth = () => {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        router.get(route('validation.show', employee.id), { month: `${nextYear}-${nextMonth.toString().padStart(2, '0')}` });
    };

    const handleApprove = (entry: TimeEntry) => {
        router.post(route('validation.approve', entry.id));
    };

    const handleReject = (entry: TimeEntry) => {
        setRejectingEntry(entry);
        setShowRejectModal(true);
    };

    const submitRejection = () => {
        if (rejectingEntry) {
            post(route('validation.reject', rejectingEntry.id), {
                onSuccess: () => {
                    setShowRejectModal(false);
                    setRejectingEntry(null);
                    setData('rejection_reason', '');
                },
            });
        }
    };

    const handleApproveAll = () => {
        if (!selectedDay) return;
        const idsToApprove = selectedDay.entries
            .filter(e => e.status === 'SUBMITTED')
            .map(e => e.id);
        if (idsToApprove.length > 0) {
            router.post(route('validation.bulk-approve'), { ids: idsToApprove });
        }
    };

    const pendingCount = entries.filter(e => e.status === 'SUBMITTED').length;

    const renderDayCell = (dayData: DayData) => {
        const selected = selectedDay?.date.toDateString() === dayData.date.toDateString() && isDrawerOpen;
        const hasSubmitted = dayData.entries.some(e => e.status === 'SUBMITTED');
        
        return (
            <div
                key={dayData.date.toISOString()}
                onClick={() => handleDayClick(dayData)}
                className={`
                    min-h-[100px] border border-gray-100 p-2 
                    hover:bg-blue-50/50 transition-all cursor-pointer group relative
                    ${!dayData.isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                    ${isToday(dayData.date) ? 'bg-blue-50/30' : ''}
                    ${selected ? 'ring-2 ring-corporate-blue ring-inset bg-blue-50/50' : ''}
                    ${hasSubmitted ? 'border-l-4 border-l-yellow-400' : ''}
                `}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className={`
                        text-sm font-bold 
                        ${isToday(dayData.date) 
                            ? 'bg-corporate-blue text-white w-7 h-7 flex items-center justify-center rounded-full' 
                            : dayData.isCurrentMonth 
                                ? 'text-gray-700' 
                                : 'text-gray-300'
                        }
                    `}>
                        {dayData.day}
                    </span>
                    {dayData.totalMinutes > 0 && (
                        <span className="text-xs font-bold text-corporate-blue bg-blue-50 px-2 py-0.5 rounded">
                            {formatHours(dayData.totalMinutes)}
                        </span>
                    )}
                </div>

                <div className="space-y-1">
                    {dayData.entries.slice(0, 2).map((entry) => (
                        <div 
                            key={entry.id} 
                            className="bg-white border border-gray-100 shadow-sm p-2 rounded-lg text-xs"
                        >
                            <div className="flex items-center gap-1.5 mb-1">
                                <span className={`w-2 h-2 rounded-full ${getStatusColor(entry.status)}`}></span>
                                <span className="font-bold text-gray-700 truncate flex-1">
                                    {entry.subsidiary?.name || 'Filiale'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                                <span className="text-gray-500 font-medium">{formatHours(entry.minutes)}</span>
                                <StatusBadge status={entry.status} size="sm" />
                            </div>
                        </div>
                    ))}
                    {dayData.entries.length > 2 && (
                        <span className="text-[10px] text-gray-400 font-medium block text-center">
                            +{dayData.entries.length - 2} autre(s)
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <AppLayout currentPage="validation" title={`Validation - ${employee.first_name} ${employee.last_name}`}>
            <Head title={`Validation - ${employee.first_name} ${employee.last_name}`} />

            <div className="flex gap-6 h-full">
                {/* Calendar */}
                <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => router.get(route('validation.index'))}
                                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-bold text-gray-600 transition-colors"
                            >
                                ← Retour
                            </button>
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                    onClick={navigatePrevMonth}
                                    className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 font-bold"
                                >
                                    ◀
                                </button>
                                <button 
                                    onClick={navigateNextMonth}
                                    className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 font-bold"
                                >
                                    ▶
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 capitalize">
                                {monthName}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-corporate-blue/10 text-corporate-blue flex items-center justify-center font-bold">
                                    {employee.first_name?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <p className="font-bold text-gray-800">{employee.first_name} {employee.last_name}</p>
                                    <p className="text-xs text-gray-400">{employee.employee_code}</p>
                                </div>
                            </div>
                            {pendingCount > 0 && (
                                <div className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-bold">
                                    {pendingCount} en attente
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Week days header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                        {weekDays.map((d) => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-auto">
                        <div className="grid grid-cols-7">
                            {calendarDays.map((dayData) => renderDayCell(dayData))}
                        </div>
                    </div>
                </div>

                {/* Drawer */}
                {isDrawerOpen && selectedDay && (
                    <div className="w-96 bg-white rounded-2xl shadow-xl border border-gray-100 flex flex-col">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-800 text-lg">
                                    {selectedDay.date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </h4>
                                <p className="text-xs text-gray-500">Validation des entrées</p>
                            </div>
                            <button
                                onClick={() => setIsDrawerOpen(false)}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 p-5 overflow-y-auto">
                            <div className="space-y-4">
                                {selectedDay.entries.length === 0 ? (
                                    <div className="text-center py-12">
                                        <div className="text-4xl mb-3">📝</div>
                                        <p className="text-gray-500 text-sm">Aucune entrée pour ce jour</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-center">
                                            <p className="text-xs font-bold text-gray-400 uppercase">
                                                {selectedDay.entries.length} entrée(s)
                                            </p>
                                            <p className="text-sm font-bold text-corporate-blue">
                                                Total: {formatHours(selectedDay.totalMinutes)}
                                            </p>
                                        </div>
                                        {selectedDay.entries.map((entry) => (
                                            <div key={entry.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <p className="font-bold text-gray-800">{entry.subsidiary?.name}</p>
                                                        <p className="text-sm text-gray-500">{formatHours(entry.minutes)}</p>
                                                    </div>
                                                    <StatusBadge status={entry.status} />
                                                </div>
                                                
                                                {entry.requester && (
                                                    <div className="mt-2 p-2 bg-indigo-50 rounded border border-indigo-100">
                                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Demandeur</p>
                                                        <p className="text-xs text-indigo-700 font-medium">{entry.requester}</p>
                                                    </div>
                                                )}

                                                {entry.note && (
                                                    <div className="mt-2 p-2 bg-white rounded border border-gray-100">
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Description de la tâche</p>
                                                        <p className="text-xs text-gray-600">{entry.note}</p>
                                                    </div>
                                                )}

                                                {entry.status === 'SUBMITTED' && (
                                                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                                                        <button
                                                            onClick={() => handleApprove(entry)}
                                                            className="flex-1 py-2 bg-green-100 text-green-700 rounded-lg text-xs font-bold hover:bg-green-200 transition-colors"
                                                        >
                                                            ✓ Valider
                                                        </button>
                                                        <button
                                                            onClick={() => handleReject(entry)}
                                                            className="flex-1 py-2 bg-red-100 text-red-700 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors"
                                                        >
                                                            ✗ Rejeter
                                                        </button>
                                                    </div>
                                                )}

                                                {entry.status === 'REJECTED' && entry.rejection_reason && (
                                                    <div className="mt-3 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                                                        <strong>Motif:</strong> {entry.rejection_reason}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </>
                                )}
                            </div>
                        </div>

                        {selectedDay.entries.some(e => e.status === 'SUBMITTED') && (
                            <div className="p-5 bg-gray-50 border-t border-gray-100">
                                <AuthButton onClick={handleApproveAll} className="w-full" variant="secondary">
                                    ✓ Valider toutes les entrées du jour
                                </AuthButton>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Reject Modal */}
            {showRejectModal && rejectingEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Rejeter l'entrée</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            {employee.first_name} {employee.last_name} - {formatHours(rejectingEntry.minutes)} le {new Date(rejectingEntry.work_date).toLocaleDateString('fr-FR')}
                        </p>

                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Motif du rejet <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                className="w-full p-3 border border-gray-300 rounded-lg outline-none focus:border-corporate-blue focus:ring-4 focus:ring-blue-50/50 min-h-[100px]"
                                placeholder="Indiquez la raison du rejet..."
                                value={data.rejection_reason}
                                onChange={(e) => setData('rejection_reason', e.target.value)}
                                required
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setRejectingEntry(null);
                                    setData('rejection_reason', '');
                                }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                            >
                                Annuler
                            </button>
                            <AuthButton
                                onClick={submitRejection}
                                disabled={!data.rejection_reason.trim()}
                                isLoading={processing}
                                className="flex-1"
                            >
                                Confirmer le rejet
                            </AuthButton>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
