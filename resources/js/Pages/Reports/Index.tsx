import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import { Employee, Subsidiary } from '@/types';

interface ReportEntry {
    id: string;
    employee: Employee;
    subsidiary: Subsidiary;
    total_minutes: number;
    approved_minutes: number;
    pending_minutes: number;
    period: string;
}

interface ServiceDetail {
    service_id: string | null;
    service_name: string;
    total_hours: number;
    approved_hours: number;
    submitted_hours: number;
    draft_hours: number;
}

interface ChartDataItem {
    subsidiary_id: string;
    subsidiary_name: string;
    total_hours: number;
    approved_hours: number;
    submitted_hours: number;
    draft_hours: number;
    services?: ServiceDetail[];
}

interface ServiceChartDataItem {
    service_id: string;
    service_name: string;
    total_hours: number;
    approved_hours: number;
    submitted_hours: number;
    draft_hours: number;
}

interface EmployeeSubsidiaryDetail {
    subsidiary_id: string;
    subsidiary_name: string;
    total_hours: number;
    approved_hours: number;
    submitted_hours: number;
    draft_hours: number;
    services: ServiceDetail[];
}

interface EmployeeWithHours {
    id: string;
    full_name: string;
    employee_code: string;
    subsidiary_name: string;
    services_names: string;
    total_hours: number;
    approved_hours: number;
    subsidiaries: EmployeeSubsidiaryDetail[];
}

interface ReportsProps {
    data: ReportEntry[];
    subsidiaries: Subsidiary[];
    employees: Employee[];
    filters: {
        subsidiary_id?: string;
        employee_id?: string;
        start_date?: string;
        end_date?: string;
    };
    totals: {
        total_minutes: number;
        approved_minutes: number;
    };
    chartData?: ChartDataItem[];
    serviceChartData?: ServiceChartDataItem[];
    myChartData?: ChartDataItem[];
    myServiceChartData?: ServiceChartDataItem[];
    myTotals?: {
        total_minutes: number;
        approved_minutes: number;
    };
    employeesWithHours?: EmployeeWithHours[];
    isEmployee?: boolean;
    isManager?: boolean;
    isAdmin?: boolean;
}

