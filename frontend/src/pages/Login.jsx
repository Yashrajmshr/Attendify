import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await login(email, password);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
            <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl w-full max-w-md border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

                <h2 className="text-3xl font-bold mb-2 text-center text-gray-800">Welcome Back</h2>
                <p className="text-gray-500 text-center mb-8">Login to your account to continue</p>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-6 flex items-start">
                        <span className="font-medium mr-2">Error:</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2 ml-1">Email Address</label>
                        <input
                            type="email"
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="student@college.edu"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-2 ml-1">Password</label>
                        <input
                            type="password"
                            className="w-full px-4 py-3 rounded-lg bg-gray-50 border border-gray-200 focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 rounded-xl hover:shadow-lg hover:shadow-indigo-500/30 transform hover:-translate-y-0.5 transition-all duration-200"
                    >
                        Sign In
                    </button>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600">
                            Don't have an account?{' '}
                            <Link to="/signup" className="text-primary font-semibold hover:text-indigo-700 hover:underline transition-colors">
                                Create Account
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Login;
