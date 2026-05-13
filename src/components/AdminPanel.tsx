import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, RefreshCcw, QrCode, Settings, Users, Save, LogOut, Lock, Palette, Percent, Trophy, ArrowLeft } from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [tab, setTab] = useState<'qr' | 'settings' | 'participants'>('qr');
  const [adminData, setAdminData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const qrSize = 256;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      if (data.success) {
        setToken(data.token);
        setIsLoggedIn(true);
        fetchAdminData(data.token);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdminData = async (activeToken: string) => {
    try {
      const res = await fetch('/api/admin/data', {
        headers: { 'Authorization': activeToken }
      });
      const data = await res.json();
      setAdminData(data);
    } catch (err) {
      console.error(err);
    }
  };

  const saveConfig = async () => {
    setLoading(true);
    try {
      await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': token 
        },
        body: JSON.stringify(adminData.config)
      });
      alert('Configurações salvas!');
    } catch (err) {
      alert('Erro ao salvar');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    const svg = document.querySelector('svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = qrSize;
      canvas.height = qrSize;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = 'skz-promo-qr.png';
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (!isLoggedIn) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center space-y-2">
          <Lock className="w-12 h-12 text-[var(--skz-red)] mx-auto mb-2" />
          <h2 className="text-xl font-black uppercase italic">Admin Login</h2>
          <p className="text-white/40 text-xs">Acesso restrito ao organizador</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="text" 
            placeholder="Usuário" 
            className="skz-input" 
            value={username} 
            onChange={e => setUsername(e.target.value)} 
          />
          <input 
            type="password" 
            placeholder="Senha" 
            className="skz-input" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
          />
          {error && <p className="text-red-500 text-[10px] uppercase font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="skz-btn">ENTRAR</button>
        </form>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-[80vh] scrollbar-hide">
      {/* Tabs */}
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setTab('qr')} 
          className={`flex-1 py-3 text-[10px] uppercase tracking-tighter flex items-center justify-center gap-1 ${tab === 'qr' ? 'text-[var(--skz-red)] border-b-2 border-[var(--skz-red)]' : 'text-white/40'}`}
        >
          <QrCode className="w-3 h-3" /> QR
        </button>
        <button 
          onClick={() => setTab('settings')} 
          className={`flex-1 py-3 text-[10px] uppercase tracking-tighter flex items-center justify-center gap-1 ${tab === 'settings' ? 'text-[var(--skz-red)] border-b-2 border-[var(--skz-red)]' : 'text-white/40'}`}
        >
          <Settings className="w-3 h-3" /> Estilo
        </button>
        <button 
          onClick={() => setTab('participants')} 
          className={`flex-1 py-3 text-[10px] uppercase tracking-tighter flex items-center justify-center gap-1 ${tab === 'participants' ? 'text-[var(--skz-red)] border-b-2 border-[var(--skz-red)]' : 'text-white/40'}`}
        >
          <Users className="w-3 h-3" /> Inscritos
        </button>
      </div>

      <AnimatePresence mode="wait">
        {tab === 'qr' && (
          <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="bg-white p-4 rounded-xl flex justify-center shadow-inner">
              <QRCodeSVG value={currentUrl} size={qrSize} level="H" includeMargin={true} />
            </div>
            <button onClick={downloadQR} className="skz-btn flex items-center justify-center gap-2">
              <Download className="w-4 h-4" /> DOWNLOAD QR
            </button>
            <div className="p-3 bg-black/50 rounded-md border border-white/5">
              <p className="text-[9px] text-white/30 uppercase tracking-widest mb-1">Link de Destino</p>
              <p className="text-[var(--skz-red)] font-mono text-xs break-all">{currentUrl}</p>
            </div>
          </motion.div>
        )}

        {tab === 'settings' && adminData && (
          <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[var(--skz-red)]">
                <Palette className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Tema Visual</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="skz-label">Cor Primária</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.primaryColor} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, primaryColor: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Cor de Destaque</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.accentColor || '#FF4D4D'} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, accentColor: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Fundo Total</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.backgroundColor} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, backgroundColor: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Fundo Containers (Dark)</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.darkBackgroundColor || '#1A1A1A'} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, darkBackgroundColor: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Cinza (Inputs)</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.grayColor || '#2D2D2D'} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, grayColor: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Cor do Texto</label>
                  <input 
                    type="color" 
                    className="w-full h-8 cursor-pointer rounded overflow-hidden" 
                    value={adminData.config.theme.textColor || '#FFFFFF'} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, textColor: e.target.value}}})} 
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="skz-label">URL Imagem de Fundo (Opcional)</label>
                <input 
                  type="text" 
                  className="skz-input" 
                  placeholder="https://exemplo.com/fundo.jpg" 
                  value={adminData.config.theme.bgImageUrl} 
                  onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, bgImageUrl: e.target.value}}})} 
                />
              </div>

              {adminData.config.theme.bgImageUrl && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="skz-label">Opacidade da Imagem</label>
                    <span className="text-[10px] text-white/50">{adminData.config.theme.bgImageOpacity || 50}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[var(--skz-red)]" 
                    value={adminData.config.theme.bgImageOpacity || 50} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, theme: {...adminData.config.theme, bgImageOpacity: parseInt(e.target.value)}}})} 
                  />
                </div>
              )}

              <div className="flex items-center gap-2 text-[var(--skz-red)] mt-4">
                <Settings className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Textos do App</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="skz-label">Nome do App</label>
                  <input 
                    type="text" 
                    className="skz-input" 
                    value={adminData.config.app?.name || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, app: {...adminData.config.app, name: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Subtítulo</label>
                  <input 
                    type="text" 
                    className="skz-input" 
                    value={adminData.config.app?.subtitle || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, app: {...adminData.config.app, subtitle: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Texto do Rodapé</label>
                  <input 
                    type="text" 
                    className="skz-input" 
                    value={adminData.config.app?.footerText || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, app: {...adminData.config.app, footerText: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Mensagem Raspadinha (Título)</label>
                  <input 
                    type="text" 
                    className="skz-input" 
                    value={adminData.config.texts?.scratchTitle || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, texts: {...adminData.config.texts, scratchTitle: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Mensagem Raspadinha (Subtítulo)</label>
                  <input 
                    type="text" 
                    className="skz-input" 
                    value={adminData.config.texts?.scratchSubtitle || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, texts: {...adminData.config.texts, scratchSubtitle: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Mensagem Final (Sucesso)</label>
                  <textarea 
                    className="skz-input min-h-[60px] resize-y" 
                    value={adminData.config.texts?.successMessage || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, texts: {...adminData.config.texts, successMessage: e.target.value}}})} 
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[var(--skz-red)] mt-8">
                <Users className="w-4 h-4" />
                <h3 className="text-xs font-black uppercase tracking-widest">Redes Sociais</h3>
              </div>
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="skz-label">Instagram (URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://instagram.com/..."
                    className="skz-input" 
                    value={adminData.config.social?.instagram || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, social: {...adminData.config.social, instagram: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Twitter/X (URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://twitter.com/..."
                    className="skz-input" 
                    value={adminData.config.social?.twitter || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, social: {...adminData.config.social, twitter: e.target.value}}})} 
                  />
                </div>
                <div className="space-y-1">
                  <label className="skz-label">Website Oficial (URL)</label>
                  <input 
                    type="url" 
                    placeholder="https://sua-oficial.com"
                    className="skz-input" 
                    value={adminData.config.social?.website || ''} 
                    onChange={e => setAdminData({...adminData, config: {...adminData.config, social: {...adminData.config.social, website: e.target.value}}})} 
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-[var(--skz-red)] mt-8">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4" /> {/* Spacer */}
                  <h3 className="text-xs font-black uppercase tracking-widest">Campos do Formulário</h3>
                </div>
                <button 
                  onClick={() => {
                    const newFields = [...(adminData.config.formFields || []), { id: `field_${Date.now()}`, label: 'Novo Campo', type: 'text', placeholder: '', required: false, options: '' }];
                    setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                  }}
                  className="text-[10px] uppercase font-bold text-white hover:text-[var(--skz-red)] transition-colors"
                >
                  + Adicionar Campo
                </button>
              </div>
              
              <div className="space-y-3">
                <p className="text-[9px] text-white/40 uppercase mb-2">Para criar menus Dropdown (Seleção), defina o TIPO como SELECT e separe as OPÇÕES por vírgula. Note: Email e Telefone são importantes para a validação de únicos.</p>
                {(adminData.config.formFields || []).map((f: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 p-3 bg-white/5 border border-white/10 rounded-xl relative group hover:bg-white/10 transition-colors">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/50 uppercase">Rótulo / Nome</label>
                        <input 
                          type="text"
                          className="skz-input h-7 text-[10px]"
                          value={f.label}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].label = e.target.value;
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/50 uppercase">Identificador ID (sem espaços)</label>
                        <input 
                          type="text"
                          className="skz-input h-7 text-[10px] font-mono"
                          value={f.id}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].id = e.target.value.replace(/[^a-zA-Z0-9_-]/g, '');
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/50 uppercase">Tipo</label>
                        <select 
                          className="skz-input h-7 text-[10px] py-0 px-2"
                          value={f.type}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].type = e.target.value;
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        >
                          <option value="text">Texto Curto</option>
                          <option value="email">E-mail</option>
                          <option value="tel">Telefone (Num)</option>
                          <option value="select">Lista Dropdown</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/50 uppercase">Obrigatório</label>
                        <select 
                          className="skz-input h-7 text-[10px] py-0 px-2"
                          value={f.required ? 'yes' : 'no'}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].required = e.target.value === 'yes';
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        >
                          <option value="yes">Sim</option>
                          <option value="no">Não</option>
                        </select>
                      </div>
                    </div>
                    {f.type !== 'select' ? (
                      <div className="space-y-1 mt-1">
                        <label className="text-[9px] text-white/50 uppercase">Placeholder (Exemplo dentro do campo)</label>
                        <input 
                          type="text"
                          className="skz-input h-7 text-[10px]"
                          value={f.placeholder || ''}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].placeholder = e.target.value;
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        />
                      </div>
                    ) : (
                      <div className="space-y-1 mt-1">
                        <label className="text-[9px] text-white/50 uppercase">Opções do Dropdown (Separe por VÍRGULA)</label>
                        <input 
                          type="text"
                          className="skz-input h-7 text-[10px]"
                          placeholder="Sim,Não,Talvez"
                          value={f.options || ''}
                          onChange={e => {
                            const newFields = [...adminData.config.formFields];
                            newFields[idx].options = e.target.value;
                            setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                          }}
                        />
                      </div>
                    )}
                    <button 
                      onClick={() => {
                        if(confirm('Tem certeza que quer remover este campo?')) {
                          const newFields = [...adminData.config.formFields];
                          newFields.splice(idx, 1);
                          setAdminData({...adminData, config: {...adminData.config, formFields: newFields}});
                        }
                      }}
                      className="absolute top-3 right-3 text-[9px] text-rose-500 uppercase font-bold tracking-widest bg-rose-500/10 p-1.5 rounded hover:bg-rose-500 hover:text-white transition-colors"
                    >
                      X
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[var(--skz-red)] mt-8">
                <div className="flex items-center gap-2">
                  <Percent className="w-4 h-4" />
                  <h3 className="text-xs font-black uppercase tracking-widest">Prêmios do Sorteio</h3>
                </div>
                <button 
                  onClick={() => {
                    const newPrizes = [...adminData.config.prizes, { id: 'p' + Date.now(), label: 'Novo Prêmio', probability: 0 }];
                    setAdminData({...adminData, config: {...adminData.config, prizes: newPrizes}});
                  }}
                  className="text-[10px] uppercase font-bold text-white hover:text-[var(--skz-red)] transition-colors"
                >
                  + Adicionar
                </button>
              </div>
              
              <div className="space-y-3 bg-white/5 p-4 rounded-xl border border-white/10">
                {adminData.config.prizes.map((p: any, idx: number) => (
                  <div key={idx} className="flex flex-col gap-2 p-2 relative group hover:bg-white/5 rounded transition-colors">
                    <div className="flex gap-2">
                      <input 
                        type="text"
                        className="skz-input flex-grow h-8 text-[11px]"
                        value={p.label}
                        onChange={e => {
                          const newPrizes = [...adminData.config.prizes];
                          newPrizes[idx].label = e.target.value;
                          setAdminData({...adminData, config: {...adminData.config, prizes: newPrizes}});
                        }}
                      />
                      <div className="flex items-center gap-1 w-24">
                        <input 
                          type="number" 
                          className="skz-input flex-grow h-8" 
                          value={p.probability} 
                          onChange={e => {
                            const newPrizes = [...adminData.config.prizes];
                            newPrizes[idx].probability = parseInt(e.target.value) || 0;
                            setAdminData({...adminData, config: {...adminData.config, prizes: newPrizes}});
                          }} 
                        />
                        <span className="text-white/20 text-[10px]">%</span>
                      </div>
                    </div>
                    {adminData.config.prizes.length > 1 && (
                      <button 
                        onClick={() => {
                          const newPrizes = [...adminData.config.prizes];
                          newPrizes.splice(idx, 1);
                          setAdminData({...adminData, config: {...adminData.config, prizes: newPrizes}});
                        }}
                        className="text-[9px] text-rose-500 uppercase font-bold tracking-widest text-left"
                      >
                        REMOVER
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <button onClick={saveConfig} disabled={loading} className="skz-btn flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> SALVAR CONFIGS
            </button>
          </motion.div>
        )}

        {tab === 'participants' && adminData && (
          <motion.div key="participants" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pb-12">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-black/80 backdrop-blur-md p-3 rounded border border-[var(--skz-gray)] text-center">
                <span className="text-[9px] uppercase font-bold block opacity-40">Total</span>
                <span className="text-xl font-black text-[var(--skz-red)]">{adminData.participants.length}</span>
              </div>
              <div className="bg-black/80 backdrop-blur-md p-3 rounded border border-[var(--skz-gray)] text-center">
                <span className="text-[9px] uppercase font-bold block opacity-40">Com Ingresso</span>
                <span className="text-xl font-black text-rose-400">{adminData.participants.filter((p: any) => p.hasTicket).length}</span>
              </div>
            </div>
            <div className="space-y-2">
              {adminData.participants.map((p: any, idx: number) => (
                <div key={idx} className="p-3 bg-black/80 backdrop-blur-md rounded-md text-[10px] space-y-1 border border-[var(--skz-gray)]">
                  <div className="flex justify-between font-black uppercase italic">
                    <span className={p.hasTicket ? 'text-rose-400' : 'text-white'}>{p.socialName || p.name}</span>
                    <span className="text-white/40">{new Date(p.date).toLocaleDateString()}</span>
                  </div>
                  <div className="text-white/60">{p.email} | {p.phone}</div>
                  {p.hasTicket && (
                    <div className="pt-1 flex items-center gap-1.5 border-t border-[var(--skz-gray)] mt-1">
                      <Trophy className="w-2.5 h-2.5 text-yellow-500" />
                      <span className="uppercase tracking-widest font-black text-yellow-500">{p.prize}</span>
                    </div>
                  )}
                </div>
              ))}
              {adminData.participants.length === 0 && (
                <div className="text-center py-10 text-white/20 text-xs uppercase italic tracking-widest">Nenhum inscrito ainda</div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button onClick={() => setIsLoggedIn(false)} className="text-[9px] uppercase tracking-widest text-white/10 hover:text-white flex items-center gap-1 mx-auto mt-2">
        <LogOut className="w-3 h-3" /> SAIR DO PAINEL
      </button>
    </div>
  );
};
