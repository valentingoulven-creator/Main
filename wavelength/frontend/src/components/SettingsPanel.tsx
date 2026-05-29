import { useState } from 'react';
import {
  X, LogOut, Users, Gift, Info, Shield, Settings,
  ChevronRight, Copy, Check, ExternalLink,
  Bell, Moon, Globe, Heart
} from 'lucide-react';
import type { BlockedUser } from '../utils/profileStorage';
import { MeloSongMark } from './MeloSongLogo';

type Section = 'main' | 'settings' | 'legal' | 'referral' | 'blocked' | 'about';

interface Props {
  username: string;
  email: string;
  referralCode: string;
  blockedUsers: BlockedUser[];
  onUnblock: (id: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onClose: () => void;
  radius: number;
  onRadiusChange: (r: number) => void;
}

export default function SettingsPanel({ username, email, referralCode, blockedUsers, onUnblock, onLogout, onDeleteAccount, onClose, radius, onRadiusChange }: Props) {
  const [section, setSection] = useState<Section>('main');
  const [copied, setCopied]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // App settings state (persisted locally)
  const [notifs,  setNotifs]  = useState(() => localStorage.getItem('melo_notifs')  !== 'off');
  const [darkMap, setDarkMap] = useState(() => localStorage.getItem('melo_darkmap') !== 'off');

  function copyReferral() {
    const text = `Rejoins-moi sur MeloSong ! 🎵\nUtilise mon code de parrainage : ${referralCode}\nhttps://melosong.app/invite/${referralCode}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2500); });
  }

  function toggleNotifs() {
    const next = !notifs; setNotifs(next);
    localStorage.setItem('melo_notifs', next ? 'on' : 'off');
  }
  function toggleDarkMap() {
    const next = !darkMap; setDarkMap(next);
    localStorage.setItem('melo_darkmap', next ? 'on' : 'off');
  }

  return (
    <div className="fixed inset-0 z-[800] flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="w-full max-w-sm rounded-3xl overflow-hidden animate-slide-up"
        style={{ background: 'rgba(14,14,24,0.99)', border: '1px solid rgba(255,255,255,0.12)', maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {section !== 'main' ? (
            <button onClick={() => setSection('main')} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
              <ChevronRight className="w-4 h-4 text-white/50 rotate-180" />
            </button>
          ) : (
            <div className="w-7 h-7 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white/50" />
            </div>
          )}
          <span className="text-sm font-bold text-white flex-1">
            {section === 'main'     && 'Paramètres'}
            {section === 'settings' && 'Paramètres de l\'app'}
            {section === 'legal'    && 'Mentions légales'}
            {section === 'referral' && 'Parrainer des amis'}
            {section === 'blocked'  && 'Personnes bloquées'}
            {section === 'about'    && 'À propos'}
          </span>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 65px)' }}>

          {/* ── Main menu ──────────────────────────────────────────────────── */}
          {section === 'main' && (
            <div className="p-4 space-y-1.5">
              {/* Account info */}
              <div className="px-4 py-3 rounded-2xl mb-3"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-sm font-bold text-white">{username}</div>
                <div className="text-xs text-white/40 mt-0.5">{email}</div>
              </div>

              <MenuItem icon={<Settings className="w-4 h-4" />} color="#8b5cf6" label="Paramètres de l'app" sub="Notifications, carte, confidentialité" onClick={() => setSection('settings')} />
              <MenuItem icon={<Gift className="w-4 h-4" />}     color="#ec4899" label="Parrainer des amis"  sub={`Ton code : ${referralCode}`}              onClick={() => setSection('referral')} />
              <MenuItem icon={<Users className="w-4 h-4" />}    color="#ef4444" label="Personnes bloquées" sub={blockedUsers.length ? `${blockedUsers.length} personne${blockedUsers.length > 1 ? 's' : ''}` : 'Aucune'} onClick={() => setSection('blocked')} />
              <MenuItem icon={<Shield className="w-4 h-4" />}   color="#f59e0b" label="Mentions légales"   sub="CGU, Confidentialité, Cookies"             onClick={() => setSection('legal')} />
              <MenuItem icon={<Info className="w-4 h-4" />}     color="#06b6d4" label="À propos"           sub="Version, équipe, open-source"              onClick={() => setSection('about')} />

              {/* Divider */}
              <div className="my-3" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }} />

              {/* Support */}
              <button onClick={() => { /* open donate */ onClose(); }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:opacity-90 active:scale-[0.99]"
                style={{ background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(236,72,153,0.15))', border: '1px solid rgba(139,92,246,0.2)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm font-bold gradient-text">Soutenir MeloSong</div>
                  <div className="text-xs text-white/40">L'app reste gratuite grâce à toi 💜</div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30" />
              </button>

              {/* Logout */}
              <button onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all hover:bg-red-500/10 active:scale-[0.99] mt-2"
                style={{ border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.12)' }}>
                  <LogOut className="w-4 h-4 text-red-400" />
                </div>
                <span className="flex-1 text-sm font-semibold text-red-400 text-left">Se déconnecter</span>
              </button>

              {/* Delete account */}
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)}
                  className="w-full text-center text-xs text-white/20 hover:text-red-400/60 transition-colors py-2">
                  Supprimer mon compte
                </button>
              ) : (
                <div className="flex items-center gap-2 p-3 rounded-2xl animate-fade-in"
                  style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <p className="flex-1 text-xs text-red-300">Supprimer définitivement ?</p>
                  <button onClick={onDeleteAccount}
                    className="text-xs px-3 py-1.5 rounded-xl bg-red-500 text-white font-bold">Oui</button>
                  <button onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 rounded-xl text-white/50 hover:bg-white/10">Non</button>
                </div>
              )}
            </div>
          )}

          {/* ── App settings ──────────────────────────────────────────────── */}
          {section === 'settings' && (
            <div className="p-4 space-y-3">
              <ToggleRow icon={<Bell className="w-4 h-4" />} color="#8b5cf6"
                label="Notifications" sub="Alertes de chat et de live"
                value={notifs} onChange={toggleNotifs} />
              <ToggleRow icon={<Moon className="w-4 h-4" />} color="#3b82f6"
                label="Carte sombre" sub="Fond de carte bleu nuit"
                value={darkMap} onChange={toggleDarkMap} />
              <ToggleRow icon={<Globe className="w-4 h-4" />} color="#10b981"
                label="Partage de position" sub="Visible par les gens proches"
                value={true} onChange={() => {}} />

              {/* Radius */}
              <div className="px-4 py-3 rounded-2xl"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(6,182,212,0.2)', color: '#06b6d4' }}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">Rayon de recherche</div>
                    <div className="text-xs" style={{ color: '#06b6d4' }}>
                      {radius < 1000 ? `${radius} m` : `${(radius/1000).toFixed(radius % 1000 === 0 ? 0 : 1)} km`}
                    </div>
                  </div>
                </div>
                <input type="range" min={50} max={5000} step={50}
                  value={radius}
                  onChange={e => onRadiusChange(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer mb-2"
                  style={{
                    accentColor: '#06b6d4',
                    background: `linear-gradient(to right, #06b6d4 ${(radius / 5000) * 100}%, rgba(255,255,255,0.15) ${(radius / 5000) * 100}%)`,
                  }}
                />
                <div className="flex gap-1">
                  {[500, 1000, 5000].map(v => (
                    <button key={v} onClick={() => onRadiusChange(v)}
                      className="flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all"
                      style={radius === v
                        ? { background: '#06b6d4', color: '#fff' }
                        : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                      {v < 1000 ? `${v}m` : `${v/1000}km`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2 p-3 rounded-xl text-xs text-white/30"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                Les paramètres sont sauvegardés automatiquement sur cet appareil.
              </div>
            </div>
          )}

          {/* ── Legal ─────────────────────────────────────────────────────── */}
          {section === 'legal' && (
            <div className="p-4 space-y-2">
              {[
                { label: 'Conditions Générales d\'Utilisation', icon: '📋' },
                { label: 'Politique de Confidentialité',        icon: '🔒' },
                { label: 'Politique des Cookies',               icon: '🍪' },
                { label: 'Licences open-source',                icon: '⚖️' },
                { label: 'Nous contacter',                      icon: '✉️' },
              ].map(({ label, icon }) => (
                <button key={label}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:bg-white/5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <span className="text-lg w-6 text-center flex-shrink-0">{icon}</span>
                  <span className="flex-1 text-sm text-white/80">{label}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-white/25 flex-shrink-0" />
                </button>
              ))}
              <div className="mt-4 text-center text-xs text-white/20">
                © 2026 MeloSong. Tous droits réservés.
              </div>
            </div>
          )}

          {/* ── Referral ──────────────────────────────────────────────────── */}
          {section === 'referral' && (
            <div className="p-5">
              {/* Hero */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="text-4xl mb-2">🎁</div>
                <div className="text-base font-black gradient-text mb-1">Parraine tes amis</div>
                <p className="text-xs text-white/45 leading-relaxed">
                  Invite des amis sur MeloSong et gagne des avantages exclusifs pour chaque personne qui s'inscrit.
                </p>
              </div>

              {/* Code */}
              <div className="rounded-2xl p-4 mb-4 text-center"
                style={{ background: 'rgba(139,92,246,0.1)', border: '1.5px dashed rgba(139,92,246,0.4)' }}>
                <div className="text-xs text-white/40 mb-1">Ton code de parrainage</div>
                <div className="text-2xl font-black tracking-widest gradient-text">{referralCode}</div>
              </div>

              <button onClick={copyReferral}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 transition-all active:scale-95 mb-3"
                style={{ background: copied ? 'rgba(16,185,129,0.8)' : 'linear-gradient(135deg, #8b5cf6, #ec4899)' }}>
                {copied ? <><Check className="w-4 h-4" /> Lien copié !</> : <><Copy className="w-4 h-4" /> Copier le lien d'invitation</>}
              </button>

              {/* Avantages */}
              <div className="space-y-2">
                {[
                  { icon: '⭐', text: 'Badge "Ambassadeur" sur ton profil' },
                  { icon: '🎵', text: '1 mois de fonctionnalités premium' },
                  { icon: '💜', text: 'Apparais en tête des résultats proches' },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-2.5 text-xs text-white/50 px-2">
                    <span className="text-base flex-shrink-0">{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Blocked ───────────────────────────────────────────────────── */}
          {section === 'blocked' && (
            <div className="p-4">
              {blockedUsers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-center">
                  <Users className="w-10 h-10 text-white/15 mb-1" />
                  <div className="text-sm text-white/40">Aucune personne bloquée</div>
                  <div className="text-xs text-white/25">Les personnes bloquées n'apparaissent plus dans ta liste</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {blockedUsers.map(u => (
                    <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: u.color }}>{u.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-white truncate">{u.username}</div>
                        <div className="text-xs text-white/30">Bloqué le {new Date(u.blockedAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <button onClick={() => onUnblock(u.id)}
                        className="text-xs px-3 py-1.5 rounded-xl font-semibold text-white/60 hover:text-white hover:bg-white/10 transition-all">
                        Débloquer
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── About ─────────────────────────────────────────────────────── */}
          {section === 'about' && (
            <div className="p-5">
              <div className="flex flex-col items-center mb-5">
                <MeloSongMark size={64} className="mb-3" />
                <div className="text-xl font-black gradient-text">MeloSong</div>
                <div className="text-xs text-white/40 mt-1">Version 1.0.0 · Build 2026.05</div>
              </div>

              <div className="space-y-2 mb-5">
                {[
                  { label: 'Développé avec', value: 'React · TypeScript · Socket.io · Leaflet' },
                  { label: 'Backend',         value: 'Node.js · Express · Socket.io' },
                  { label: 'Cartes',          value: 'OpenStreetMap · CARTO' },
                  { label: 'Licences',        value: 'MIT · Voir mentions légales' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex items-start justify-between gap-3 text-xs px-1">
                    <span className="text-white/40 flex-shrink-0">{label}</span>
                    <span className="text-white/70 text-right">{value}</span>
                  </div>
                ))}
              </div>

              <div className="text-center text-xs text-white/25 leading-relaxed">
                Fait avec 💜 pour les amateurs de musique.<br />
                Partage ta vibe, découvre celle des autres.
              </div>

              <div className="flex items-center justify-center gap-4 mt-4">
                {['🐦 Twitter', '📸 Instagram', '💻 GitHub'].map(s => (
                  <button key={s} className="text-xs text-white/25 hover:text-white/60 transition-colors">{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MenuItem({ icon, color, label, sub, onClick }: { icon: React.ReactNode; color: string; label: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all hover:bg-white/5 active:scale-[0.99]"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/40 mt-0.5 truncate">{sub}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-white/25 flex-shrink-0" />
    </button>
  );
}

function ToggleRow({ icon, color, label, sub, value, onChange }: { icon: React.ReactNode; color: string; label: string; sub: string; value: boolean; onChange: () => void }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl"
      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: color + '20', color }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="text-xs text-white/40">{sub}</div>
      </div>
      <button onClick={onChange}
        className="w-11 h-6 rounded-full relative transition-all duration-200 flex-shrink-0"
        style={{ background: value ? color : 'rgba(255,255,255,0.15)' }}>
        <div className="absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
          style={{ left: value ? 24 : 4 }} />
      </button>
    </div>
  );
}
