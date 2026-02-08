import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const Signup = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'student',
        department: '',
        section: '',
        rollNumber: ''
    });
    const [error, setError] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const result = await register(formData);
        if (result.success) {
            navigate('/dashboard');
        } else {
            setError(result.message);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-white/50 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>

                <div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
                        Create Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Join your institution's digital campus
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg text-sm">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                    <div className="rounded-md shadow-sm">
                        <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-semibold mb-2 ml-1">I am a...</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'student' })}
                                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${formData.role === 'student' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Student
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'faculty' })}
                                    className={`py-2 px-4 rounded-lg border text-sm font-medium transition-all ${formData.role === 'faculty' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                                >
                                    Faculty
                                </button>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <input
                                name="name"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={handleChange}
                            />
                            <input
                                name="email"
                                type="email"
                                required
                                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Email address"
                                value={formData.email}
                                onChange={handleChange}
                            />
                            <input
                                name="password"
                                type="password"
                                required
                                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Password"
                                value={formData.password}
                                onChange={handleChange}
                            />
                            <input
                                name="department"
                                type="text"
                                required
                                className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                placeholder="Department (e.g. CSE)"
                                value={formData.department}
                                onChange={handleChange}
                            />
                            {formData.role === 'student' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        name="rollNumber"
                                        type="text"
                                        required
                                        className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="Roll No"
                                        value={formData.rollNumber}
                                        onChange={handleChange}
                                    />
                                    <input
                                        name="section"
                                        type="text"
                                        required
                                        className="appearance-none rounded-lg relative block w-full px-4 py-3 border border-gray-300 placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                                        placeholder="Section"
                                        value={formData.section}
                                        onChange={handleChange}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30 transition-all duration-200 transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Create Account
                        </button>
                    </div>
                </form>
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        Already have an account? <Link to="/login" className="text-primary font-semibold hover:text-indigo-700 hover:underline">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Signup;
