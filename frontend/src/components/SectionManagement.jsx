import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Plus, Edit, Trash2, X, Search, Layers, Upload, Download, ArrowLeft, Folder, ChevronRight, FileSpreadsheet } from 'lucide-react';

const SectionManagement = () => {
    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');

    // Hierarchy State
    const [viewMode, setViewMode] = useState('departments'); // 'departments', 'programs', 'years', 'sections'
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedSemester, setSelectedSemester] = useState(null);

    // Form State
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        department: '',
        program: '',
        year: '',
        semester: ''
    });

    // Upload State
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef(null);
    const sectionUploadInputRef = useRef(null);

    const [uploadSection, setUploadSection] = useState(null);

    // Rename State
    const [renamingItem, setRenamingItem] = useState(null); // { type: 'department' | 'year', value: string, department?: string }
    const [renameValue, setRenameValue] = useState('');

    useEffect(() => {
        fetchSections();
    }, []);

    const fetchSections = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/sections');
            setSections(data);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch sections', err);
            setError('Failed to fetch sections');
            setLoading(false);
        }
    };

    // --- Hierarchy Helpers ---
    const getDepartments = () => {
        const depts = new Set(sections.map(s => s.department).filter(Boolean));
        return Array.from(depts).sort();
    };

    const getPrograms = (dept) => {
        const programs = new Set(sections
            .filter(s => s.department === dept)
            .map(s => s.program)
            .filter(Boolean));
        return Array.from(programs).sort();
    };

    const getYears = (dept, prog) => {
        const years = new Set(sections
            .filter(s => s.department === dept && s.program === prog)
            .map(s => s.year)
            .filter(Boolean));
        return Array.from(years).sort();
    };

    const getSemesters = (dept, prog, year) => {
        const semesters = new Set(sections
            .filter(s => s.department === dept && s.program === prog && s.year === year)
            .map(s => s.semester)
            .filter(Boolean));
        return Array.from(semesters).sort();
    };

    const getCurrentSections = () => {
        return sections.filter(s =>
            s.department === selectedDepartment &&
            s.program === selectedProgram &&
            s.year === selectedYear &&
            s.semester === selectedSemester
        ).sort((a, b) => a.name.localeCompare(b.name));
    };

    // --- Navigation ---
    const handleDeptClick = (dept) => {
        setSelectedDepartment(dept);
        setViewMode('programs');
    };

    const handleProgramClick = (prog) => {
        setSelectedProgram(prog);
        setViewMode('years');
    };

    const handleYearClick = (year) => {
        setSelectedYear(year);
        setViewMode('semesters');
    };

    const handleSemesterClick = (sem) => {
        setSelectedSemester(sem);
        setViewMode('sections');
    };

    // --- CRUD ---
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');

        try {
            if (isEditing) {
                const { data } = await api.put(`/sections/${editId}`, formData);
                setSections(sections.map(sec => sec.id === editId ? data : sec));
                setMessage('Section updated successfully');
            } else {
                const { data } = await api.post('/sections', formData);
                setSections([...sections, data]);
                setMessage('Section created successfully');
            }
            resetForm();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save section');
        }
    };

    const handleEdit = (section) => {
        setFormData({
            name: section.name,
            department: section.department,
            program: section.program || '',
            year: section.year || '',
            semester: section.semester || ''
        });
        setEditId(section.id);
        setIsEditing(true);
        setShowForm(true);
        setMessage('');
        setError('');
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this section?')) {
            try {
                await api.delete(`/sections/${id}`);
                setSections(sections.filter(sec => sec.id !== id));
                setMessage('Section deleted successfully');
            } catch (err) {
                setError('Failed to delete section');
            }
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            department: selectedDepartment || '', // Pre-fill if selected
            program: selectedProgram || '',
            year: selectedYear || '',
            semester: selectedSemester || ''
        });
        setIsEditing(false);
        setEditId(null);
        setShowForm(false);
    };

    // --- Bulk Upload Sections ---
    const handleBulkUploadSections = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            setUploading(true);
            setMessage('');
            setError('');
            const { data } = await api.post('/sections/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Processed: ${data.summary.successful_inserts} created, ${data.summary.failed_rows.length} failed.`);
            if (data.summary.failed_rows.length > 0) {
                console.table(data.summary.failed_rows);
                setError('Some rows failed. Check console.');
            }
            fetchSections(); // Refresh
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to upload sections');
        } finally {
            setUploading(false);
            e.target.value = null;
        }
    };

    // --- Student Upload/Download ---
    const handleStudentUploadClick = (section) => {
        setUploadSection(section);
        fileInputRef.current.click();
    };

    const handleStudentFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file || !uploadSection) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('section', uploadSection.name);
        formData.append('department', uploadSection.department);
        formData.append('program', uploadSection.program || '');
        formData.append('year', uploadSection.year || '');
        formData.append('semester', uploadSection.semester || '');

        try {
            setUploading(true);
            setMessage('');
            setError('');
            const { data } = await api.post('/student/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage(`Uploaded to ${uploadSection.name}: ${data.summary.successful_inserts} success.`);
            if (data.summary.failed_rows.length > 0) {
                setError(`Completed with errors. Check console.`);
                console.table(data.summary.failed_rows);
            }
        } catch (err) {
            console.error(err);
            setError('Failed to upload students');
        } finally {
            setUploading(false);
            setUploadSection(null);
            e.target.value = null;
        }
    };

    const handleDownload = async (section) => {
        try {
            setMessage('Generating download...');
            const response = await api.post('/student/download-section', {
                section: section.name,
                department: section.department,
                program: section.program || '',
                year: section.year || '',
                semester: section.semester || ''
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `students_${section.department}_${section.name}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            setMessage('Download started');
        } catch (err) {
            console.error(err);
            setError('Failed to download student list');
        }
    };

    const handleDownloadTemplate = async () => {
        try {
            const response = await api.get('/sections/template', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'section_upload_template.xlsx');
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
        } catch (err) {
            console.error(err);
            setError('Failed to download template');
        }
    };

    // --- Renaming Logic ---
    const handleRenameClick = (type, value, department = null, program = null) => {
        // Prevent event propagation if triggered from button inside button
        setRenamingItem({ type, value, department, program });
        setRenameValue(value);
    };

    const handleRenameSubmit = async (e) => {
        e.preventDefault();
        if (!renameValue.trim() || renameValue === renamingItem.value) {
            setRenamingItem(null);
            return;
        }

        try {
            setLoading(true);
            await api.put('/sections/hierarchy', {
                type: renamingItem.type,
                oldValue: renamingItem.value,
                newValue: renameValue,
                department: renamingItem.department,
                program: renamingItem.program,
                year: renamingItem.year
            });

            setMessage(`${renamingItem.type === 'department' ? 'Department' : 'Year'} renamed successfully`);
            setRenamingItem(null);
            fetchSections(); // Refresh all data
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Failed to rename');
            setLoading(false);
        }
    };


    const handleDeleteHierarchy = async (type, value, department = null, program = null, year = null) => {
        let confirmMessage = '';
        if (type === 'department') {
            confirmMessage = `Are you sure you want to delete the Department "${value}"? This will delete ALL programs, years, semesters and sections within it.`;
        } else if (type === 'program') {
            confirmMessage = `Are you sure you want to delete the Program "${value}" from "${department}"? This will delete ALL years, semesters and sections within it.`;
        } else if (type === 'year') {
            confirmMessage = `Are you sure you want to delete Year "${value}" from "${department} - ${program}"? This will delete ALL semesters and sections in this year.`;
        } else {
            confirmMessage = `Are you sure you want to delete Semester "${value}" from "${department} - ${program} - Year ${value}"? This will delete ALL sections in this semester.`;
        }


        if (window.confirm(confirmMessage)) {
            try {
                setLoading(true);
                // Using data property for DELETE request body requires this syntax in axios
                await api.delete('/sections/hierarchy', {
                    data: {
                        type,
                        value,
                        department,
                        program,
                        year
                    }
                });

                setMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
                fetchSections(); // Refresh all data
                // If we deleted the currently selected department/program/year, reset selection
                if (type === 'department' && selectedDepartment === value) {
                    setSelectedDepartment(null);
                    setViewMode('departments');
                } else if (type === 'program' && selectedProgram === value) {
                    setSelectedProgram(null);
                    setViewMode('programs');
                } else if (type === 'year' && selectedYear === value) {
                    setSelectedYear(null);
                    setViewMode('years');
                } else if (type === 'semester' && selectedSemester === value) {
                    setSelectedSemester(null);
                    setViewMode('semesters');
                }
            } catch (err) {
                console.error(err);
                setError(err.response?.data?.message || 'Failed to delete');
                setLoading(false);
            }
        }
    };


    // --- Render Helpers ---
    const renderBreadcrumbs = () => (
        <div className="flex items-center text-sm text-slate-500 mb-4">
            <button onClick={() => { setViewMode('departments'); setSelectedDepartment(null); setSelectedProgram(null); setSelectedYear(null); setSelectedSemester(null); }} className="hover:text-indigo-600 font-medium">Departments</button>
            {selectedDepartment && (
                <>
                    <ChevronRight size={14} className="mx-1" />
                    <button onClick={() => { setViewMode('programs'); setSelectedProgram(null); setSelectedYear(null); setSelectedSemester(null); }} className="hover:text-indigo-600 font-medium">{selectedDepartment}</button>
                </>
            )}
            {selectedProgram && (
                <>
                    <ChevronRight size={14} className="mx-1" />
                    <button onClick={() => { setViewMode('years'); setSelectedYear(null); setSelectedSemester(null); }} className="hover:text-indigo-600 font-medium">{selectedProgram}</button>
                </>
            )}
            {selectedYear && (
                <>
                    <ChevronRight size={14} className="mx-1" />
                    <button onClick={() => { setViewMode('semesters'); setSelectedSemester(null); }} className="hover:text-indigo-600 font-medium">Year {selectedYear}</button>
                </>
            )}
            {selectedSemester && (
                <>
                    <ChevronRight size={14} className="mx-1" />
                    <span className="text-slate-900 dark:text-white font-bold">Sem {selectedSemester}</span>
                </>
            )}
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Department Management</h2>

                </div>
                <div className="flex gap-2">
                    <input
                        type="file"
                        ref={sectionUploadInputRef}
                        onChange={handleBulkUploadSections}
                        accept=".csv, .xlsx"
                        className="hidden"
                    />
                    <button
                        onClick={handleDownloadTemplate}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center shadow-sm border border-slate-200 dark:border-slate-700"
                        title="Download CSV Template"
                    >
                        <FileSpreadsheet size={16} className="mr-2" />
                        Template
                    </button>
                    <input
                        type="file"
                        ref={sectionUploadInputRef}
                        onChange={handleBulkUploadSections}
                        accept=".csv, .xlsx"
                        className="hidden"
                    />
                    <button
                        onClick={() => sectionUploadInputRef.current.click()}
                        disabled={uploading}
                        className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition flex items-center shadow-sm"
                    >
                        <Upload size={16} className="mr-2" />
                        Bulk Upload
                    </button>
                    <button
                        onClick={() => {
                            resetForm();
                            setShowForm(!showForm);
                        }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center shadow-sm ${showForm ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
                    >
                        {showForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
                        {showForm ? 'Cancel' : 'Add Section'}
                    </button>
                </div>
            </div>

            {renderBreadcrumbs()}

            {message && <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 animate-fade-in">{message}</div>}
            {error && <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 animate-fade-in">{error}</div>}

            {loading ? (
                <div className="text-center py-10 text-slate-500">Loading...</div>
            ) : (
                <>
                    {/* View: Departments */}
                    {viewMode === 'departments' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getDepartments().map(dept => (
                                <button
                                    key={dept}
                                    onClick={() => handleDeptClick(dept)}
                                    className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition text-left group flex flex-col items-start gap-4"
                                >
                                    <div className="p-3 bg-indigo-50 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                        <Folder size={28} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{dept}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick('department', dept); }}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title="Rename Department"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHierarchy('department', dept); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Department"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {sections.filter(s => s.department === dept).length} Sections
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {getDepartments().length === 0 && (
                                <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-2">No departments found.</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => { resetForm(); setShowForm(true); }} className="text-indigo-600 font-medium hover:underline">
                                            Create Manually
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={() => sectionUploadInputRef.current.click()} className="text-indigo-600 font-medium hover:underline">
                                            Upload CSV
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Programs */}
                    {viewMode === 'programs' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getPrograms(selectedDepartment).map(prog => (
                                <button
                                    key={prog}
                                    onClick={() => handleProgramClick(prog)}
                                    className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition text-left group flex flex-col items-start gap-4"
                                >
                                    <div className="p-3 bg-blue-50 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Folder size={28} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{prog}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick('program', prog, selectedDepartment); }}
                                                    className="p-1 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    title="Rename Program"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHierarchy('program', prog, selectedDepartment); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Program"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {sections.filter(s => s.department === selectedDepartment && s.program === prog).length} Sections
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {getPrograms(selectedDepartment).length === 0 && (
                                <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                    <p className="text-slate-500 mb-2">No programs found for {selectedDepartment}.</p>
                                    <div className="flex justify-center gap-4">
                                        <button onClick={() => { resetForm(); setShowForm(true); }} className="text-indigo-600 font-medium hover:underline">
                                            Create Manually
                                        </button>
                                        <span className="text-slate-300">|</span>
                                        <button onClick={() => sectionUploadInputRef.current.click()} className="text-indigo-600 font-medium hover:underline">
                                            Upload CSV
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Years */}
                    {viewMode === 'years' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getYears(selectedDepartment, selectedProgram).map(year => (
                                <button
                                    key={year}
                                    onClick={() => handleYearClick(year)}
                                    className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition text-left group flex flex-col items-start gap-4"
                                >
                                    <div className="p-3 bg-violet-50 rounded-lg text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors">
                                        <Layers size={28} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Year {year}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick('year', year, selectedDepartment, selectedProgram); }}
                                                    className="p-1 text-slate-400 hover:text-violet-600 transition-colors"
                                                    title="Rename Year"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHierarchy('year', year, selectedDepartment, selectedProgram); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Year"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {sections.filter(s => s.department === selectedDepartment && s.program === selectedProgram && s.year === year).length} Sections
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {getYears(selectedDepartment, selectedProgram).length === 0 && (
                                <div className="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">
                                    No years found for {selectedDepartment} - {selectedProgram}.
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Semesters */}
                    {viewMode === 'semesters' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {getSemesters(selectedDepartment, selectedProgram, selectedYear).map(sem => (
                                <button
                                    key={sem}
                                    onClick={() => handleSemesterClick(sem)}
                                    className="p-6 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md hover:border-indigo-300 transition text-left group flex flex-col items-start gap-4"
                                >
                                    <div className="p-3 bg-emerald-50 rounded-lg text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                                        <Layers size={28} />
                                    </div>
                                    <div className="flex-1 w-full">
                                        <div className="flex justify-between items-start">
                                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Semester {sem}</h3>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleRenameClick('semester', sem, selectedDepartment, selectedProgram, selectedYear); }}
                                                    className="p-1 text-slate-400 hover:text-emerald-600 transition-colors"
                                                    title="Rename Semester"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteHierarchy('semester', sem, selectedDepartment, selectedProgram, selectedYear); }}
                                                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                                    title="Delete Semester"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-500 text-sm mt-1">
                                            {sections.filter(s => s.department === selectedDepartment && s.program === selectedProgram && s.year === selectedYear && s.semester === sem).length} Sections
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {getSemesters(selectedDepartment, selectedProgram, selectedYear).length === 0 && (
                                <div className="col-span-full text-center py-10 text-slate-500 dark:text-slate-400">
                                    No semesters found for Year {selectedYear}.
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: Sections List & Form */}
                    {(viewMode === 'sections' || showForm) && (
                        <>

                            {showForm && (
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 animate-fade-in">
                                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{isEditing ? 'Edit Section' : 'Add New Section'}</h3>
                                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Department</label>
                                            <input type="text" name="department" value={formData.department} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Program</label>
                                            <input type="text" name="program" value={formData.program} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="e.g. B.Tech" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Year</label>
                                            <input type="text" name="year" value={formData.year} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="e.g. 1" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Semester</label>
                                            <input type="text" name="semester" value={formData.semester} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="e.g. 1" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Section Name</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" placeholder="A" />
                                        </div>
                                        <div className="md:col-span-5 flex justify-end mt-2">
                                            <button type="submit" className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition shadow-md">
                                                {isEditing ? 'Update Section' : 'Save Section'}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            {!showForm && viewMode === 'sections' && (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-400">
                                        <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 uppercase font-semibold text-xs border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                                <th className="px-6 py-4">Section Name</th>
                                                <th className="px-6 py-4 text-center">Manage Students</th>
                                                <th className="px-6 py-4 text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {getCurrentSections().map((section) => (
                                                <tr key={section.id} className="hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{section.name}</td>
                                                    <td className="px-6 py-4 text-center">
                                                        <div className="flex justify-center space-x-2">
                                                            <button
                                                                onClick={() => handleStudentUploadClick(section)}
                                                                className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-xs font-medium"
                                                                title="Upload Students"
                                                            >
                                                                <Upload size={14} className="mr-1.5" /> Upload
                                                            </button>
                                                            <button
                                                                onClick={() => handleDownload(section)}
                                                                className="flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors text-xs font-medium"
                                                                title="Download List"
                                                            >
                                                                <Download size={14} className="mr-1.5" /> Download
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex justify-end space-x-3">
                                                            <button onClick={() => handleEdit(section)} className="text-indigo-600 hover:text-indigo-900 transition-colors"><Edit size={18} /></button>
                                                            <button onClick={() => handleDelete(section.id)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 size={18} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                            {getCurrentSections().length === 0 && (
                                                <tr><td colSpan="3" className="px-6 py-8 text-center text-slate-400">No sections found for {selectedDepartment} - {selectedProgram} - Year {selectedYear} - Sem {selectedSemester}.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}

                    {/* Hidden Input for Student Upload */}
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleStudentFileChange}
                        accept=".csv, .xlsx"
                        className="hidden"
                    />

                    {/* Rename Modal */}
                    {renamingItem && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-xl w-full max-w-md mx-4 animate-scale-in border border-slate-200 dark:border-slate-800">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">
                                    Rename {renamingItem.type.charAt(0).toUpperCase() + renamingItem.type.slice(1)}
                                </h3>
                                <form onSubmit={handleRenameSubmit}>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-slate-600 mb-2">
                                            New Name
                                        </label>
                                        <input
                                            type="text"
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            className="w-full px-4 py-2 rounded-lg border border-slate-300 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setRenamingItem(null)}
                                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                                        >
                                            Save Changes
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SectionManagement;
