import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, X } from 'lucide-react';

const SafeSearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Select...",
    disabled = false,
    className = "",
    name = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const listRef = useRef(null);

    // Safe options handling - ensure it's always an array
    const safeOptions = Array.isArray(options) ? options : [];

    // Find selected option safely
    const selectedOption = safeOptions.find(opt => {
        const optValue = typeof opt === 'object' ? opt.value : opt;
        return String(optValue) === String(value);
    });

    const selectedLabel = selectedOption
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption)
        : "";

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelect = (option) => {
        const optValue = typeof option === 'object' ? option.value : option;

        // Mimic standard event for compatibility
        const event = {
            target: {
                name: name,
                value: optValue
            }
        };

        onChange(event);
        setIsOpen(false);
        setSearchTerm("");
    };

    const filteredOptions = safeOptions.filter((option) => {
        if (!option) return false;
        const label = typeof option === 'object' ? (option.label || "") : String(option);
        return label.toLowerCase().includes(searchTerm.toLowerCase());
    });

    useEffect(() => {
        setFocusedIndex(-1);
    }, [searchTerm]);

    useEffect(() => {
        if (isOpen && focusedIndex >= 0 && listRef.current) {
            const focusedItem = listRef.current.children[focusedIndex];
            if (focusedItem) {
                focusedItem.scrollIntoView({ block: 'nearest' });
            }
        }
    }, [focusedIndex, isOpen]);

    const handleKeyDown = (e) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex(prev => (prev < filteredOptions.length - 1 ? prev + 1 : prev));
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
                break;
            case 'Enter':
                e.preventDefault();
                if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                    handleSelect(filteredOptions[focusedIndex]);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setIsOpen(false);
                break;
            default:
                break;
        }
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                className={`w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${disabled ? 'bg-slate-100 dark:bg-slate-900/50 cursor-not-allowed opacity-75' : 'hover:border-indigo-300 dark:hover:border-indigo-500'}`}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                tabIndex={0}
                onKeyDown={handleKeyDown}
            >
                <span className={`block truncate ${!selectedLabel ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}>
                    {selectedLabel || placeholder}
                </span>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col animate-fade-in-up">
                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 sticky top-0">
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="overflow-y-auto flex-1 p-1" ref={listRef}>
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((option, index) => {
                                const optValue = typeof option === 'object' ? option.value : option;
                                const optLabel = typeof option === 'object' ? option.label : option;
                                const isSelected = String(optValue) === String(value);

                                return (
                                    <div
                                        key={`${optValue}-${index}`}
                                        className={`px-3 py-2 text-sm rounded-md cursor-pointer transition-colors 
                                            ${isSelected ? 'bg-indigo-50 text-indigo-700 font-medium' : ''}
                                            ${index === focusedIndex ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'}
                                        `}
                                        onClick={() => handleSelect(option)}
                                    >
                                        {optLabel}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="px-4 py-3 text-sm text-slate-400 text-center italic">
                                No options found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SafeSearchableSelect;
