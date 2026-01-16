import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import Select from '@/Components/Select';
import { Subsidiary, Company } from '@/types';

interface SubsidiariesProps {
    subsidiaries: Subsidiary[];
    companies: Company[];
}

export default function SubsidiariesIndex({ subsidiaries = [], companies = [] }: SubsidiariesProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingSubsidiary, setEditingSubsidiary] = useState<Subsidiary | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        company_id: '',
        code: '',
        name: '',
        is_active: true,
    });

    const handleCreate = () => {
        setEditingSubsidiary(null);
        reset();
        setShowModal(true);
    };

    const handleEdit = (subsidiary: Subsidiary) => {
        setEditingSubsidiary(subsidiary);
        setData({
            company_id: subsidiary.company_id || '',
            code: subsidiary.code,
            name: subsidiary.name,
            is_active: subsidiary.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingSubsidiary) {
            put(route('admin.subsidiaries.update', editingSubsidiary.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('admin.subsidiaries.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const companyOptions = [
        { value: '', label: 'Aucune entreprise' },
        ...companies.map(c => ({ value: c.id, label: c.name }))
    ];

    const columns = [
        {
            key: 'code',
            label: 'Code',
            render: (sub: Subsidiary) => (
                <span className="font-mono font-bold text-corporate-blue">{sub.code}</span>
            ),
        },
        {
            key: 'name',
            label: 'Nom',
            render: (sub: Subsidiary) => (
                <span className="font-bold text-gray-800">{sub.name}</span>
            ),
        },
        {
            key: 'company',
            label: 'Entreprise',
            render: (sub: Subsidiary) => sub.company?.name || '—',
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (sub: Subsidiary) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    sub.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {sub.is_active ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (sub: Subsidiary) => (
                <button
                    onClick={() => handleEdit(sub)}
                    className="text-corporate-blue hover:underline text-sm font-bold"
                >
                    Modifier
                </button>
            ),
        },
    ];

    return (
        <AppLayout currentPage="subsidiaries" title="Gestion des Filiales">
            <Head title="Filiales" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">{subsidiaries.length} filiale(s)</p>
                    <AuthButton onClick={handleCreate}>
                        + Nouvelle filiale
                    </AuthButton>
                </div>

                <DataTable
                    columns={columns}
                    data={subsidiaries}
                    emptyMessage="Aucune filiale enregistrée"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {editingSubsidiary ? 'Modifier la filiale' : 'Nouvelle filiale'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthInput
                                label="Code"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value)}
                                error={errors.code}
                                placeholder="Ex: FIL-001"
                                required
                            />
                            <AuthInput
                                label="Nom"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="Nom de la filiale"
                                required
                            />
                            <Select
                                label="Entreprise"
                                options={companyOptions}
                                value={data.company_id}
                                onChange={(value) => setData('company_id', value)}
                                error={errors.company_id}
                            />
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                />
                                <span className="text-sm text-gray-700">Filiale active</span>
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
                                    {editingSubsidiary ? 'Mettre à jour' : 'Créer'}
                                </AuthButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
