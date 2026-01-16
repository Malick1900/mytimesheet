import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import { Service } from '@/types';

interface ServicesProps {
    services: Service[];
}

export default function ServicesIndex({ services = [] }: ServicesProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        description: '',
        is_active: true,
    });

    const handleCreate = () => {
        setEditingService(null);
        reset();
        setShowModal(true);
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        setData({
            name: service.name,
            description: service.description || '',
            is_active: service.is_active,
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingService) {
            put(route('admin.services.update', editingService.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('admin.services.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const columns = [
        {
            key: 'name',
            label: 'Nom',
            render: (service: Service) => (
                <span className="font-bold text-gray-800">{service.name}</span>
            ),
        },
        {
            key: 'description',
            label: 'Description',
            render: (service: Service) => (
                <span className="text-gray-600 text-sm">
                    {service.description || '—'}
                </span>
            ),
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (service: Service) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    service.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {service.is_active ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (service: Service) => (
                <button
                    onClick={() => handleEdit(service)}
                    className="text-corporate-blue hover:underline text-sm font-bold"
                >
                    Modifier
                </button>
            ),
        },
    ];

    return (
        <AppLayout currentPage="services" title="Gestion des Services">
            <Head title="Services" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">{services.length} service(s)</p>
                    <AuthButton onClick={handleCreate}>
                        + Nouveau service
                    </AuthButton>
                </div>

                <DataTable
                    columns={columns}
                    data={services}
                    emptyMessage="Aucun service enregistré"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {editingService ? 'Modifier le service' : 'Nouveau service'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthInput
                                label="Nom"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="Nom du service"
                                required
                            />
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Description du service (optionnel)"
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-corporate-blue focus:border-transparent resize-none"
                                />
                                {errors.description && (
                                    <p className="text-red-500 text-xs mt-1">{errors.description}</p>
                                )}
                            </div>
                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                />
                                <span className="text-sm text-gray-700">Service actif</span>
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
                                    {editingService ? 'Mettre à jour' : 'Créer'}
                                </AuthButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
