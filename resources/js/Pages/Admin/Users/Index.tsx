import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable from '@/Components/DataTable';
import AuthButton from '@/Components/AuthButton';
import AuthInput from '@/Components/AuthInput';
import Select from '@/Components/Select';
import { User, Employee, Role } from '@/types';

interface UsersProps {
    users: User[];
    employees: Employee[];
    roles: Role[];
}

export default function UsersIndex({ users = [], employees = [], roles = [] }: UsersProps) {
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        employee_id: '',
        email: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        role_ids: [] as string[],
    });

    const handleCreate = () => {
        setEditingUser(null);
        reset();
        setShowModal(true);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setData({
            employee_id: user.employee_id || '',
            email: user.email,
            password: '',
            password_confirmation: '',
            is_active: user.is_active,
            role_ids: user.roles?.map(r => r.id) || [],
        });
        setShowModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            put(route('admin.users.update', editingUser.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        } else {
            post(route('admin.users.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const toggleRole = (id: string) => {
        setData('role_ids', 
            data.role_ids.includes(id)
                ? data.role_ids.filter(x => x !== id)
                : [...data.role_ids, id]
        );
    };

    const employeeOptions = [
        { value: '', label: 'Aucun employé lié' },
        ...employees.map(e => ({ value: e.id, label: `${e.first_name} ${e.last_name} (${e.employee_code})` }))
    ];

    const columns = [
        {
            key: 'email',
            label: 'Email',
            render: (user: User) => (
                <span className="font-bold text-gray-800">{user.email}</span>
            ),
        },
        {
            key: 'employee',
            label: 'Employé lié',
            render: (user: User) => user.employee 
                ? `${user.employee.first_name} ${user.employee.last_name}`
                : '—',
        },
        {
            key: 'roles',
            label: 'Rôles',
            render: (user: User) => (
                <div className="flex gap-1 flex-wrap">
                    {user.roles?.map(role => (
                        <span
                            key={role.id}
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                                role.name === 'ADMIN' 
                                    ? 'bg-red-100 text-red-700'
                                    : role.name === 'MANAGER'
                                    ? 'bg-blue-100 text-blue-700'
                                    : 'bg-gray-100 text-gray-600'
                            }`}
                        >
                            {role.name}
                        </span>
                    )) || '—'}
                </div>
            ),
        },
        {
            key: 'is_active',
            label: 'Statut',
            render: (user: User) => (
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                    user.is_active 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                }`}>
                    {user.is_active ? 'Actif' : 'Inactif'}
                </span>
            ),
        },
        {
            key: 'last_login_at',
            label: 'Dernière connexion',
            render: (user: User) => user.last_login_at 
                ? new Date(user.last_login_at).toLocaleDateString('fr-FR')
                : 'Jamais',
        },
        {
            key: 'actions',
            label: '',
            className: 'text-right',
            render: (user: User) => (
                <button
                    onClick={() => handleEdit(user)}
                    className="text-corporate-blue hover:underline text-sm font-bold"
                >
                    Modifier
                </button>
            ),
        },
    ];

    return (
        <AppLayout currentPage="users" title="Gestion des Utilisateurs">
            <Head title="Utilisateurs" />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <p className="text-gray-500">{users.length} utilisateur(s)</p>
                    <AuthButton onClick={handleCreate}>
                        + Nouvel utilisateur
                    </AuthButton>
                </div>

                <DataTable
                    columns={columns}
                    data={users}
                    emptyMessage="Aucun utilisateur enregistré"
                />
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 overflow-y-auto py-8">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">
                            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <AuthInput
                                label="Email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                                required
                            />
                            
                            <Select
                                label="Employé lié (optionnel)"
                                options={employeeOptions}
                                value={data.employee_id}
                                onChange={(value) => setData('employee_id', value)}
                                error={errors.employee_id}
                            />

                            <AuthInput
                                label={editingUser ? "Nouveau mot de passe (laisser vide pour ne pas changer)" : "Mot de passe"}
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                                required={!editingUser}
                            />
                            <AuthInput
                                label="Confirmer le mot de passe"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                error={errors.password_confirmation}
                                required={!editingUser && !!data.password}
                            />

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Rôles
                                </label>
                                <div className="border border-gray-200 rounded-lg p-3 space-y-2">
                                    {roles.map(role => (
                                        <label key={role.id} className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={data.role_ids.includes(role.id)}
                                                onChange={() => toggleRole(role.id)}
                                                className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                            />
                                            <span className="text-sm text-gray-700 font-medium">{role.name}</span>
                                            {role.description && (
                                                <span className="text-xs text-gray-400">— {role.description}</span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-corporate-blue focus:ring-corporate-blue"
                                />
                                <span className="text-sm text-gray-700">Utilisateur actif</span>
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
                                    {editingUser ? 'Mettre à jour' : 'Créer'}
                                </AuthButton>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}
