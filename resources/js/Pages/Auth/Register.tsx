import Logo from '@/Components/Logo';
import AuthInput from '@/Components/AuthInput';
import AuthButton from '@/Components/AuthButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('register'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <>
            <Head title="Inscription" />
            <div className="min-h-screen flex flex-col md:flex-row bg-white">
                {/* Sidebar Illustration Section */}
                <div className="hidden md:flex md:w-5/12 lg:w-4/12 bg-gradient-to-br from-corporate-blue to-corporate-blue-dark p-12 flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-[5%] left-[-10%] w-96 h-96 bg-corporate-green/20 rounded-full blur-3xl"></div>
                    
                    <div className="z-10">
                        <div className="bg-white/95 inline-block p-4 rounded-xl shadow-xl">
                            <Logo size="md" />
                        </div>
                    </div>

                    <div className="z-10 text-white">
                        <h2 className="text-4xl font-bold leading-tight mb-4">
                            Rejoignez <br /> MyTimesheet.
                        </h2>
                        <p className="text-blue-100 text-lg max-w-sm mb-8">
                            Créez votre compte et commencez à optimiser la gestion du temps de votre entreprise dès aujourd'hui.
                        </p>
                        <div className="flex gap-4 text-white/90">
                            <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <span className="block text-xl mb-1">🚀</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Rapide</span>
                            </div>
                            <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <span className="block text-xl mb-1">🔒</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Sécurisé</span>
                            </div>
                        </div>
                    </div>
                    <div className="z-10 text-xs text-blue-200/60 font-medium italic">
                        &copy; 2024 MyTimesheet - Solution SaaS Multi-filiales.
                    </div>
                </div>

                {/* Main Form Section */}
                <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-24 bg-gray-50/50">
                    <div className="w-full max-w-[440px]">
                        <div className="md:hidden mb-12 flex justify-center"><Logo size="md" /></div>
                        <div className="mb-10 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">
                                Créez votre compte
                            </h1>
                            <p className="text-gray-500">
                                Remplissez les informations ci-dessous pour commencer.
                            </p>
                        </div>

                        <form onSubmit={submit} className="space-y-5">
                            <AuthInput 
                                label="Nom complet" 
                                type="text" 
                                placeholder="Jean Dupont" 
                                required 
                                icon={<span>👤</span>}
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                error={errors.name}
                            />
                            <AuthInput 
                                label="Adresse Email" 
                                type="email" 
                                placeholder="nom@entreprise.com" 
                                required 
                                icon={<span>📧</span>}
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                error={errors.email}
                            />
                            <AuthInput 
                                label="Mot de passe" 
                                type="password" 
                                placeholder="••••••••" 
                                required 
                                icon={<span>🔒</span>}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                error={errors.password}
                            />
                            <AuthInput 
                                label="Confirmer le mot de passe" 
                                type="password" 
                                placeholder="••••••••" 
                                required 
                                icon={<span>🔒</span>}
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                error={errors.password_confirmation}
                            />

                            <AuthButton type="submit" className="w-full h-12" isLoading={processing} variant="secondary">
                                S'inscrire
                            </AuthButton>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-500">
                            Déjà inscrit ?{' '}
                            <Link href={route('login')} className="font-bold text-corporate-blue hover:underline">
                                Se connecter
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
