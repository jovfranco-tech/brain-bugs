import React, { useState } from 'react';
import BugSvg from '../components/BugSvg';
import { useApp } from '../contexts/AppContext';
import type { AvatarId, BugKind, ChildProfile } from '../types';

const AVATARS: { id: AvatarId; bg: string; emoji: string }[] = [
  { id:'buzzy', bg:'#FFD55E', emoji:'🐝' },
  { id:'pip',   bg:'#3FD09E', emoji:'🐛' },
  { id:'bobo',  bg:'#8E6BFF', emoji:'🦋' },
  { id:'zig',   bg:'#FFC83D', emoji:'🐞' },
  { id:'mo',    bg:'#5BC5FF', emoji:'🦗' },
  { id:'rose',  bg:'#FF6FA8', emoji:'🌸' },
];
const AVATAR_MAP = Object.fromEntries(AVATARS.map(a => [a.id, a]));
const COMPANIONS: { kind: BugKind; label: string }[] = [
  { kind:'pip',   label:'Pip'   },
  { kind:'bobo',  label:'Bobo'  },
  { kind:'zig',   label:'Zig'   },
  { kind:'mo',    label:'Mo'    },
  { kind:'rose',  label:'Rose'  },
  { kind:'coach', label:'Coach' },
];

interface ProfileFormProps {
  initial?: Partial<ChildProfile>;
  onSave: (data: { nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange: string; themeColor: 'purple' | 'blue' | 'yellow' | 'green' }) => void;
  onCancel: () => void;
  saveLabel?: string;
}

