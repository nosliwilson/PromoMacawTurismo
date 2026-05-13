import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

interface RegistrationFormProps {
  onSubmit: (data: any) => void;
  isLoading: boolean;
  settings: any;
}

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSubmit, isLoading, settings }) => {
  const [formData, setFormData] = useState<Record<string, any>>({});

  const fields = settings?.formFields || [];

  // Initialize fields
  useEffect(() => {
    if (fields.length > 0 && Object.keys(formData).length === 0) {
      const initial: Record<string, any> = {};
      fields.forEach((f: any) => {
        initial[f.id] = f.type === 'select' ? f.options?.split(',')[0] || '' : '';
      });
      setFormData(initial);
    }
  }, [fields, formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="space-y-4 w-full p-4"
    >
      <div className="text-center space-y-1 mb-6">
        <h2 className="text-2xl font-black text-[var(--skz-red)] tracking-widest uppercase italic">
          {settings?.app?.name || 'Loading...'}
        </h2>
        <p className="text-white/50 text-[10px] font-medium uppercase tracking-wider">{settings?.app?.subtitle || ''}</p>
      </div>

      <div className="space-y-3">
        {fields.map((field: any) => (
          <div key={field.id} className="space-y-1">
            <label className="skz-label">{field.label}</label>
            {field.type === 'select' ? (
              <select
                required={field.required}
                className="skz-input bg-[var(--skz-gray)]"
                value={formData[field.id] || ''}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              >
                {field.options?.split(',').map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <input
                required={field.required}
                type={field.type}
                placeholder={field.placeholder || ''}
                className="skz-input"
                value={formData[field.id] || ''}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              />
            )}
          </div>
        ))}
      </div>

      <button
        disabled={isLoading}
        type="submit"
        className={cn(
          "skz-btn mt-4",
          isLoading && "animate-pulse"
        )}
      >
        {isLoading ? "Processando..." : (
          <>
            Validar e Avançar
          </>
        )}
      </button>
    </motion.form>
  );
};
