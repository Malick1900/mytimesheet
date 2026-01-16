import { Head, router } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Select from '@/Components/Select';
import StatusBadge from '@/Components/StatusBadge';
import { Employee, Subsidiary, Service } from '@/types';

interface EmployeeWithCount extends Employee {
    entries_count: number;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface ValidationProps {
    employees: PaginatedData<EmployeeWithCount>;
    subsidiaries: Subsidiary[];
    services: Service[];
    filters: {
        status: string;
    };
}

export default function ValidationIndex({ 
    employees, 
    subsidiaries = [], 
    services = [],
    filters = { status: 'SUBMITTED' }
}: ValidationProps) {
    const employeesList = employees?.data || [];
    const pagination = employees || { current_page: 1, last_page: 1, total: 0, from: 0, to: 0 };

    const handleEmployeeClick = (employee: EmployeeWithCount) => {
        router.get(route('validation.show', employee.id));
    };

    const handleStatusChange = (status: string) => {
        router.get(route('validation.index'), { status }, { preserveState: true });
    };

    const handlePageChange = (page: number) => {
        router.get(route('validation.index'), { ...filters, page }, { preserveState: true });
    };

    const statusOptions = [
        { value: 'SUBMITTED', label: 'En attente' },
        { value: 'APPROVED', label: 'Validées' },
        { value: 'REJECTED', label: 'Rejetées' },
        { value: 'ALL', label: 'Tous les statuts' },
    ];

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'en attente';
            case 'APPROVED': return 'validée(s)';
            case 'REJECTED': return 'rejetée(s)';
            default: return 'entrée(s)';
        }
    };

    const getStatusBadgeColor = (status: string) => {
        switch (status) {
            case 'SUBMITTED': return 'bg-yellow-100 text-yellow-700';
            case 'APPROVED': return 'bg-green-100 text-corporate-green';
            case 'REJECTED': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    return (
        <AppLayout currentPage="validation" title="Validations">
            <Head title="Validations" />

            <div className="space-y-6">
                {/* Header avec filtre */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div>
                            <h3 className="text-lg font-bold text-gray-800">Gestion des validations</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                Cliquez sur un employé pour voir et gérer ses entrées
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-48">
                                <Select
                                    label=""
                                    options={statusOptions}
                                    value={filters.status}
                                    onChange={handleStatusChange}
                                />
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-corporate-blue">{pagination.total}</p>
                                <p className="text-xs text-gray-400">employé(s)</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Liste des employés */}
                {employeesList.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-100 text-center">
                        <div className="text-5xl mb-4">✅</div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Aucun employé trouvé</h3>
                        <p className="text-sm text-gray-500">
                            Aucun employé n'a d'entrées avec ce statut.
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        {/* Table */}
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Employé
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Filiales
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Services
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Entrées
                                    </th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {employeesList.map((employee) => (
                                    <tr 
                                        key={employee.id} 
                                        className="hover:bg-gray-50 transition-colors cursor-pointer"
                                        onClick={() => handleEmployeeClick(employee)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-corporate-blue/10 text-corporate-blue flex items-center justify-center font-bold">
                                                    {employee.first_name?.charAt(0) || '?'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">
                                                        {employee.first_name} {employee.last_name}
                                                    </p>
                                                    <p className="text-xs text-gray-400">{employee.employee_code}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {employee.subsidiaries?.slice(0, 2).map((sub) => (
                                                    <span key={sub.id} className="px-2 py-1 bg-blue-50 text-corporate-blue text-xs font-medium rounded">
                                                        {sub.name}
                                                    </span>
                                                ))}
                                                {(employee.subsidiaries?.length || 0) > 2 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                                                        +{(employee.subsidiaries?.length || 0) - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {employee.services?.slice(0, 2).map((srv) => (
                                                    <span key={srv.id} className="px-2 py-1 bg-green-50 text-corporate-green text-xs font-medium rounded">
                                                        {srv.name}
                                                    </span>
                                                ))}
                                                {(employee.services?.length || 0) > 2 && (
                                                    <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded">
                                                        +{(employee.services?.length || 0) - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${getStatusBadgeColor(filters.status)}`}>
                                                {employee.entries_count} {getStatusLabel(filters.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="px-4 py-2 bg-corporate-blue/10 text-corporate-blue rounded-lg text-sm font-bold hover:bg-corporate-blue hover:text-white transition-colors">
                                                Voir →
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {pagination.last_page > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-500">
                                    Affichage de <span className="font-bold">{pagination.from}</span> à <span className="font-bold">{pagination.to}</span> sur <span className="font-bold">{pagination.total}</span> employés
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePageChange(pagination.current_page - 1); }}
                                        disabled={pagination.current_page === 1}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        ← Précédent
                                    </button>
                                    
                                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1)
                                        .filter(page => {
                                            const current = pagination.current_page;
                                            return page === 1 || page === pagination.last_page || 
                                                   (page >= current - 1 && page <= current + 1);
                                        })
                                        .map((page, index, array) => (
                                            <span key={page}>
                                                {index > 0 && array[index - 1] !== page - 1 && (
                                                    <span className="px-2 py-2 text-gray-400">...</span>
                                                )}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handlePageChange(page); }}
                                                    className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                                                        page === pagination.current_page
                                                            ? 'bg-corporate-blue text-white'
                                                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                                                    }`}
                                                >
                                                    {page}
                                                </button>
                                            </span>
                                        ))
                                    }
                                    
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handlePageChange(pagination.current_page + 1); }}
                                        disabled={pagination.current_page === pagination.last_page}
                                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Suivant →
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
