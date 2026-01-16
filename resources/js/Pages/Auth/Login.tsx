import Checkbox from '@/Components/Checkbox';
import Logo from '@/Components/Logo';
import AuthInput from '@/Components/AuthInput';
import AuthButton from '@/Components/AuthButton';
import { Head, Link, useForm } from '@inertiajs/react';
import { FormEventHandler } from 'react';

export default function Login({
    status,
    canResetPassword,
}: {
    status?: string;
    canResetPassword: boolean;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false as boolean,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <>
            <Head title="Connexion" />
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
                            Simplifiez la gestion <br /> de votre temps.
                        </h2>
                        <p className="text-blue-100 text-lg max-w-sm mb-8">
                            Optimisez la productivité de vos équipes avec une interface intuitive et conforme aux standards professionnels.
                        </p>
                        <div className="flex gap-4 text-white/90">
                            <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <span className="block text-xl mb-1">📅</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Calendrier</span>
                            </div>
                            <div className="flex-1 p-3 bg-white/5 border border-white/10 rounded-lg">
                                <span className="block text-xl mb-1">📈</span>
                                <span className="text-xs font-bold uppercase tracking-widest text-blue-200">Analyses</span>
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
                                Bienvenue sur MyTimesheet
                            </h1>
                            <p className="text-gray-500">
                                Accédez à votre espace sécurisé.
                            </p>
                        </div>

                        {status && (
                            <div className="mb-4 text-sm font-medium text-green-600 bg-green-50 p-3 rounded-lg">
                                {status}
                            </div>
                        )}

                        <form onSubmit={submit} className="space-y-6">
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
                            
                            <div className="flex items-center justify-between">
                                <label className="flex items-center">
                                    <Checkbox
                                        name="remember"
                                        checked={data.remember}
                                        onChange={(e) =>
                                            setData('remember', e.target.checked as false)
                                        }
                                    />
                                    <span className="ms-2 text-sm text-gray-600">
                                        Se souvenir de moi
                                    </span>
                                </label>
                                
                                {canResetPassword && (
                                    <Link
                                        href={route('password.request')}
                                        className="text-sm text-corporate-blue hover:underline"
                                    >
                                        Mot de passe oublié ?
                                    </Link>
                                )}
                            </div>

                            <AuthButton type="submit" className="w-full h-12" isLoading={processing}>
                                Se connecter
                            </AuthButton>
                        </form>

                        <p className="mt-8 text-center text-sm text-gray-500">
                            Pas encore de compte ?{' '}
                            <Link href={route('register')} className="font-bold text-corporate-green hover:underline">
                                S'inscrire
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