export default function ReportsIndex({ 
    data = [], 
    subsidiaries = [], 
    employees = [],
    filters = {},
    totals = { total_minutes: 0, approved_minutes: 0 },
    chartData = [],
    serviceChartData = [],
    myChartData = [],
    myServiceChartData = [],
    myTotals = { total_minutes: 0, approved_minutes: 0 },
    employeesWithHours = [],
    isEmployee = false,
    isManager = false,
    isAdmin = false,
}: ReportsProps) {
    const [localFilters, setLocalFilters] = useState(filters);
    const [selectedSubsidiary, setSelectedSubsidiary] = useState<ChartDataItem | null>(null);
    const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithHours | null>(null);
    const [selectedEmpSubsidiary, setSelectedEmpSubsidiary] = useState<EmployeeSubsidiaryDetail | null>(null);
    const [selectedMySubsidiary, setSelectedMySubsidiary] = useState<ChartDataItem | null>(null);
    const [employeeSearch, setEmployeeSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Filtrer et paginer les employés
    const filteredEmployees = useMemo(() => {
        if (!employeeSearch.trim()) return employeesWithHours;
        const search = employeeSearch.toLowerCase();
        return employeesWithHours.filter(emp => 
            emp.full_name.toLowerCase().includes(search) ||
            emp.employee_code.toLowerCase().includes(search) ||
            emp.subsidiary_name.toLowerCase().includes(search) ||
            emp.services_names.toLowerCase().includes(search)
        );
    }, [employeesWithHours, employeeSearch]);

    const totalPages = Math.ceil(filteredEmployees.length / itemsPerPage);
    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * itemsPerPage;
        return filteredEmployees.slice(start, start + itemsPerPage);
    }, [filteredEmployees, currentPage]);

    // Calcul de la valeur max pour l'échelle du graphique par filiale
    const maxHours = useMemo(() => {
        if (chartData.length === 0) return 10;
        return Math.max(...chartData.map(d => d.total_hours), 1);
    }, [chartData]);

    // Calcul de la valeur max pour mes heures personnelles
    const myMaxHours = useMemo(() => {
        if (myChartData.length === 0) return 10;
        return Math.max(...myChartData.map(d => d.total_hours), 1);
    }, [myChartData]);

    const myMaxServiceHours = useMemo(() => {
        if (myServiceChartData.length === 0) return 10;
        return Math.max(...myServiceChartData.map(d => d.total_hours), 1);
    }, [myServiceChartData]);

    // Calcul de la valeur max pour l'échelle du graphique par service
    const maxServiceHours = useMemo(() => {
        if (serviceChartData.length === 0) return 10;
        return Math.max(...serviceChartData.map(d => d.total_hours), 1);
    }, [serviceChartData]);

    const formatHours = (mins: number) => {
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h${m.toString().padStart(2, '0')}` : `${h}h`;
    };

    const handleFilter = () => {
        router.get(route('reports.index'), localFilters);
    };

    // Vue pour les employés avec histogramme
    if (isEmployee) {
        return (
            <AppLayout currentPage="reports" title="Mes Rapports">
                <Head title="Mes Rapports" />

                <div className="space-y-6">
                    {/* Filtres de date */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-4">Période</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <AuthInput
                                label="Date début"
                                type="date"
                                value={localFilters.start_date || ''}
                                onChange={(e) => setLocalFilters({ ...localFilters, start_date: e.target.value || undefined })}
                            />
                            <AuthInput
                                label="Date fin"
                                type="date"
                                value={localFilters.end_date || ''}
                                onChange={(e) => setLocalFilters({ ...localFilters, end_date: e.target.value || undefined })}
                            />
                            <div className="flex items-end">
                                <AuthButton onClick={handleFilter} className="w-full">
                                    Appliquer
                                </AuthButton>
                            </div>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-corporate-blue">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Heures</p>
                            <span className="text-3xl font-extrabold text-gray-900">{formatHours(totals.total_minutes)}</span>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-l-corporate-green">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Heures Validées</p>
                            <span className="text-3xl font-extrabold text-gray-900">{formatHours(totals.approved_minutes)}</span>
                        </div>
                    </div>

                    {/* Histogramme des heures par filiale */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="font-bold text-gray-800 mb-6">Heures par filiale</h3>
                        <p className="text-sm text-gray-500 mb-4">Cliquez sur une filiale pour voir le détail par service</p>
                        
                        {chartData.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-5xl mb-4">📊</div>
                                <p className="text-gray-500">Aucune donnée pour cette période</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Légende */}
                                <div className="flex flex-wrap gap-4 mb-6 justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-corporate-green"></div>
                                        <span className="text-sm text-gray-600">Validées</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-yellow-400"></div>
                                        <span className="text-sm text-gray-600">Soumises</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 rounded bg-gray-300"></div>
                                        <span className="text-sm text-gray-600">Brouillon</span>
                                    </div>
                                </div>

                                {/* Barres */}
                                <div className="space-y-4">
                                    {chartData.map((item) => (
                                        <div 
                                            key={item.subsidiary_id} 
                                            className={`group cursor-pointer p-3 rounded-lg transition-all ${
                                                selectedSubsidiary?.subsidiary_id === item.subsidiary_id 
                                                    ? 'bg-blue-50 ring-2 ring-corporate-blue' 
                                                    : 'hover:bg-gray-50'
                                            }`}
                                            onClick={() => setSelectedSubsidiary(
                                                selectedSubsidiary?.subsidiary_id === item.subsidiary_id ? null : item
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-bold text-gray-800 flex items-center gap-2">
                                                    {item.subsidiary_name}
                                                    <span className="text-xs text-gray-400">
                                                        {selectedSubsidiary?.subsidiary_id === item.subsidiary_id ? '▼' : '▶'}
                                                    </span>
                                                </span>
                                                <span className="text-sm font-bold text-corporate-blue">
                                                    {item.total_hours.toFixed(1)}h
                                                </span>
                                            </div>
                                            <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                                                <div 
                                                    className="absolute inset-y-0 left-0 flex"
                                                    style={{ width: `${(item.total_hours / maxHours) * 100}%` }}
                                                >
                                                    {item.approved_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-corporate-green transition-all duration-500"
                                                            style={{ width: `${(item.approved_hours / item.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                    {item.submitted_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-yellow-400 transition-all duration-500"
                                                            style={{ width: `${(item.submitted_hours / item.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                    {item.draft_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-gray-300 transition-all duration-500"
                                                            style={{ width: `${(item.draft_hours / item.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex gap-4 mt-1 text-xs text-gray-500">
                                                {item.approved_hours > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-corporate-green"></span>
                                                        {item.approved_hours.toFixed(1)}h validées
                                                    </span>
                                                )}
                                                {item.submitted_hours > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                        {item.submitted_hours.toFixed(1)}h soumises
                                                    </span>
                                                )}
                                                {item.draft_hours > 0 && (
                                                    <span className="flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                                                        {item.draft_hours.toFixed(1)}h brouillon
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Détail par service pour la filiale sélectionnée */}
                    {selectedSubsidiary && (
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-corporate-blue">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-bold text-gray-800">
                                    🏷️ Détail par service - {selectedSubsidiary.subsidiary_name}
                                </h3>
                                <button 
                                    onClick={() => setSelectedSubsidiary(null)}
                                    className="text-gray-400 hover:text-gray-600 text-xl"
                                >
                                    ✕
                                </button>
                            </div>
                            
                            {(!selectedSubsidiary.services || selectedSubsidiary.services.length === 0) ? (
                                <p className="text-gray-500 text-center py-4">Aucun service associé</p>
                            ) : (
                                <div className="space-y-3">
                                    {selectedSubsidiary.services.map((service, index) => {
                                        const serviceMaxHours = Math.max(
                                            ...selectedSubsidiary.services!.map(s => s.total_hours), 
                                            1
                                        );
                                        return (
                                            <div key={service.service_id || index} className="bg-gray-50 p-3 rounded-lg">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-700">{service.service_name}</span>
                                                    <span className="text-sm font-bold text-purple-600">
                                                        {service.total_hours.toFixed(1)}h
                                                    </span>
                                                </div>
                                                <div className="relative h-6 bg-gray-200 rounded overflow-hidden">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 flex"
                                                        style={{ width: `${(service.total_hours / serviceMaxHours) * 100}%` }}
                                                    >
                                                        {service.approved_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-corporate-green"
                                                                style={{ width: `${(service.approved_hours / service.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                        {service.submitted_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-yellow-400"
                                                                style={{ width: `${(service.submitted_hours / service.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                        {service.draft_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-gray-300"
                                                                style={{ width: `${(service.draft_hours / service.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="flex gap-3 mt-1 text-xs text-gray-500">
                                                    {service.approved_hours > 0 && (
                                                        <span>{service.approved_hours.toFixed(1)}h validées</span>
                                                    )}
                                                    {service.submitted_hours > 0 && (
                                                        <span>{service.submitted_hours.toFixed(1)}h soumises</span>
                                                    )}
                                                    {service.draft_hours > 0 && (
                                                        <span>{service.draft_hours.toFixed(1)}h brouillon</span>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    // Vue pour les managers/admins
    return (
        <AppLayout currentPage="reports" title="Rapports">
            <Head title="Rapports" />

            <div className="space-y-6">
                {/* Header avec badge rôle */}
                {isAdmin && (
                    <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                        <span className="text-lg">🛡️</span>
                        <div>
                            <p className="font-bold text-sm">Vue Administrateur</p>
                            <p className="text-xs opacity-90">Accès complet à toutes les données de l'entreprise</p>
                        </div>
                        <div className="ml-auto flex gap-4 text-xs">
                            <span className="bg-white/20 px-2 py-1 rounded">{employeesWithHours.length} employés</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{chartData.length} filiales</span>
                        </div>
                    </div>
                )}

                {isManager && !isAdmin && (
                    <div className="bg-gradient-to-r from-corporate-blue to-blue-600 text-white px-4 py-2 rounded-xl shadow-sm flex items-center gap-3">
                        <span className="text-lg">👔</span>
                        <div>
                            <p className="font-bold text-sm">Vue Manager</p>
                            <p className="text-xs opacity-90">Données de vos services et employés gérés</p>
                        </div>
                        <div className="ml-auto flex gap-4 text-xs">
                            <span className="bg-white/20 px-2 py-1 rounded">{employeesWithHours.length} employés</span>
                            <span className="bg-white/20 px-2 py-1 rounded">{chartData.length} filiales</span>
                        </div>
                    </div>
                )}

                {/* Summary Cards - Global */}
                <div className={`grid grid-cols-1 ${isAdmin ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4`}>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-corporate-blue">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Heures</p>
                        <span className="text-2xl font-extrabold text-gray-900">{formatHours(totals.total_minutes)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-corporate-green">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Heures Validées</p>
                        <span className="text-2xl font-extrabold text-gray-900">{formatHours(totals.approved_minutes)}</span>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-yellow-400">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">En Attente</p>
                        <span className="text-2xl font-extrabold text-gray-900">
                            {formatHours(totals.total_minutes - totals.approved_minutes)}
                        </span>
                    </div>
                    {isAdmin && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-l-purple-500">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Taux Validation</p>
                            <span className="text-2xl font-extrabold text-gray-900">
                                {totals.total_minutes > 0 
                                    ? Math.round((totals.approved_minutes / totals.total_minutes) * 100) 
                                    : 0}%
                            </span>
                        </div>
                    )}
                </div>

                {/* Filtres de période - Compact */}
                <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="text-sm font-medium text-gray-600">📅 Période :</span>
                        <input
                            type="date"
                            value={localFilters.start_date || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, start_date: e.target.value || undefined })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-blue/50"
                        />
                        <span className="text-gray-400">→</span>
                        <input
                            type="date"
                            value={localFilters.end_date || ''}
                            onChange={(e) => setLocalFilters({ ...localFilters, end_date: e.target.value || undefined })}
                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-blue/50"
                        />
                        <button 
                            onClick={handleFilter}
                            className="px-4 py-1.5 bg-corporate-blue text-white text-sm font-medium rounded-lg hover:bg-corporate-blue/90 transition-colors"
                        >
                            Filtrer
                        </button>
                    </div>
                </div>

                {/* Mes heures personnelles - Version miniaturisée avec clic */}
                {(myChartData.length > 0) && (
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-bold text-gray-800 flex items-center gap-2 text-sm">
                                👤 Mes heures personnelles
                            </h3>
                            <div className="flex gap-4 text-xs">
                                <span className="font-bold text-indigo-600">Total: {formatHours(myTotals.total_minutes)}</span>
                                <span className="font-bold text-green-600">Validées: {formatHours(myTotals.approved_minutes)}</span>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-2">Cliquez sur une filiale pour voir le détail par service</p>
                            
                            {/* Légende miniature */}
                            <div className="flex gap-3 mb-2 text-xs">
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-corporate-green"></span> Validées</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-yellow-400"></span> Soumises</span>
                                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-gray-300"></span> Brouillon</span>
                            </div>
                            
                            {/* Barres par filiale cliquables */}
                            <div className="space-y-2">
                                {myChartData.map((item) => (
                                    <div 
                                        key={item.subsidiary_id}
                                        className={`cursor-pointer p-2 rounded transition-all ${
                                            selectedMySubsidiary?.subsidiary_id === item.subsidiary_id 
                                                ? 'bg-indigo-50 ring-1 ring-indigo-300' 
                                                : 'hover:bg-gray-50'
                                        }`}
                                        onClick={() => setSelectedMySubsidiary(
                                            selectedMySubsidiary?.subsidiary_id === item.subsidiary_id ? null : item
                                        )}
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                                {item.subsidiary_name}
                                                <span className="text-gray-400 text-[10px]">
                                                    {selectedMySubsidiary?.subsidiary_id === item.subsidiary_id ? '▼' : '▶'}
                                                </span>
                                            </span>
                                            <span className="text-xs font-bold text-indigo-600">{item.total_hours.toFixed(1)}h</span>
                                        </div>
                                        <div className="relative h-5 bg-gray-100 rounded overflow-hidden">
                                            <div 
                                                className="absolute inset-y-0 left-0 flex"
                                                style={{ width: `${(item.total_hours / myMaxHours) * 100}%` }}
                                            >
                                                {item.approved_hours > 0 && (
                                                    <div 
                                                        className="h-full bg-corporate-green"
                                                        style={{ width: `${(item.approved_hours / item.total_hours) * 100}%` }}
                                                    />
                                                )}
                                                {item.submitted_hours > 0 && (
                                                    <div 
                                                        className="h-full bg-yellow-400"
                                                        style={{ width: `${(item.submitted_hours / item.total_hours) * 100}%` }}
                                                    />
                                                )}
                                                {item.draft_hours > 0 && (
                                                    <div 
                                                        className="h-full bg-gray-300"
                                                        style={{ width: `${(item.draft_hours / item.total_hours) * 100}%` }}
                                                    />
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-1 text-[10px] text-gray-500">
                                            {item.approved_hours > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-corporate-green"></span>
                                                    {item.approved_hours.toFixed(1)}h
                                                </span>
                                            )}
                                            {item.submitted_hours > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400"></span>
                                                    {item.submitted_hours.toFixed(1)}h
                                                </span>
                                            )}
                                            {item.draft_hours > 0 && (
                                                <span className="flex items-center gap-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                                                    {item.draft_hours.toFixed(1)}h
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Détail par service si filiale sélectionnée */}
                            {selectedMySubsidiary && selectedMySubsidiary.services && selectedMySubsidiary.services.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-indigo-100">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="text-xs font-bold text-gray-700">
                                            🏷️ Services - {selectedMySubsidiary.subsidiary_name}
                                        </h4>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setSelectedMySubsidiary(null); }}
                                            className="text-gray-400 hover:text-gray-600 text-sm"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {selectedMySubsidiary.services.map((service, idx) => {
                                            const srvMax = Math.max(...selectedMySubsidiary.services!.map(s => s.total_hours), 1);
                                            return (
                                                <div key={service.service_id || idx} className="bg-purple-50 p-2 rounded">
                                                    <div className="flex justify-between text-xs mb-1">
                                                        <span className="text-gray-600 truncate">{service.service_name}</span>
                                                        <span className="font-bold text-purple-600">{service.total_hours.toFixed(1)}h</span>
                                                    </div>
                                                    <div className="relative h-3 bg-gray-100 rounded overflow-hidden">
                                                        <div 
                                                            className="absolute inset-y-0 left-0 flex"
                                                            style={{ width: `${(service.total_hours / srvMax) * 100}%` }}
                                                        >
                                                            {service.approved_hours > 0 && (
                                                                <div 
                                                                    className="h-full bg-corporate-green"
                                                                    style={{ width: `${(service.approved_hours / service.total_hours) * 100}%` }}
                                                                />
                                                            )}
                                                            {service.submitted_hours > 0 && (
                                                                <div 
                                                                    className="h-full bg-yellow-400"
                                                                    style={{ width: `${(service.submitted_hours / service.total_hours) * 100}%` }}
                                                                />
                                                            )}
                                                            {service.draft_hours > 0 && (
                                                                <div 
                                                                    className="h-full bg-gray-300"
                                                                    style={{ width: `${(service.draft_hours / service.total_hours) * 100}%` }}
                                                                />
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* 1. Heures globales par filiale avec détail par services */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h3 className="font-bold text-gray-800 mb-2">📊 Heures globales par filiale</h3>
                    <p className="text-sm text-gray-500 mb-4">Cliquez sur une filiale pour voir le détail par service</p>
                    
                    {chartData.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucune donnée</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {chartData.map((item) => (
                                <div 
                                    key={item.subsidiary_id}
                                    className={`cursor-pointer p-3 rounded-lg transition-all ${
                                        selectedSubsidiary?.subsidiary_id === item.subsidiary_id 
                                            ? 'bg-blue-50 ring-2 ring-corporate-blue' 
                                            : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => setSelectedSubsidiary(
                                        selectedSubsidiary?.subsidiary_id === item.subsidiary_id ? null : item
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                            {item.subsidiary_name}
                                            <span className="text-xs text-gray-400">
                                                {selectedSubsidiary?.subsidiary_id === item.subsidiary_id ? '▼' : '▶'}
                                            </span>
                                        </span>
                                        <span className="text-sm font-bold text-corporate-blue">{item.total_hours.toFixed(1)}h</span>
                                    </div>
                                    <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                                        <div 
                                            className="absolute inset-y-0 left-0 flex"
                                            style={{ width: `${(item.total_hours / maxHours) * 100}%` }}
                                        >
                                            {item.approved_hours > 0 && (
                                                <div 
                                                    className="h-full bg-corporate-green"
                                                    style={{ width: `${(item.approved_hours / item.total_hours) * 100}%` }}
                                                />
                                            )}
                                            {item.submitted_hours > 0 && (
                                                <div 
                                                    className="h-full bg-yellow-400"
                                                    style={{ width: `${(item.submitted_hours / item.total_hours) * 100}%` }}
                                                />
                                            )}
                                            {item.draft_hours > 0 && (
                                                <div 
                                                    className="h-full bg-gray-300"
                                                    style={{ width: `${(item.draft_hours / item.total_hours) * 100}%` }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <div className="flex gap-4 mt-4 pt-4 border-t border-gray-100 text-xs">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-corporate-green"></span> Validées</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-400"></span> Soumises</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-gray-300"></span> Brouillon</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Détail par service pour la filiale sélectionnée */}
                {selectedSubsidiary && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-corporate-blue">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">
                                🏷️ Détail par service - {selectedSubsidiary.subsidiary_name}
                            </h3>
                            <button 
                                onClick={() => setSelectedSubsidiary(null)}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {(!selectedSubsidiary.services || selectedSubsidiary.services.length === 0) ? (
                            <p className="text-gray-500 text-center py-4">Aucun service associé</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {selectedSubsidiary.services.map((service, index) => {
                                    const serviceMaxHours = Math.max(
                                        ...selectedSubsidiary.services!.map(s => s.total_hours), 
                                        1
                                    );
                                    return (
                                        <div key={service.service_id || index} className="bg-gray-50 p-3 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="font-medium text-gray-700 text-sm">{service.service_name}</span>
                                                <span className="text-sm font-bold text-purple-600">
                                                    {service.total_hours.toFixed(1)}h
                                                </span>
                                            </div>
                                            <div className="relative h-4 bg-gray-200 rounded overflow-hidden">
                                                <div 
                                                    className="absolute inset-y-0 left-0 flex"
                                                    style={{ width: `${(service.total_hours / serviceMaxHours) * 100}%` }}
                                                >
                                                    {service.approved_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-corporate-green"
                                                            style={{ width: `${(service.approved_hours / service.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                    {service.submitted_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-yellow-400"
                                                            style={{ width: `${(service.submitted_hours / service.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                    {service.draft_hours > 0 && (
                                                        <div 
                                                            className="h-full bg-gray-300"
                                                            style={{ width: `${(service.draft_hours / service.total_hours) * 100}%` }}
                                                        />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Liste des employés gérés */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                        <div>
                            <h3 className="font-bold text-gray-800">👥 Employés de mes services</h3>
                            <p className="text-sm text-gray-500">Cliquez sur un employé pour voir le détail de ses heures</p>
                        </div>
                        
                        {/* Barre de recherche */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher un employé..."
                                value={employeeSearch}
                                onChange={(e) => { setEmployeeSearch(e.target.value); setCurrentPage(1); }}
                                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-corporate-blue/50 focus:border-corporate-blue w-full md:w-64"
                            />
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                        </div>
                    </div>
                    
                    {employeesWithHours.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucun employé</p>
                        </div>
                    ) : filteredEmployees.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-500">Aucun résultat pour "{employeeSearch}"</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Employé</th>
                                            <th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Filiale & Service</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Total</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">Validées</th>
                                            <th className="text-right py-3 px-4 text-xs font-bold text-gray-500 uppercase">En attente</th>
                                            <th className="text-center py-3 px-4 text-xs font-bold text-gray-500 uppercase">Détail</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedEmployees.map((emp) => (
                                            <tr 
                                                key={emp.id} 
                                                className={`border-b border-gray-100 cursor-pointer transition-colors ${
                                                    selectedEmployee?.id === emp.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                }`}
                                                onClick={() => {
                                                    setSelectedEmployee(selectedEmployee?.id === emp.id ? null : emp);
                                                    setSelectedEmpSubsidiary(null);
                                                }}
                                            >
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-corporate-blue/10 text-corporate-blue flex items-center justify-center font-bold text-xs">
                                                            {emp.full_name.charAt(0).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-800">{emp.full_name}</p>
                                                            <p className="text-xs text-gray-400">{emp.employee_code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <p className="font-medium text-gray-700 text-sm">{emp.subsidiary_name}</p>
                                                        <p className="text-xs text-gray-400 truncate max-w-[200px]" title={emp.services_names}>
                                                            {emp.services_names}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-right font-bold text-gray-800">{emp.total_hours.toFixed(1)}h</td>
                                                <td className="py-3 px-4 text-right font-bold text-green-600">{emp.approved_hours.toFixed(1)}h</td>
                                                <td className="py-3 px-4 text-right font-bold text-yellow-600">
                                                    {(emp.total_hours - emp.approved_hours).toFixed(1)}h
                                                </td>
                                                <td className="py-3 px-4 text-center">
                                                    <span className="text-gray-400">
                                                        {selectedEmployee?.id === emp.id ? '▼' : '▶'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-sm text-gray-500">
                                        {filteredEmployees.length} employé{filteredEmployees.length > 1 ? 's' : ''} • Page {currentPage} sur {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                            disabled={currentPage === 1}
                                            className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            ← Précédent
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                            disabled={currentPage === totalPages}
                                            className="px-3 py-1 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            Suivant →
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Détail des heures de l'employé sélectionné */}
                {selectedEmployee && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 border-l-4 border-l-purple-500">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800">
                                📋 Détail des heures - {selectedEmployee.full_name}
                            </h3>
                            <button 
                                onClick={() => { setSelectedEmployee(null); setSelectedEmpSubsidiary(null); }}
                                className="text-gray-400 hover:text-gray-600 text-xl"
                            >
                                ✕
                            </button>
                        </div>
                        
                        {selectedEmployee.subsidiaries.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Aucune heure enregistrée</p>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-gray-500">Cliquez sur une filiale pour voir le détail par service</p>
                                
                                {/* Heures par filiale */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {selectedEmployee.subsidiaries.map((sub) => {
                                        const empSubMax = Math.max(...selectedEmployee.subsidiaries.map(s => s.total_hours), 1);
                                        return (
                                            <div 
                                                key={sub.subsidiary_id}
                                                className={`p-3 rounded-lg cursor-pointer transition-all ${
                                                    selectedEmpSubsidiary?.subsidiary_id === sub.subsidiary_id
                                                        ? 'bg-purple-50 ring-2 ring-purple-400'
                                                        : 'bg-gray-50 hover:bg-gray-100'
                                                }`}
                                                onClick={() => setSelectedEmpSubsidiary(
                                                    selectedEmpSubsidiary?.subsidiary_id === sub.subsidiary_id ? null : sub
                                                )}
                                            >
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="font-medium text-gray-700 flex items-center gap-2">
                                                        {sub.subsidiary_name}
                                                        <span className="text-xs text-gray-400">
                                                            {selectedEmpSubsidiary?.subsidiary_id === sub.subsidiary_id ? '▼' : '▶'}
                                                        </span>
                                                    </span>
                                                    <span className="text-sm font-bold text-corporate-blue">{sub.total_hours.toFixed(1)}h</span>
                                                </div>
                                                <div className="relative h-4 bg-gray-200 rounded overflow-hidden">
                                                    <div 
                                                        className="absolute inset-y-0 left-0 flex"
                                                        style={{ width: `${(sub.total_hours / empSubMax) * 100}%` }}
                                                    >
                                                        {sub.approved_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-corporate-green"
                                                                style={{ width: `${(sub.approved_hours / sub.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                        {sub.submitted_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-yellow-400"
                                                                style={{ width: `${(sub.submitted_hours / sub.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                        {sub.draft_hours > 0 && (
                                                            <div 
                                                                className="h-full bg-gray-300"
                                                                style={{ width: `${(sub.draft_hours / sub.total_hours) * 100}%` }}
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Détail par service de la filiale sélectionnée */}
                                {selectedEmpSubsidiary && (
                                    <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                                        <h4 className="font-bold text-gray-700 mb-3">
                                            🏷️ Services - {selectedEmpSubsidiary.subsidiary_name}
                                        </h4>
                                        {selectedEmpSubsidiary.services.length === 0 ? (
                                            <p className="text-sm text-gray-500">Aucun service</p>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                {selectedEmpSubsidiary.services.map((srv, idx) => {
                                                    const srvMax = Math.max(...selectedEmpSubsidiary.services.map(s => s.total_hours), 1);
                                                    return (
                                                        <div key={srv.service_id || idx} className="bg-white p-2 rounded">
                                                            <div className="flex justify-between text-sm mb-1">
                                                                <span className="text-gray-600">{srv.service_name}</span>
                                                                <span className="font-bold text-purple-600">{srv.total_hours.toFixed(1)}h</span>
                                                            </div>
                                                            <div className="relative h-3 bg-gray-100 rounded overflow-hidden">
                                                                <div 
                                                                    className="absolute inset-y-0 left-0 flex"
                                                                    style={{ width: `${(srv.total_hours / srvMax) * 100}%` }}
                                                                >
                                                                    {srv.approved_hours > 0 && (
                                                                        <div 
                                                                            className="h-full bg-corporate-green"
                                                                            style={{ width: `${(srv.approved_hours / srv.total_hours) * 100}%` }}
                                                                        />
                                                                    )}
                                                                    {srv.submitted_hours > 0 && (
                                                                        <div 
                                                                            className="h-full bg-yellow-400"
                                                                            style={{ width: `${(srv.submitted_hours / srv.total_hours) * 100}%` }}
                                                                        />
                                                                    )}
                                                                    {srv.draft_hours > 0 && (
                                                                        <div 
                                                                            className="h-full bg-gray-300"
                                                                            style={{ width: `${(srv.draft_hours / srv.total_hours) * 100}%` }}
                                                                        />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </AppLayout>
    );
}
