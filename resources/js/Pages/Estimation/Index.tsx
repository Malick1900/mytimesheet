import { Head, router } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import AppLayout from '@/Layouts/AppLayout';

interface SubsidiaryWithHours {
    id: string;
    name: string;
    code: string;
    total_hours: number;
    employee_count: number;
}

interface HoursByEmployee {
    employee_id: string;
    employee_name: string;
    employee_code: string;
    total_hours: number;
}

interface SubsidiaryData {
    subsidiary: {
        id: string;
        name: string;
        code: string;
    };
    hours_by_employee: HoursByEmployee[];
    total_hours: number;
    employee_count: number;
}

interface EstimationProps {
    subsidiaries: SubsidiaryWithHours[];
    selectedSubsidiaryId?: string;
    subsidiaryData?: SubsidiaryData;
    isAdmin?: boolean;
}

export default function EstimationIndex({
    subsidiaries = [],
    selectedSubsidiaryId,
    subsidiaryData,
    isAdmin = false,
}: EstimationProps) {
    const [hourlyRate, setHourlyRate] = useState<number>(0);

    const handleSubsidiarySelect = (subsidiaryId: string) => {
        router.get(route('estimation.index'), { subsidiary_id: subsidiaryId }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const totalAmount = useMemo(() => {
        if (!subsidiaryData) return 0;
        return subsidiaryData.total_hours * hourlyRate;
    }, [subsidiaryData, hourlyRate]);

    const handleExportPDF = () => {
        if (!subsidiaryData) return;
        
        const params = new URLSearchParams({
            subsidiary_id: subsidiaryData.subsidiary.id,
            rate: hourlyRate.toString(),
        });
        
        window.open(`/estimation/export-pdf?${params.toString()}`, '_blank');
    };

    // Calcul des totaux globaux
    const globalTotals = useMemo(() => {
        return {
            totalHours: subsidiaries.reduce((sum, s) => sum + s.total_hours, 0),
            subsidiaryCount: subsidiaries.length,
        };
    }, [subsidiaries]);

    return (
        <AppLayout currentPage="estimation" title="Estimation">
            <Head title="Estimation" />

            <div className="space-y-6">
                {/* Header avec badge rôle */}
                <div className={`${isAdmin ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-corporate-blue to-blue-600'} text-white px-4 py-3 rounded-xl shadow-sm flex items-center gap-3`}>
                    <span className="text-xl">{isAdmin ? '🛡️' : '👔'}</span>
                    <div>
                        <p className="font-bold text-sm">Estimation par Filiale</p>
                        <p className="text-xs opacity-90">
                            {isAdmin ? 'Accès à toutes les filiales' : 'Filiales de vos services gérés'}
                        </p>
                    </div>
                    <div className="ml-auto flex gap-4 text-xs">
                        <span className="bg-white/20 px-2 py-1 rounded">{globalTotals.totalHours.toFixed(1)}h validées</span>
                        <span className="bg-white/20 px-2 py-1 rounded">{subsidiaries.length} filiale(s)</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Liste des filiales */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-4 bg-gray-50 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800">🏢 Filiales</h3>
                                <p className="text-xs text-gray-500 mt-1">{subsidiaries.length} filiale(s) avec heures validées</p>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                                {subsidiaries.length === 0 ? (
                                    <div className="p-4 text-center text-gray-500">
                                        Aucune filiale avec heures validées
                                    </div>
                                ) : (
                                    subsidiaries.map(subsidiary => (
                                        <button
                                            key={subsidiary.id}
                                            onClick={() => handleSubsidiarySelect(subsidiary.id)}
                                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                                selectedSubsidiaryId === subsidiary.id ? 'bg-corporate-blue/5 border-l-4 border-l-corporate-blue' : ''
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-corporate-blue to-blue-600 text-white flex items-center justify-center font-bold text-sm">
                                                    {subsidiary.name?.substring(0, 2).toUpperCase()}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-gray-800 truncate">
                                                        {subsidiary.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{subsidiary.code}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-corporate-green">{subsidiary.total_hours.toFixed(1)}h</p>
                                                    <p className="text-xs text-gray-400">{subsidiary.employee_count} emp.</p>
                                                </div>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Détails et calcul */}
                    <div className="lg:col-span-2">
                        {!selectedSubsidiaryId ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <div className="text-6xl mb-4">💰</div>
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Estimation des coûts par filiale</h3>
                                <p className="text-gray-500">
                                    Sélectionnez une filiale pour voir le détail des heures validées et calculer l'estimation
                                </p>
                            </div>
                        ) : !subsidiaryData ? (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                                <div className="text-6xl mb-4">⏳</div>
                                <p className="text-gray-500">Chargement...</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Header filiale */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-corporate-blue to-blue-600 text-white flex items-center justify-center font-bold text-xl">
                                            {subsidiaryData.subsidiary.name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold text-gray-800">
                                                {subsidiaryData.subsidiary.name}
                                            </h2>
                                            <p className="text-gray-500">{subsidiaryData.subsidiary.code} • {subsidiaryData.employee_count} employé(s)</p>
                                        </div>
                                        <div className="ml-auto text-right">
                                            <p className="text-sm text-gray-500">Total heures validées</p>
                                            <p className="text-2xl font-bold text-corporate-green">{subsidiaryData.total_hours.toFixed(1)}h</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Taux horaire */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 p-4">
                                    <div className="flex flex-wrap items-center gap-4">
                                        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                            💵 Taux horaire :
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={hourlyRate || ''}
                                            onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                                            className="w-32 p-2 border border-gray-300 rounded-lg text-right font-mono focus:border-corporate-blue focus:ring-2 focus:ring-corporate-blue/20"
                                            placeholder="0.00"
                                        />
                                        <span className="text-sm text-gray-500">FCFA/h</span>
                                        <div className="ml-auto flex items-center gap-2">
                                            <span className="text-sm text-gray-600">Estimation :</span>
                                            <span className="text-xl font-bold text-corporate-green">
                                                {totalAmount.toLocaleString('fr-FR')} FCFA
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Tableau des heures par employé */}
                                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                                        <h3 className="font-bold text-gray-800">👥 Détail par employé</h3>
                                        {subsidiaryData.hours_by_employee.length > 0 && hourlyRate > 0 && (
                                            <button
                                                onClick={handleExportPDF}
                                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                                            >
                                                📄 Exporter PDF
                                            </button>
                                        )}
                                    </div>
                                    
                                    {subsidiaryData.hours_by_employee.length === 0 ? (
                                        <div className="p-8 text-center text-gray-500">
                                            Aucune heure validée pour cette filiale
                                        </div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead className="bg-gray-50">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Employé
                                                        </th>
                                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Code
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Heures
                                                        </th>
                                                        <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                            Montant (FCFA)
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {subsidiaryData.hours_by_employee.map((item) => (
                                                        <tr key={item.employee_id} className="hover:bg-gray-50">
                                                            <td className="px-4 py-3">
                                                                <span className="font-medium text-gray-800">{item.employee_name}</span>
                                                            </td>
                                                            <td className="px-4 py-3">
                                                                <span className="text-gray-500 text-sm">{item.employee_code}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="font-mono text-gray-700">{item.total_hours.toFixed(1)}h</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-right">
                                                                <span className="font-mono font-bold text-corporate-blue">
                                                                    {(item.total_hours * hourlyRate).toLocaleString('fr-FR')} FCFA
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                                <tfoot className="bg-gray-50 border-t-2 border-gray-200">
                                                    <tr>
                                                        <td className="px-4 py-4 font-bold text-gray-800" colSpan={2}>TOTAL</td>
                                                        <td className="px-4 py-4 text-right font-mono font-bold text-gray-800">
                                                            {subsidiaryData.total_hours.toFixed(1)}h
                                                        </td>
                                                        <td className="px-4 py-4 text-right">
                                                            <span className="text-xl font-mono font-bold text-corporate-green">
                                                                {totalAmount.toLocaleString('fr-FR')} FCFA
                                                            </span>
                                                        </td>
                                                    </tr>
                                                </tfoot>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
