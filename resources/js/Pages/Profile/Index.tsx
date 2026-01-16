import { Head, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import { PageProps } from '@/types';

export default function ProfileIndex() {
    const { auth } = usePage<PageProps>().props;
    const user = auth.user;

    const { data, setData, patch, processing, errors, recentlySuccessful } = useForm({
        email: user.email,
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(route('profile.update'), {
            preserveScroll: true,
            onSuccess: () => {
                setData('current_password', '');
                setData('password', '');
                setData('password_confirmation', '');
            },
        });
    };

    const displayName = user.employee?.full_name || user.employee?.first_name || user.email.split('@')[0];
    const userRoles = user.roles?.map(r => r.name).join(', ') || 'EMPLOYEE';

    return (
        <AppLayout currentPage="profile" title="Mon Profil">
            <Head title="Profil" />

            <div className="max-w-2xl space-y-8">
                {/* Profile Header */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-corporate-blue to-corporate-green flex items-center justify-center text-3xl font-bold text-white">
                            {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">{displayName}</h2>
                            <p className="text-gray-500">{user.email}</p>
                            <div className="flex gap-2 mt-2">
                                {user.roles?.map(role => (
                                    <span
                                        key={role.id}
                                        className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                            role.name === 'ADMIN' 
                                                ? 'bg-red-100 text-red-700'
                                                : role.name === 'MANAGER'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-gray-100 text-gray-600'
                                        }`}
                                    >
                                        {role.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {user.employee && (
                        <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-bold">Code Employé</p>
                                <p className="text-sm font-bold text-gray-800">{user.employee.employee_code}</p>
                            </div>
                            {user.employee.phone && (
                                <div>
                                    <p className="text-xs text-gray-400 uppercase font-bold">Téléphone</p>
                                    <p className="text-sm font-bold text-gray-800">{user.employee.phone}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Filiales et Services */}
                {user.employee && (
                    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">🏢 Affectations</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Filiales */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">🏢</span>
                                    Filiales assignées
                                </h4>
                                {user.employee.subsidiaries && user.employee.subsidiaries.length > 0 ? (
                                    <div className="space-y-2">
                                        {user.employee.subsidiaries.map((subsidiary) => (
                                            <div 
                                                key={subsidiary.id}
                                                className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100"
                                            >
                                                <div className="w-2 h-2 bg-corporate-blue rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-800">{subsidiary.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Aucune filiale assignée</p>
                                )}
                            </div>

                            {/* Services */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-600 mb-3 flex items-center gap-2">
                                    <span className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">🏷️</span>
                                    Services assignés
                                </h4>
                                {user.employee.services && user.employee.services.length > 0 ? (
                                    <div className="space-y-2">
                                        {user.employee.services.map((service) => (
                                            <div 
                                                key={service.id}
                                                className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-100"
                                            >
                                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                                <span className="text-sm font-medium text-gray-800">{service.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-400 italic">Aucun service assigné</p>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Email Update */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-6">Informations du compte</h3>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AuthInput
                            label="Adresse email"
                            type="email"
                            value={data.email}
                            onChange={(e) => setData('email', e.target.value)}
                            error={errors.email}
                            required
                        />

                        <hr className="border-gray-100" />

                        <h4 className="text-md font-bold text-gray-700">Changer le mot de passe</h4>

                        <AuthInput
                            label="Mot de passe actuel"
                            type="password"
                            value={data.current_password}
                            onChange={(e) => setData('current_password', e.target.value)}
                            error={errors.current_password}
                        />
                        <AuthInput
                            label="Nouveau mot de passe"
                            type="password"
                            value={data.password}
                            onChange={(e) => setData('password', e.target.value)}
                            error={errors.password}
                        />
                        <AuthInput
                            label="Confirmer le nouveau mot de passe"
                            type="password"
                            value={data.password_confirmation}
                            onChange={(e) => setData('password_confirmation', e.target.value)}
                            error={errors.password_confirmation}
                        />

                        <div className="flex items-center gap-4">
                            <AuthButton type="submit" isLoading={processing}>
                                Enregistrer les modifications
                            </AuthButton>
                            {recentlySuccessful && (
                                <span className="text-sm text-green-600 font-bold">
                                    ✓ Enregistré
                                </span>
                            )}
                        </div>
                    </form>
                </div>

                {/* Danger Zone */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-red-100">
                    <h3 className="text-lg font-bold text-red-600 mb-2">Zone de danger</h3>
                    <p className="text-sm text-gray-500 mb-4">
                        Une fois votre compte supprimé, toutes ses ressources et données seront définitivement effacées.
                    </p>
                    <AuthButton variant="outline" className="border-red-300 text-red-600 hover:bg-red-50">
                        Supprimer mon compte
                    </AuthButton>
                </div>
            </div>
        </AppLayout>
    );
}
