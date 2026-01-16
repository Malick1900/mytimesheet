import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import { Employee, Subsidiary, Service } from '@/types';

interface EmployeesProps {
    employees: Employee[];
    subsidiaries: Subsidiary[];
    services: Service[];
}

export default function EmployeesIndex({ employees = [], subsidiaries = [], services = [] }: EmployeesProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_code: '',
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        is_active: true,
        subsidiary_ids: [] as string[],
        service_ids: [] as string[],
    });

    const handleCreate = () => {
        setEditingEmployee(null);
        reset();
        setShowModal(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setData({
            employee_code: employee.employee_code,
            first_name: employee.first_name,
            last_name: employee.last_name,
            email: employee.email || '',
            phone: employee.phone || '',
            is_active: employee.is_active,
            subsidiary_ids: employee.subsidiaries?.map(s => s.id) || [],
            service_ids: employee.services?.map(s => s.id) || [],
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingEmployee) {
            put(route('admin.employees.update', editingEmployee.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('admin.employees.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const toggleSubsidiary = (id: string) => {
        setData('subsidiary_ids', 
            data.subsidiary_ids.includes(id)
                ? data.subsidiary_ids.filter(x => x !== id)
                : [...data.subsidiary_ids, id]
        );
    };

    const toggleService = (id: string) => {
        setData('service_ids', 
            data.service_ids.includes(id)
                ? data.service_ids.filter(x => x !== id)
                : [...data.service_ids, id]
        );
    };

    const columns = [
        {
            key: 'employee_code',
            label: 'Code',
            render: (emp: Employee) => (
                <span className="font-mono font-bold text-corporate-blue">{emp.employee_code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nom complet',
            render: (emp: Employee) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-corporate-green/20 text-corporate-green flex items-center justify-center font-bold text-xs">
                        {emp.first_name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-800">
                        {emp.first_name} {emp.last_name}
                    </span>
                </div>
            ),
        },
        {
            key: 'email',
            label: 'Email',
            render: (emp: Employee) => emp.email || '—',
        },
        {
            key: 'phone',
            label: 'Téléphone',
            render: (emp: Employee) => emp.phone || '—',
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (emp: Employee) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    emp.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {emp.is_active ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (emp: Employee) => (
                <button
                    onClick={() => handleEdit(emp)}
                    className="text-corporate-blue hover:underline text-sm font-bold"
                >
                    Modifier
                </button>
            ),
        },
    ];

    return (
        <AppLayout currentPage="employees" title="Gestion des Employés">
            <Head title="Employés" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">{employees.length} employé(s)</p>
                    <AuthButton onClick={handleCreate}>
                        + Nouvel employé
                    </AuthButton>
                </div>

                <DataTable
                    columns={columns}
                    data={employees}
                    emptyMessage="Aucun employé enregistré"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {editingEmployee ? 'Modifier l\'employé' : 'Nouvel employé'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthInput
                                label="Code employé"
                                value={data.employee_code}
                                onChange={(e) => setData('employee_code', e.target.value)}
                                error={errors.employee_code}
                                placeholder="Ex: EMP-001"
                                required
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <AuthInput
                                    label="Prénom"
                                    value={data.first_name}
                                    onChange={(e) => setData('first_name', e.target.value)}
                                    error={errors.first_name}
                                    required
                                />
                                <AuthInput
                                    label="Nom"
                                    value={data.last_name}
                                    onChange={(e) => setData('last_name', e.target.value)}
                                    error={errors.last_name}
                                    required
                                />
                            </div>
                            <AuthInput
                                label="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                placeholder="email@example.com"
                            />
                            <AuthInput
                                label="Téléphone"
                                value={data.phone}
                                onChange={(e) => setData('phone', e.target.value)}
                                error={errors.phone}
                                placeholder="+33 6 00 00 00 00"
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Filiales assignées
                                    </label>
                                    <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                        {subsidiaries.length === 0 ? (
                                            <p className="text-sm text-gray-400">Aucune filiale disponible</p>
                                        ) : (
                                            subsidiaries.map(sub => (
                                                <label key={sub.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.subsidiary_ids.includes(sub.id)}
                                                        onChange={() => toggleSubsidiary(sub.id)}
                                                        className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                                    />
                                                    <span className="text-sm text-gray-700">{sub.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Services assignés
                                    </label>
                                    <div className="border border-gray-200 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                        {services.length === 0 ? (
                                            <p className="text-sm text-gray-400">Aucun service disponible</p>
                                        ) : (
                                            services.map(srv => (
                                                <label key={srv.id} className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.service_ids.includes(srv.id)}
                                                        onChange={() => toggleService(srv.id)}
                                                        className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                                    />
                                                    <span className="text-sm text-gray-700">{srv.name}</span>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                />
                                <span className="text-sm text-gray-700">Employé actif</span>
                            </label>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        reset();
                                    }}
                                    className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 font-bold hover:bg-gray-50"
                                >
                                    Annuler
                                </button>
                                <AuthButton type="submit" isLoading={processing} className="flex-1">
                                    {editingEmployee ? 'Mettre à jour' : 'Créer'}
                                </AuthButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
