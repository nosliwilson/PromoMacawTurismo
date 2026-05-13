import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RegistrationForm } from './components/RegistrationForm';
import { ScratchCard } from './components/ScratchCard';
import { AdminPanel } from './components/AdminPanel';
import { Instagram, Twitter, Globe, AlertCircle, CheckCircle2, Trophy, ArrowLeft } from 'lucide-react';
import confetti from 'canvas-confetti';

type Screen = 'form' | 'scratch' | 'result' | 'already-participated' | 'admin';

export default function App() {
  const [screen, setScreen] = useState<Screen>('form');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [prize, setPrize] = useState<string | null>(null);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      const data = await res.json();
      setSettings(data);
      
      // Apply theme
      if (data.theme) {
        document.documentElement.style.setProperty('--skz-red', data.theme.primaryColor || '#7B61FF');
        document.documentElement.style.setProperty('--skz-black', data.theme.backgroundColor || '#0D0D0D');
        document.documentElement.style.setProperty('--skz-dark', data.theme.darkBackgroundColor || '#1A1A1A');
        document.documentElement.style.setProperty('--skz-gray', data.theme.grayColor || '#2D2D2D');
        document.documentElement.style.setProperty('--skz-text', data.theme.textColor || '#FFFFFF');
        document.documentElement.style.setProperty('--skz-accent', data.theme.accentColor || '#FF4D4D');
      }
    } catch (err) {
      console.error('Failed to fetch settings');
    }
  };

  const getRandomPrize = (availablePrizes: any[]) => {
    const totalWeight = availablePrizes.reduce((sum, p) => sum + p.probability, 0);
    if (totalWeight <= 0) return availablePrizes[0]?.label || 'Brinde Surpresa';
    
    let random = Math.random() * totalWeight;
    
    for (const p of availablePrizes) {
      if (random < p.probability) return p.label;
      random -= p.probability;
    }
    return availablePrizes[0]?.label || 'Brinde Surpresa';
  };

  // FormData comes in dynamic now
  const handleRegistration = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Check if already participated (safe-check fields)
      let queryStr = ``;
      if (data.email) queryStr += `email=${encodeURIComponent(data.email)}&`;
      if (data.phone) queryStr += `phone=${encodeURIComponent(data.phone)}`;
      
      const checkRes = await fetch(`/api/participants/check?${queryStr}`);
      const checkData = await checkRes.json();

      if (checkData.participated) {
        setCurrentUser(checkData);
        setScreen('already-participated');
        return;
      }

      // 2. Prepare user
      setCurrentUser(data);

      // 3. Flow decision
      // Identify if there is a gate based on hasTicket field (it will be "Sim" from the select, or boolean true)
      const hasTicketField = data['hasTicket'];
      let getsScratchCard = true; // default to true if the field doesn't exist
      
      if (hasTicketField !== undefined) {
        if (hasTicketField === 'Não' || hasTicketField === false || hasTicketField === 'false') {
          getsScratchCard = false;
        }
      }

      if (getsScratchCard) {
        // Randomly pick a prize based on weights
        const randomPrize = getRandomPrize(settings?.prizes || []);
        setPrize(randomPrize);
        setScreen('scratch');
      } else {
        // Just register without prize
        await register(data, 'Nenhum (Sem Ingresso)');
        setScreen('result');
      }
    } catch (err) {
      setError('Ocorreu um erro. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: any, finalPrize: string) => {
    await fetch('/api/participants/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, prize: finalPrize }),
    });
  };

  const onScratchComplete = async () => {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#E11D48', '#000000', '#FFFFFF']
    });
    
    if (currentUser && prize) {
      await register(currentUser, prize);
      setTimeout(() => setScreen('result'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className={`mobile-container relative flex flex-col ${screen === 'admin' ? 'admin-expanded' : ''}`}>
        {/* Background Image Layer */}
        {settings?.theme?.bgImageUrl && (
          <div 
            className="absolute inset-0 bg-cover bg-bottom pointer-events-none z-0"
            style={{ 
              backgroundImage: `url(${settings.theme.bgImageUrl})`,
              opacity: (settings.theme.bgImageOpacity || 50) / 100
            }}
          />
        )}
        
        {/* Banner */}
        <div className="bg-[var(--skz-red)] text-white text-[9px] py-1 text-center font-bold tracking-widest leading-none uppercase z-10">
          {settings?.app?.name || 'DOMINATE THE WORLD TOUR'}
        </div>

        <main className="flex-grow overflow-y-auto overflow-x-hidden flex flex-col z-10">
          {/* Header */}
          {screen !== 'admin' && (
            <div className="p-6 text-center border-b border-[var(--skz-gray)]">
              <h1 className="text-2xl font-black text-[var(--skz-red)] tracking-[2px] uppercase mb-1">
                {settings?.app?.name ? settings.app.name.split(' ')[0] : 'STRAY KIDS'}
              </h1>
              <p className="text-[11px] text-white/70 uppercase tracking-widest">{settings?.app?.subtitle || 'Promoção Exclusiva - Ganhe seu Desconto'}</p>
            </div>
          )}

          <AnimatePresence mode="wait">
            {screen === 'form' && (
              <div key="form" className="flex-grow">
                <RegistrationForm onSubmit={handleRegistration} isLoading={loading} settings={settings} />
                <div className="text-center pb-4 opacity-40 text-[10px] uppercase tracking-tighter">
                  Somente uma participação por e-mail/telefone
                </div>
              </div>
            )}

            {screen === 'scratch' && (
              <motion.div 
                key="scratch"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full text-center p-6 space-y-6"
              >
                <div className="space-y-1">
                  <p className="text-xs text-white/50 uppercase tracking-widest">{settings?.texts?.scratchTitle || 'Validado!'}</p>
                  <p className="text-[11px] text-white/40">{settings?.texts?.scratchSubtitle || 'Válido apenas para portadores de ingresso'}</p>
                </div>
                <ScratchCard onComplete={onScratchComplete} prizeLabel={prize || ''} />
              </motion.div>
            )}

            {screen === 'result' && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full text-center p-8 space-y-6"
              >
                <div className="w-16 h-16 bg-[var(--skz-red)] rounded-full flex items-center justify-center mx-auto">
                  <Trophy className="w-8 h-8 text-white" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-bold uppercase italic">Parabéns, {currentUser?.socialName || currentUser?.name.split(' ')[0]}!</h2>
                  <p className="text-white/60 text-xs">Seu prêmio:</p>
                  <div className="text-2xl font-black text-[var(--skz-red)] tracking-tight uppercase italic">
                    {prize ? prize : "Confirmado!"}
                  </div>
                </div>
                <p className="text-[10px] text-white/40 uppercase leading-relaxed">
                  {settings?.texts?.successMessage || 'Apresente seu celular para validar o desconto.'}
                </p>
                <button 
                  onClick={() => setScreen('form')}
                  className="text-[var(--skz-red)] text-[10px] font-bold uppercase tracking-widest hover:underline"
                >
                  Voltar
                </button>
              </motion.div>
            )}

            {screen === 'already-participated' && (
              <motion.div 
                key="already"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full text-center p-8 space-y-6"
              >
                <AlertCircle className="w-12 h-12 text-[var(--skz-red)] mx-auto opacity-50" />
                <div className="space-y-2">
                  <div className="inline-block px-2 py-0.5 bg-[var(--skz-gray)] rounded-full text-[9px] uppercase font-bold text-white/60 mb-2">Já Participou</div>
                  <h2 className="text-lg font-bold uppercase italic">Olá, {currentUser?.name}!</h2>
                  <div className="p-4 bg-white/5 rounded border border-white/10">
                    <p className="text-[9px] text-white/30 uppercase mb-1">Prêmio Anterior:</p>
                    <p className="text-lg font-black text-[var(--skz-red)]">{currentUser?.prize}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setScreen('form')}
                  className="w-full py-3 bg-[var(--skz-gray)] text-white text-[11px] font-bold uppercase tracking-widest rounded transition-colors hover:bg-[#3d3d3d]"
                >
                  Entendido
                </button>
              </motion.div>
            )}

            {screen === 'admin' && (
              <motion.div key="admin" className="w-full scrollbar-hide flex-grow overflow-y-auto">
                <div className="p-4 flex items-center gap-2 border-b border-white/5">
                   <button onClick={() => setScreen('form')} className="text-white/40 hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] uppercase font-bold text-white/60">Configurações</span>
                </div>
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="m-4 p-3 bg-red-600/10 border border-red-600/20 rounded text-red-400 text-[10px] flex items-center gap-2 uppercase font-bold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" /> {error}
            </motion.div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-[var(--skz-black)] border-t border-[var(--skz-gray)] py-2 px-3 z-10 flex items-center justify-between">
          <div className="flex-1">
             <button 
              onDoubleClick={() => setScreen('admin')}
              className="text-[9px] uppercase font-black tracking-widest text-white/30 hover:text-white transition-colors text-left"
            >
              {settings?.app?.footerText || '© 2024 SKZ EXCURSÕES'}
            </button>
          </div>
          <div className="flex justify-end gap-2">
            {settings?.social?.instagram && (
              <a href={settings.social.instagram} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-[var(--skz-red)] hover:bg-white/10 transition-all">
                <Instagram className="w-3 h-3" />
              </a>
            )}
            {settings?.social?.twitter && (
              <a href={settings.social.twitter} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-[var(--skz-red)] hover:bg-white/10 transition-all">
                <Twitter className="w-3 h-3" />
              </a>
            )}
            {settings?.social?.website && (
              <a href={settings.social.website} target="_blank" rel="noopener noreferrer" className="w-6 h-6 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-[var(--skz-red)] hover:bg-white/10 transition-all">
                <Globe className="w-3 h-3" />
              </a>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
