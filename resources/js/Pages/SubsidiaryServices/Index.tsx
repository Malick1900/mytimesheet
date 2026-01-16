import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import AuthButton from '@/Components/AuthButton';
import { Subsidiary, Service } from '@/types';

interface SubsidiaryServicesProps {
    subsidiaries: (Subsidiary & { services: Service[] })[];
    services: Service[];
}

export default function SubsidiaryServicesIndex({ subsidiaries, services }: SubsidiaryServicesProps) {
    const [selectedSubsidiary, setSelectedSubsidiary] = useState<(Subsidiary & { services: Service[] }) | null>(null);
    const [selectedServices, setSelectedServices] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [processing, setProcessing] = useState(false);

    const openModal = (subsidiary: Subsidiary & { services: Service[] }) => {
        setSelectedSubsidiary(subsidiary);
        setSelectedServices(subsidiary.services.map(s => s.id));
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedSubsidiary(null);
        setSelectedServices([]);
    };

    const toggleService = (serviceId: string) => {
        setSelectedServices(prev => 
            prev.includes(serviceId) 
                ? prev.filter(id => id !== serviceId)
                : [...prev, serviceId]
        );
    };

    const handleSave = () => {
        if (!selectedSubsidiary) return;
        
        setProcessing(true);
        router.post(
            route('subsidiary-services.sync', selectedSubsidiary.id),
            { service_ids: selectedServices },
            {
                onSuccess: () => {
                    closeModal();
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                },
            }
        );
    };

    return (
        <AppLayout>
            <Head title="Gestion des services par filiale" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900">🔗 Services par filiale</h1>
                        <p className="text-gray-500 mt-1">Associez les services disponibles à chaque filiale</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {subsidiaries.map((subsidiary) => (
                        <div 
                            key={subsidiary.id} 
                            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 bg-gradient-to-br from-corporate-blue to-corporate-green rounded-xl flex items-center justify-center text-white font-bold text-lg">
                                            {subsidiary.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{subsidiary.name}</h3>
                                            <p className="text-xs text-gray-500">{subsidiary.code}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                                        Services associés ({subsidiary.services.length})
                                    </p>
                                    {subsidiary.services.length > 0 ? (
                                        <div className="flex flex-wrap gap-2">
                                            {subsidiary.services.map((service) => (
                                                <span 
                                                    key={service.id}
                                                    className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                                                >
                                                    {service.name}
                                                </span>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Aucun service associé</p>
                                    )}
                                </div>

                                <AuthButton 
                                    onClick={() => openModal(subsidiary)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    ⚙️ Gérer les services
                                </AuthButton>
                            </div>
                        </div>
                    ))}
                </div>

                {subsidiaries.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100">
                        <p className="text-gray-500">Aucune filiale active trouvée.</p>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && selectedSubsidiary && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div 
                        className="absolute inset-0 bg-black/50"
                        onClick={closeModal}
                    />
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">
                                Services de {selectedSubsidiary.name}
                            </h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Sélectionnez les services disponibles pour cette filiale
                            </p>
                        </div>

                        <div className="p-6 max-h-[400px] overflow-y-auto">
                            {services.length > 0 ? (
                                <div className="space-y-3">
                                    {services.map((service) => (
                                        <label 
                                            key={service.id}
                                            className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                                selectedServices.includes(service.id)
                                                    ? 'border-corporate-blue bg-corporate-blue/5'
                                                    : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedServices.includes(service.id)}
                                                onChange={() => toggleService(service.id)}
                                                className="w-5 h-5 rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                            />
                                            <div className="ml-4">
                                                <p className="font-bold text-gray-900">{service.name}</p>
                                                {service.description && (
                                                    <p className="text-sm text-gray-500">{service.description}</p>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8">
                                    Aucun service disponible. Créez d'abord des services.
                                </p>
                            )}
                        </div>

                        <div className="p-6 border-t border-gray-100 flex gap-3">
                            <button
                                onClick={closeModal}
                                className="flex-1 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Annuler
                            </button>
                            <AuthButton
                                onClick={handleSave}
                                isLoading={processing}
                                className="flex-1"
                            >
                                ✓ Enregistrer
                            </AuthButton>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
