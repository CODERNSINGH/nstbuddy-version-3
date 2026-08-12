import React from 'react';
import { Phone, MessageCircle, Mail } from 'lucide-react';
import { ContactMethod } from '../../services/api';

interface ContactFormProps {
    contactMethod: ContactMethod;
    contactValue: string;
    onMethodChange: (method: ContactMethod) => void;
    onValueChange: (value: string) => void;
}

const METHODS: Array<{ value: ContactMethod; label: string; icon: React.ElementType; placeholder: string }> = [
    { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, placeholder: '+91 98765 43210' },
    { value: 'phone', label: 'Phone', icon: Phone, placeholder: '+91 98765 43210' },
    { value: 'email', label: 'Email', icon: Mail, placeholder: 'you@example.com' },
];

const ContactForm: React.FC<ContactFormProps> = ({ contactMethod, contactValue, onMethodChange, onValueChange }) => {
    const active = METHODS.find((m) => m.value === contactMethod) ?? METHODS[0];

    return (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">
                How should the group reach you?
            </label>
            <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1 mb-2 w-fit">
                {METHODS.map((m) => (
                    <button
                        key={m.value}
                        type="button"
                        onClick={() => onMethodChange(m.value)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                            contactMethod === m.value ? 'bg-white shadow-sm text-emerald-700' : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        <m.icon className="w-3.5 h-3.5" /> {m.label}
                    </button>
                ))}
            </div>
            <input
                type={contactMethod === 'email' ? 'email' : 'tel'}
                value={contactValue}
                onChange={(e) => onValueChange(e.target.value)}
                placeholder={active.placeholder}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors"
            />
            <p className="text-[11px] text-gray-400 mt-1.5">
                Only visible to the group admin and to you - not shown to other members.
            </p>
        </div>
    );
};

export default ContactForm;