function ProfileForm({ initial, onSave, onCancel, saveLabel }: ProfileFormProps) {
  const { t } = useApp();
  const [nickname,     setNickname]    = useState(initial?.nickname ?? '');
  const [avatarId,     setAvatarId]    = useState<AvatarId>(initial?.avatarId ?? 'buzzy');
  const [bugCompanion, setBugCompanion] = useState<BugKind>(initial?.bugCompanion ?? 'pip');
  const [ageRange,     setAgeRange]    = useState(initial?.ageRange ?? '7-8');
  const [themeColor,   setThemeColor]  = useState<'purple' | 'blue' | 'yellow' | 'green'>(initial?.themeColor ?? 'purple');
  const [error,        setError]       = useState('');

  const activeSaveLabel = saveLabel || `${t('play')} 🚀`;

  const inputStyle = {
    fontFamily:'"Nunito",system-ui', background:'#F6F4FB',
    boxShadow:'inset 0 2px 4px rgba(35,19,71,0.06)',
  };

  return (
    <div className="flex flex-col gap-4 text-left">
      {/* Nickname */}
      <div>
        <label className="block text-xs font-bold text-ink/50 uppercase tracking-wide mb-1.5"
          style={{fontFamily:'"Nunito",system-ui'}}>{t('childNicknameLabel')}</label>
        <input type="text" value={nickname} onChange={e => setNickname(e.target.value)}
          placeholder={t('childNicknamePlaceholder')} maxLength={18}
          className="w-full px-4 py-3 rounded-2xl text-ink font-bold outline-none focus:ring-2 focus:ring-grape text-base"
          style={inputStyle}/>
      </div>

      {/* Age */}
      <div>
        <label className="block text-xs font-bold text-ink/50 uppercase tracking-wide mb-1.5"
          style={{fontFamily:'"Nunito",system-ui'}}>{t('childAgeRangeLabel')}</label>
        <div className="flex gap-2">
          {(['5-6','7-8','9+'] as const).map(a => (
            <button key={a} type="button" onClick={() => setAgeRange(a)}
              className="flex-1 py-2 rounded-2xl text-sm font-bold transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{
                fontFamily:'"Fredoka",system-ui',
                background: ageRange===a ? '#8E6BFF' : '#F0EEF6',
                color: ageRange===a ? '#fff' : '#231347',
                boxShadow: ageRange===a ? '0 3px 0 #5A3BD1' : '0 2px 0 rgba(35,19,71,0.1)',
              }}>
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Color */}
      <div>
        <label className="block text-xs font-bold text-ink/50 uppercase tracking-wide mb-1.5"
          style={{fontFamily:'"Nunito",system-ui'}}>{t('childThemeColorLabel')}</label>
        <div className="flex gap-2.5 justify-between">
          {[
            { id: 'purple', bg: '#8E6BFF', name: t('childThemeColorPurple') },
            { id: 'blue', bg: '#5BC5FF', name: t('childThemeColorBlue') },
            { id: 'yellow', bg: '#FFC83D', name: t('childThemeColorYellow') },
            { id: 'green', bg: '#3FD09E', name: t('childThemeColorGreen') },
          ].map(c => {
            const active = themeColor === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setThemeColor(c.id as any)}
                className="flex-1 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 border focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
                style={{
                  background: c.bg,
                  borderColor: active ? '#231347' : 'transparent',
                  borderWidth: active ? '3px' : '1px',
                  boxShadow: active ? '0 0 8px rgba(35,19,71,0.2)' : '0 3px 0 rgba(35,19,71,0.15)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                }}
                title={c.name}
                aria-label={c.name}
              >
                {active && <span className="text-white font-extrabold text-xs">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-xs font-bold text-ink/50 uppercase tracking-wide mb-1.5"
          style={{fontFamily:'"Nunito",system-ui'}}>{t('childAvatarLabel')}</label>
        <div className="flex gap-2 justify-between">
          {AVATARS.map(av => (
            <button key={av.id} type="button" onClick={() => setAvatarId(av.id)}
              className="flex-1 h-13 rounded-2xl text-xl flex items-center justify-center transition-all active:scale-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-400"
              style={{
                height:52, background:av.bg, fontSize:22,
                boxShadow: avatarId===av.id
                  ? `0 4px 0 rgba(0,0,0,0.18), 0 0 0 3px #231347` : '0 3px 0 rgba(35,19,71,0.15)',
                transform: avatarId===av.id ? 'scale(1.12)' : 'scale(1)',
              }}
              aria-label={`Avatar ${av.emoji}`}
            >
              {av.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Bug companion */}
      <div>
        <label className="block text-xs font-bold text-ink/50 uppercase tracking-wide mb-1.5"
          style={{fontFamily:'"Nunito",system-ui'}}>{t('childCompanionLabel')}</label>
        <div className="grid grid-cols-3 gap-2">
          {COMPANIONS.map(c => (
            <button key={c.kind} type="button" onClick={() => setBugCompanion(c.kind)}
              className="flex flex-col items-center gap-0.5 py-2 rounded-2xl transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{
                background: bugCompanion===c.kind ? '#F0EEF6' : 'transparent',
                border: bugCompanion===c.kind ? '2px solid #8E6BFF' : '2px solid transparent',
              }}
              aria-label={`Compañero ${c.label}`}
            >
              <BugSvg kind={c.kind} size={44}/>
              <span className="text-xs font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>{c.label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-500 text-sm font-bold mb-3" style={{fontFamily:'"Nunito",system-ui'}}>{error}</p>}

      <div className="flex gap-2 mt-2">
        <button type="button" onClick={onCancel}
          className="flex-1 py-3 rounded-2xl font-bold text-ink/60 text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-400"
          style={{background:'#F0EEF6', fontFamily:'"Fredoka",system-ui'}}>
          {t('childCancelBtn')}
        </button>
        <button type="button" onClick={() => {
          if (!nickname.trim()) { setError(t('childProfileError')); return; }
          onSave({ nickname: nickname.trim(), avatarId, bugCompanion, ageRange, themeColor });
        }}
          className="flex-[2] py-3 rounded-2xl text-ink font-bold text-base active:scale-95 focus:outline-none focus:ring-2 focus:ring-yellow-400"
          style={{background:'linear-gradient(180deg,#FFD55E,#FFB23A)', fontFamily:'"Fredoka",system-ui', boxShadow:'0 5px 0 #B97808', color:'#231347'}}>
          {activeSaveLabel}
        </button>
      </div>
    </div>
  );
}

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/55 backdrop-blur-sm"
      onClick={onClose}>
      <div className="w-full max-w-[430px] bg-white rounded-t-3xl p-5 pb-10 shadow-2xl relative animate-slide-up"
        style={{ maxHeight:'92vh', overflowY:'auto' }}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="w-10 h-1 rounded-full bg-ink/20 mx-auto mb-4"/>
        <h3 className="text-xl font-bold text-ink mb-4 text-center" style={{fontFamily:'"Fredoka",system-ui'}}>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function ResetConfirm({ childName, onConfirm, onCancel }: { childName: string; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useApp();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" role="alertdialog" aria-modal="true">
      <div className="w-full max-w-xs bg-white rounded-3xl p-6 text-center" style={{boxShadow:'0 20px 40px rgba(35,19,71,0.25)'}}>
        <div className="text-4xl mb-3" aria-hidden="true">⚠️</div>
        <h3 className="text-lg font-bold text-ink mb-2" style={{fontFamily:'"Fredoka",system-ui'}}>{t('childResetConfirmTitle')}</h3>
        <p className="text-sm text-ink/60 font-semibold mb-5 leading-relaxed" style={{fontFamily:'"Nunito",system-ui'}}>
          {t('childResetConfirmDesc').replace('{name}', childName)}
        </p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 py-3 rounded-2xl font-bold text-ink bg-gray-100 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-300"
            style={{fontFamily:'"Fredoka",system-ui'}}>{t('childCancelBtn')}</button>
          <button onClick={onConfirm} className="flex-1 py-3 rounded-2xl font-bold text-white bg-red-500 active:scale-95 focus:outline-none focus:ring-2 focus:ring-red-400"
            style={{fontFamily:'"Fredoka",system-ui', boxShadow:'0 4px 0 #B02020'}}>{t('childResetBtn')}</button>
        </div>
      </div>
    </div>
  );
}

export default function ChildSelector() {
  const { parent, children, selectChild, signOut, createChildProfile, editChildProfile, deleteChildProfile, resetChildProgress, t } = useApp();
  const [modal, setModal] = useState<'create'|'edit'|'options'|null>(null);
  const [editTarget, setEditTarget] = useState<ChildProfile | null>(null);
  const [showReset, setShowReset] = useState(false);

  const handleCreate = (data: { nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange: string; themeColor: 'purple' | 'blue' | 'yellow' | 'green' }) => {
    const child = createChildProfile(data);
    setModal(null);
    selectChild(child.id);
  };

  const handleEdit = (data: { nickname: string; avatarId: AvatarId; bugCompanion: BugKind; ageRange: string; themeColor: 'purple' | 'blue' | 'yellow' | 'green' }) => {
    if (!editTarget) return;
    editChildProfile(editTarget.id, { ...data, ageRange: data.ageRange as ChildProfile['ageRange'] });
    setModal(null); setEditTarget(null);
  };

  const handleDelete = () => {
    if (!editTarget) return;
    deleteChildProfile(editTarget.id);
    setModal(null); setEditTarget(null);
  };

  const handleReset = () => {
    if (!editTarget) return;
    resetChildProgress(editTarget.id);
    setShowReset(false); setModal(null); setEditTarget(null);
  };

  const hasChildren = children.length > 0;

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{background:'linear-gradient(180deg,#EDE8FF 0%,#FFF7EA 100%)'}}>
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 pt-14 pb-6">
        {/* Header */}
        <div className="text-center mb-7">
          <div className="text-4xl mb-2" role="img" aria-label="Family">👨‍👩‍👧‍👦</div>
          <h2 className="text-3xl font-bold text-ink animate-fade-in" style={{fontFamily:'"Fredoka",system-ui'}}>
            {hasChildren ? t('childSelectTitle') : t('childSelectWelcome')}
          </h2>
          <p className="text-ink/55 text-sm font-semibold mt-1" style={{fontFamily:'"Nunito",system-ui'}}>
            {hasChildren
              ? t('childSelectChoose').replace('{name}', parent?.displayName || '')
              : t('childSelectCreateFirst').replace('{name}', parent?.displayName || '')}
          </p>
        </div>

        {/* Empty state */}
        {!hasChildren && (
          <div className="flex flex-col items-center gap-4 py-6 px-4 mb-6 rounded-3xl border-2 border-dashed border-grape/30"
            style={{background:'rgba(142,107,255,0.04)'}}>
            <div className="text-5xl" role="img" aria-label="Little Caterpillar">🐛</div>
            <div className="text-center">
              <p className="font-bold text-ink text-lg" style={{fontFamily:'"Fredoka",system-ui'}}>{t('childNoProfiles')}</p>
              <p className="text-sm text-ink/55 mt-1" style={{fontFamily:'"Nunito",system-ui'}}>
                {t('childAddFirstProfile')}
              </p>
            </div>
          </div>
        )}

        {/* Child cards */}
        <div className="flex flex-col gap-3 mb-5" role="list">
          {children.map(child => {
            const av = AVATAR_MAP[child.avatarId] ?? AVATAR_MAP.buzzy;
            return (
              <div key={child.id} role="listitem" className="flex items-center gap-4 p-4 rounded-3xl bg-white relative overflow-hidden transition-all hover:translate-y-[-2px] hover:shadow-lg"
                style={{boxShadow:'0 6px 0 rgba(35,19,71,0.12)'}}>
                {/* Colored left accent */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-3xl" style={{background:av.bg}}/>

                <button onClick={() => selectChild(child.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-2xl p-1"
                  aria-label={`Jugar como ${child.nickname}, ${child.totalStars} ${t('childStarsCount')}, ${t('childLevelCount')} ${child.currentLevel}`}
                >
                  <div className="w-16 h-16 rounded-2xl text-3xl flex items-center justify-center flex-shrink-0"
                    style={{background:av.bg, boxShadow:'0 3px 0 rgba(35,19,71,0.15)', fontSize:28}}>
                    {av.emoji}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xl font-bold text-ink" style={{fontFamily:'"Fredoka",system-ui'}}>{child.nickname}</div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm" role="img" aria-label="Star">⭐</span>
                      <span className="text-xs font-bold text-ink/55" style={{fontFamily:'"Nunito",system-ui'}}>
                        {child.totalStars} {t('childStarsCount')}
                      </span>
                      <span className="text-ink/25 text-xs" aria-hidden="true">·</span>
                      <span className="text-xs font-bold text-ink/55" style={{fontFamily:'"Nunito",system-ui'}}>
                        {t('childLevelCount')} {child.currentLevel}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Edit button */}
                <button
                  onClick={() => { setEditTarget(child); setModal('options'); }}
                  aria-label={`${t('childEditProfileBtn')} - ${child.nickname}`}
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  style={{background:'#F6F4FB', boxShadow:'0 2px 0 rgba(35,19,71,0.08)'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="5" r="1.5" fill="#8E6BFF"/>
                    <circle cx="12" cy="12" r="1.5" fill="#8E6BFF"/>
                    <circle cx="12" cy="19" r="1.5" fill="#8E6BFF"/>
                  </svg>
                </button>
              </div>
            );
          })}
        </div>

        {/* Add child */}
        <button onClick={() => setModal('create')}
          className="w-full py-4 rounded-3xl font-bold text-grape text-lg active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-purple-400"
          style={{
            fontFamily:'"Fredoka",system-ui',
            background:'rgba(142,107,255,0.06)',
            border:'2px dashed rgba(142,107,255,0.3)',
          }}>
          {t('childAddProfileBtn')}
        </button>
      </div>

      {/* Sign out */}
      <div className="px-5 pb-8 flex justify-center">
        <button onClick={signOut} className="text-sm text-ink/35 font-bold underline focus:outline-none focus:text-ink/60"
          style={{fontFamily:'"Nunito",system-ui'}}>
          {t('childSignOutBtn').replace('{email}', parent?.email || '')}
        </button>
      </div>

      {/* Create modal */}
      {modal === 'create' && (
        <BottomSheet title={t('childNewProfileTitle')} onClose={() => setModal(null)}>
          <ProfileForm onSave={handleCreate} onCancel={() => setModal(null)}/>
        </BottomSheet>
      )}

      {/* Options sheet */}
      {modal === 'options' && editTarget && (
        <BottomSheet title={t('childEditProfileOptions').replace('{name}', editTarget.nickname)} onClose={() => { setModal(null); setEditTarget(null); }}>
          <div className="flex flex-col gap-3">
            <button onClick={() => setModal('edit')}
              className="flex items-center gap-3 p-4 rounded-2xl text-left active:scale-98 focus:outline-none focus:ring-2 focus:ring-purple-400"
              style={{background:'#F6F4FB', boxShadow:'0 2px 0 rgba(35,19,71,0.07)'}}>
              <span className="text-xl" aria-hidden="true">✏️</span>
              <div>
                <div className="font-bold text-ink text-sm" style={{fontFamily:'"Nunito",system-ui'}}>{t('childEditProfileBtn')}</div>
                <div className="text-xs text-ink/50" style={{fontFamily:'"Nunito",system-ui'}}>{t('childEditProfileDesc')}</div>
              </div>
            </button>
            <button onClick={() => setShowReset(true)}
              className="flex items-center gap-3 p-4 rounded-2xl text-left active:scale-98 focus:outline-none focus:ring-2 focus:ring-orange-400"
              style={{background:'#FFF8F0', boxShadow:'0 2px 0 rgba(200,80,0,0.08)'}}>
              <span className="text-xl" aria-hidden="true">🔄</span>
              <div>
                <div className="font-bold text-orange-700 text-sm" style={{fontFamily:'"Nunito",system-ui'}}>{t('childResetProgressBtn')}</div>
                <div className="text-xs text-orange-400" style={{fontFamily:'"Nunito",system-ui'}}>{t('childResetProgressDesc')}</div>
              </div>
            </button>
            <button onClick={handleDelete}
              className="flex items-center gap-3 p-4 rounded-2xl text-left active:scale-98 focus:outline-none focus:ring-2 focus:ring-red-400"
              style={{background:'#FFF0F0', boxShadow:'0 2px 0 rgba(200,0,0,0.07)'}}>
              <span className="text-xl" aria-hidden="true">🗑️</span>
              <div>
                <div className="font-bold text-red-600 text-sm" style={{fontFamily:'"Nunito",system-ui'}}>{t('childDeleteProfileBtn')}</div>
                <div className="text-xs text-red-400" style={{fontFamily:'"Nunito",system-ui'}}>{t('childDeleteProfileDesc')}</div>
              </div>
            </button>
          </div>
        </BottomSheet>
      )}

      {/* Edit modal */}
      {modal === 'edit' && editTarget && (
        <BottomSheet title={t('childEditProfileTitle')} onClose={() => { setModal(null); setEditTarget(null); }}>
          <ProfileForm initial={editTarget} onSave={handleEdit} onCancel={() => setModal('options')} saveLabel={t('childEditProfileBtn')}/>
        </BottomSheet>
      )}

      {/* Reset confirm */}
      {showReset && editTarget && (
        <ResetConfirm childName={editTarget.nickname} onConfirm={handleReset} onCancel={() => setShowReset(false)}/>
      )}
    </div>
  );
}
