import { Head, useForm, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import Select from '@/Components/Select';
import StatusBadge from '@/Components/StatusBadge';
import ConfirmModal from '@/Components/ConfirmModal';
import { TimeEntry, Subsidiary, Service } from '@/types';

interface TimesheetProps {
    entries: TimeEntry[];
    subsidiaries: Subsidiary[];
    services: Service[];
    currentMonth: string;
    debug?: {
        employee_id: string;
        entries_count: number;
    };
}

interface DayData {
    day: number;
    date: Date;
    entries: TimeEntry[];
    totalMinutes: number;
    isCurrentMonth: boolean;
}

export default function TimesheetIndex({ 
    entries = [], 
    subsidiaries = [], 
    services = [],
    currentMonth = new Date().toISOString().slice(0, 7),
    debug,
}: TimesheetProps) {
    // Debug: afficher les données reçues dans la console
    console.log('Timesheet props:', { entries, subsidiaries, currentMonth, debug });
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [selectedDay, setSelectedDay] = useState<DayData | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
    const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(today.setDate(diff));
    });

    // States pour les modals de confirmation
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'delete' | 'submit' | null;
        entry: TimeEntry | null;
    }>({ isOpen: false, type: null, entry: null });

    const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
    
    const [year, month] = currentMonth.split('-').map(Number);
    const monthName = new Date(year, month - 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    const { data, setData, post, put, processing, errors, reset } = useForm({
        subsidiary_id: '',
        service_id: '',
        work_date: '',
        hours: 0,
        minutes: 0,
        note: '',
        requester: '',
    });

    // Helper function to format date as YYYY-MM-DD
    const formatDateStr = (d: Date) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    // Generate calendar days for month view
    const calendarDays = useMemo(() => {
        const days: DayData[] = [];
        const firstDay = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0);
        const daysInMonth = lastDay.getDate();
        
        // Get the day of week for the first day (0 = Sunday, 1 = Monday, etc.)
        let startDay = firstDay.getDay();
        // Convert to Monday-based (0 = Monday, 6 = Sunday)
        startDay = startDay === 0 ? 6 : startDay - 1;

        // Add empty days from previous month
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

        // Add days of current month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = formatDateStr(date);
            const dayEntries = entries.filter(e => e.work_date === dateStr);
            const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
            
            days.push({
                day,
                date,
                entries: dayEntries,
                totalMinutes,
                isCurrentMonth: true,
            });
        }

        // Add empty days from next month to complete the grid
        const remainingDays = 42 - days.length; // 6 rows × 7 days
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
    }, [year, month, entries]);

    // Generate week days for week view
    const weekDaysData = useMemo(() => {
        const days: DayData[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(currentWeekStart);
            date.setDate(currentWeekStart.getDate() + i);
            const dateStr = formatDateStr(date);
            const dayEntries = entries.filter(e => e.work_date === dateStr);
            const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
            
            days.push({
                day: date.getDate(),
                date,
                entries: dayEntries,
                totalMinutes,
                isCurrentMonth: date.getMonth() + 1 === month,
            });
        }
        return days;
    }, [currentWeekStart, entries, month]);

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
        // Recalculer les entrées pour ce jour à partir des données fraîches
        const dateStr = formatDateStr(dayData.date);
        const dayEntries = entries.filter(e => e.work_date === dateStr);
        const totalMinutes = dayEntries.reduce((sum, e) => sum + e.minutes, 0);
        
        console.log('Day clicked:', { dateStr, dayEntries, entriesCount: entries.length });
        
        setSelectedDay({
            ...dayData,
            entries: dayEntries,
            totalMinutes,
        });
        setIsDrawerOpen(true);
        setIsEditing(false);
        setEditingEntry(null);
    };

    const handleAddEntry = () => {
        if (!selectedDay) return;
        setIsEditing(true);
        setEditingEntry(null);
        const dateStr = formatDateStr(selectedDay.date);
        setData({
            subsidiary_id: '',
            service_id: '',
            work_date: dateStr,
            hours: 0,
            minutes: 0,
            note: '',
            requester: '',
        });
    };

    const handleEditEntry = (entry: TimeEntry) => {
        setIsEditing(true);
        setEditingEntry(entry);
        setData({
            subsidiary_id: entry.subsidiary_id,
            service_id: entry.service_id || '',
            work_date: entry.work_date,
            hours: Math.floor(entry.minutes / 60),
            minutes: entry.minutes % 60,
            note: entry.note || '',
            requester: entry.requester || '',
        });
    };

    const handleSubmitEntry = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEntry) {
            put(route('timesheet.update', editingEntry.id), {
                onSuccess: () => {
                    setIsEditing(false);
                    setEditingEntry(null);
                    reset();
                },
            });
        } else {
            post(route('timesheet.store'), {
                onSuccess: () => {
                    setIsEditing(false);
                    setIsDrawerOpen(false);
                    reset();
                },
                onError: (errors) => {
                    console.log('Erreurs:', errors);
                },
            });
        }
    };

    const handleDeleteEntry = (entry: TimeEntry) => {
        setConfirmModal({ isOpen: true, type: 'delete', entry });
    };

    const handleSubmitForValidation = (entry: TimeEntry) => {
        setConfirmModal({ isOpen: true, type: 'submit', entry });
    };

    const confirmAction = () => {
        if (!confirmModal.entry) return;
        
        if (confirmModal.type === 'delete') {
            router.delete(route('timesheet.destroy', confirmModal.entry.id));
        } else if (confirmModal.type === 'submit') {
            router.post(route('timesheet.submit'), { ids: [confirmModal.entry.id] });
        }
        
        setConfirmModal({ isOpen: false, type: null, entry: null });
    };

    const closeConfirmModal = () => {
        setConfirmModal({ isOpen: false, type: null, entry: null });
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
        router.get(route('timesheet.index'), { month: `${prevYear}-${prevMonth.toString().padStart(2, '0')}` });
    };

    const navigateNextMonth = () => {
        const nextMonth = month === 12 ? 1 : month + 1;
        const nextYear = month === 12 ? year + 1 : year;
        router.get(route('timesheet.index'), { month: `${nextYear}-${nextMonth.toString().padStart(2, '0')}` });
    };

    const navigatePrevWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() - 7);
        setCurrentWeekStart(newStart);
    };

    const navigateNextWeek = () => {
        const newStart = new Date(currentWeekStart);
        newStart.setDate(newStart.getDate() + 7);
        setCurrentWeekStart(newStart);
    };

    const getWeekRangeText = () => {
        const endDate = new Date(currentWeekStart);
        endDate.setDate(endDate.getDate() + 6);
        return `${currentWeekStart.getDate()} - ${endDate.getDate()} ${endDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
    };

    const subsidiaryOptions = subsidiaries.map(s => ({ value: s.id, label: s.name }));
    const serviceOptions = [
        { value: '', label: 'Aucun service' },
        ...services.map(s => ({ value: s.id, label: s.name }))
    ];

    const renderDayCell = (dayData: DayData, isWeekView: boolean = false) => {
        const selected = selectedDay?.date.toDateString() === dayData.date.toDateString() && isDrawerOpen;
        
        return (
            <div
                key={dayData.date.toISOString()}
                onClick={() => handleDayClick(dayData)}
                className={`
                    ${isWeekView ? 'min-h-[300px]' : 'min-h-[100px]'} 
                    border border-gray-100 p-2 
                    hover:bg-blue-50/50 transition-all cursor-pointer group relative
                    ${!dayData.isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}
                    ${isToday(dayData.date) ? 'bg-blue-50/30' : ''}
                    ${selected ? 'ring-2 ring-corporate-blue ring-inset bg-blue-50/50' : ''}
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
                    {dayData.entries.slice(0, isWeekView ? 5 : 2).map((entry) => (
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
                    {dayData.entries.length > (isWeekView ? 5 : 2) && (
                        <span className="text-[10px] text-gray-400 font-medium block text-center">
                            +{dayData.entries.length - (isWeekView ? 5 : 2)} autre(s)
                        </span>
                    )}
                </div>

                <button 
                    className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 bg-corporate-blue text-white rounded-full flex items-center justify-center text-sm shadow-lg hover:bg-corporate-blue-dark"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDayClick(dayData);
                        setTimeout(() => handleAddEntry(), 100);
                    }}
                >
                    +
                </button>
            </div>
        );
    };

    return (
        <AppLayout currentPage="timesheet" title="Mes Heures">
            <Head title="Timesheet" />

            <div className="flex gap-6 h-full">
                {/* Calendar */}
                <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col transition-all duration-300`}>
                    {/* Header */}
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-4">
                            <div className="flex bg-gray-100 rounded-lg p-1">
                                <button 
                                    onClick={viewMode === 'month' ? navigatePrevMonth : navigatePrevWeek}
                                    className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 font-bold"
                                >
                                    ◀
                                </button>
                                <button 
                                    onClick={viewMode === 'month' ? navigateNextMonth : navigateNextWeek}
                                    className="px-3 py-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all text-gray-600 font-bold"
                                >
                                    ▶
                                </button>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 capitalize">
                                {viewMode === 'month' ? monthName : getWeekRangeText()}
                            </h3>
                        </div>
                        
                        <div className="flex items-center gap-3">
                            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                                <button 
                                    onClick={() => setViewMode('month')}
                                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                                        viewMode === 'month' 
                                            ? 'bg-corporate-blue text-white' 
                                            : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Mois
                                </button>
                                <button 
                                    onClick={() => setViewMode('week')}
                                    className={`px-4 py-2 text-sm font-bold transition-colors ${
                                        viewMode === 'week' 
                                            ? 'bg-corporate-blue text-white' 
                                            : 'text-gray-400 hover:bg-gray-50'
                                    }`}
                                >
                                    Semaine
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Week days header */}
                    <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
                        {weekDays.map((d, i) => (
                            <div key={d} className="py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wide">
                                {viewMode === 'week' && weekDaysData[i] ? (
                                    <div>
                                        <div>{d}</div>
                                        <div className={`text-lg mt-1 ${isToday(weekDaysData[i].date) ? 'text-corporate-blue' : 'text-gray-700'}`}>
                                            {weekDaysData[i].day}
                                        </div>
                                    </div>
                                ) : d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar grid */}
                    <div className="flex-1 overflow-auto">
                        {viewMode === 'month' ? (
                            <div className="grid grid-cols-7">
                                {calendarDays.map((dayData) => renderDayCell(dayData, false))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-7 h-full">
                                {weekDaysData.map((dayData) => renderDayCell(dayData, true))}
                            </div>
                        )}
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
                                <p className="text-xs text-gray-500">
                                    {isEditing ? (editingEntry ? 'Modifier l\'entrée' : 'Nouvelle entrée') : 'Saisie des heures'}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setIsDrawerOpen(false);
                                    setIsEditing(false);
                                    setEditingEntry(null);
                                }}
                                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        <div className="flex-1 p-5 overflow-y-auto">
                            {isEditing ? (
                                <form id="entry-form" onSubmit={handleSubmitEntry} className="space-y-4">
                                    {/* Affichage des erreurs globales */}
                                    {(errors as any).error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                                            {(errors as any).error}
                                        </div>
                                    )}
                                    
                                    {subsidiaryOptions.length === 0 && (
                                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                                            Aucune filiale disponible. Contactez un administrateur.
                                        </div>
                                    )}

                                    <Select
                                        label="Filiale"
                                        options={subsidiaryOptions}
                                        value={data.subsidiary_id}
                                        onChange={(value) => setData('subsidiary_id', value)}
                                        error={errors.subsidiary_id}
                                        placeholder="Sélectionner une filiale..."
                                    />

                                    <Select
                                        label="Service (optionnel)"
                                        options={serviceOptions}
                                        value={data.service_id}
                                        onChange={(value) => setData('service_id', value)}
                                        error={errors.service_id}
                                    />

                                    <div className="grid grid-cols-2 gap-4">
                                        <AuthInput
                                            label="Heures"
                                            type="number"
                                            min={0}
                                            max={24}
                                            value={data.hours}
                                            onChange={(e) => setData('hours', parseInt(e.target.value) || 0)}
                                            error={errors.hours}
                                        />
                                        <AuthInput
                                            label="Minutes"
                                            type="number"
                                            min={0}
                                            max={59}
                                            step={15}
                                            value={data.minutes}
                                            onChange={(e) => setData('minutes', parseInt(e.target.value) || 0)}
                                            error={errors.minutes}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Demandeur (optionnel)</label>
                                        <input
                                            type="text"
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-corporate-blue focus:ring-4 focus:ring-blue-50/50"
                                            placeholder="Nom de la personne ayant demandé la tâche..."
                                            value={data.requester}
                                            onChange={(e) => setData('requester', e.target.value)}
                                        />
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-sm font-semibold text-gray-700">Description de la tâche (optionnel)</label>
                                        <textarea
                                            className="w-full p-3 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-corporate-blue focus:ring-4 focus:ring-blue-50/50 min-h-[80px] resize-none"
                                            placeholder="Décrivez vos tâches..."
                                            value={data.note}
                                            onChange={(e) => setData('note', e.target.value)}
                                        />
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-4">
                                    {selectedDay.entries.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="text-4xl mb-3">📝</div>
                                            <p className="text-gray-500 text-sm">Aucune entrée pour ce jour</p>
                                            <p className="text-gray-400 text-xs mt-1">Cliquez sur le bouton pour ajouter</p>
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
                                                            {entry.service && (
                                                                <p className="text-xs text-purple-600 font-medium">{entry.service.name}</p>
                                                            )}
                                                            <p className="text-sm text-gray-500">{formatHours(entry.minutes)}</p>
                                                        </div>
                                                        <StatusBadge status={entry.status} />
                                                    </div>
                                                    
                                                    {entry.requester && (
                                                        <p className="text-xs text-blue-600 mt-1">
                                                            <span className="font-medium">Demandeur:</span> {entry.requester}
                                                        </p>
                                                    )}

                                                    {entry.note && (
                                                        <p className="text-xs text-gray-500 mt-2 italic bg-white p-2 rounded">
                                                            {entry.note}
                                                        </p>
                                                    )}

                                                    {entry.status === 'DRAFT' && (
                                                        <button
                                                            onClick={() => handleSubmitForValidation(entry)}
                                                            className="w-full mt-3 py-2 bg-corporate-green/10 text-corporate-green rounded-lg text-xs font-bold hover:bg-corporate-green/20 transition-colors"
                                                        >
                                                            📤 Soumettre pour validation
                                                        </button>
                                                    )}

                                                    {(entry.status === 'DRAFT' || entry.status === 'REJECTED') && (
                                                        <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                                                            <button
                                                                onClick={() => handleEditEntry(entry)}
                                                                className="text-xs font-bold text-corporate-blue hover:underline"
                                                            >
                                                                ✏️ Modifier
                                                            </button>
                                                            {entry.status === 'DRAFT' && (
                                                                <button 
                                                                    onClick={() => handleDeleteEntry(entry)}
                                                                    className="text-xs font-bold text-red-500 hover:underline"
                                                                >
                                                                    🗑️ Supprimer
                                                                </button>
                                                            )}
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
                            )}
                        </div>

                        <div className="p-5 bg-gray-50 border-t border-gray-100">
                            {isEditing ? (
                                <div className="space-y-2">
                                    <AuthButton 
                                        type="submit" 
                                        form="entry-form" 
                                        className="w-full" 
                                        isLoading={processing}
                                    >
                                        {editingEntry ? '✓ Mettre à jour' : '✓ Enregistrer'}
                                    </AuthButton>
                                    <button
                                        onClick={() => {
                                            setIsEditing(false);
                                            setEditingEntry(null);
                                            reset();
                                        }}
                                        className="w-full py-2 text-sm font-bold text-gray-400 hover:text-gray-600"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            ) : (
                                <AuthButton onClick={handleAddEntry} className="w-full">
                                    + Ajouter une entrée
                                </AuthButton>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={closeConfirmModal}
                onConfirm={confirmAction}
                title={confirmModal.type === 'delete' ? 'Supprimer l\'entrée' : 'Soumettre pour validation'}
                message={
                    confirmModal.type === 'delete' 
                        ? 'Êtes-vous sûr de vouloir supprimer cette entrée ? Cette action est irréversible.'
                        : 'Voulez-vous soumettre cette entrée pour validation ? Elle sera envoyée à votre manager pour approbation.'
                }
                confirmText={confirmModal.type === 'delete' ? 'Supprimer' : 'Soumettre'}
                variant={confirmModal.type === 'delete' ? 'danger' : 'success'}
            />
        </AppLayout>
    );
}
