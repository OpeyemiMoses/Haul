import React, { useState } from 'react';
import { X, User, AtSign, FileText, CheckCircle2, Sparkles, Camera, Image, AlertCircle } from 'lucide-react';
import { ModalPortal } from './ModalPortal';
import { isUsernameAvailable } from '../lib/userRegistry';
import { toast } from '../lib/toast/ToastContext';

const AVATAR_PRESETS = [
  { name: 'VIP Passport', url: '/assets/air_max_95.jpg' },
  { name: 'Monad Elite', url: '/assets/yeezy_350.jpg' },
  { name: 'Streetwear', url: '/assets/puma_suede.jpg' },
  { name: 'Cyber Cyber', url: '/assets/monad_jacket.jpg' },
  { name: 'Lagos Luxury', url: '/assets/nike_store_banner.jpg' }
];

export default function EditProfileModal({
  isOpen,
  onClose,
  initialData = {},
  onSave,
  onUpdateAvatar
}) {
  const [name, setName] = useState(initialData.name || '');
  const [username, setUsername] = useState(initialData.username || '');
  const [bio, setBio] = useState(initialData.bio || '');
  const [avatarPreview, setAvatarPreview] = useState(initialData.avatar || null);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state if initialData changes
  React.useEffect(() => {
    if (isOpen) {
      setName(initialData.name || '');
      setUsername((initialData.username || '').replace(/^@/, ''));
      setBio(initialData.bio || 'Living Digital Passport Collector on Monad.');
      setAvatarPreview(initialData.avatar || null);
      setSavedSuccess(false);
    }
  }, [isOpen, initialData]);

  const cleanUsername = username.trim().replace(/^@/, '').toLowerCase();
  const initialUsername = (initialData.username || '').replace(/^@/, '').trim().toLowerCase();
  const isSelf = cleanUsername === initialUsername;
  const isAvailable = isSelf || (cleanUsername.length >= 3 && isUsernameAvailable(cleanUsername, initialData.currentUserIdentifier || initialData.address || initialData.email));
  const isTooShort = cleanUsername.length > 0 && cleanUsername.length < 3;

  if (!isOpen) return null;

  const handleAvatarFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      setAvatarPreview(dataUrl);
      if (onUpdateAvatar) onUpdateAvatar(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPresetAvatar = (url) => {
    setAvatarPreview(url);
    if (onUpdateAvatar) onUpdateAvatar(url);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAvailable) {
      toast.warning(`Username @${cleanUsername} is already taken by another user. Please choose another username.`, 'Username Unavailable');
      return;
    }
    setSaving(true);
    
    try {
      await onSave({
        name: name.trim(),
        username: cleanUsername,
        bio: bio.trim()
      });
      setSavedSuccess(true);
      toast.success('Profile updated successfully!');
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 900);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalPortal>
      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 10000 }}>
        <div
          className="custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: '500px',
            width: '92%',
            maxHeight: 'calc(100vh - 40px)',
            overflowY: 'auto',
            background: 'linear-gradient(145deg, #0D1616 0%, #060B0B 100%)',
            border: '1px solid rgba(132, 244, 59, 0.35)',
            borderRadius: '24px',
            padding: '28px',
            color: '#FFFFFF',
            boxShadow: '0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(132, 244, 59, 0.1)',
            position: 'relative'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: 'rgba(132, 244, 59, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-green)'
              }}>
                <Sparkles size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#FFFFFF' }}>
                  Edit Public Profile
                </h3>
                <p style={{ fontSize: '0.76rem', color: '#9CA3AF', margin: 0 }}>
                  Personalize your Monad living passport identity & @handle
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                color: '#9CA3AF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          </div>

          {savedSuccess ? (
            <div style={{ textAlign: 'center', padding: '36px 0' }}>
              <CheckCircle2 size={48} color="var(--brand-green)" style={{ margin: '0 auto 12px' }} />
              <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '6px' }}>
                Profile Updated!
              </h4>
              <p style={{ fontSize: '0.84rem', color: '#9CA3AF' }}>
                Your handle and profile details are now active on Monad and the Hual registry.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Avatar Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '8px' }}>
                  PROFILE AVATAR
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{
                    position: 'relative',
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#080F0F',
                    border: '2px solid var(--brand-green)',
                    overflow: 'hidden',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <User size={28} color="var(--brand-green)" />
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <label style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '999px',
                        background: '#162424',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        color: '#FFFFFF',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}>
                        <Camera size={13} />
                        Upload Image
                        <input type="file" accept="image/*" onChange={handleAvatarFile} style={{ display: 'none' }} />
                      </label>
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      {AVATAR_PRESETS.map((p, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSelectPresetAvatar(p.url)}
                          title={p.name}
                          style={{
                            width: '26px',
                            height: '26px',
                            borderRadius: '50%',
                            overflow: 'hidden',
                            border: avatarPreview === p.url ? '2px solid var(--brand-green)' : '1px solid rgba(255, 255, 255, 0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          <img src={p.url} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '6px' }}>
                  FULL NAME
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Your Name or Brand"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '12px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Hual Username */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <label style={{ fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700 }}>
                    HUAL USERNAME (FOR RECEIVING FUNDS)
                  </label>
                  <span style={{ fontSize: '0.7rem', color: 'var(--brand-green)' }}>
                    @{username ? username.replace(/^@/, '') : 'handle'}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <AtSign size={16} color="var(--brand-green)" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <input
                    type="text"
                    required
                    placeholder="e.g. alex or lagos_boutique"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '12px',
                      background: '#080F0F',
                      border: `1px solid ${!isAvailable && cleanUsername.length >= 3 ? '#EF4444' : (isAvailable && cleanUsername.length >= 3 ? 'var(--brand-green)' : 'rgba(255, 255, 255, 0.15)')}`,
                      color: '#FFFFFF',
                      fontSize: '0.86rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Uniqueness Feedback */}
                {isTooShort && (
                  <p style={{ fontSize: '0.72rem', color: '#FBBF24', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <AlertCircle size={12} />
                    <span>Username must be at least 3 characters.</span>
                  </p>
                )}
                {!isTooShort && !isAvailable && cleanUsername.length >= 3 && (
                  <p style={{ fontSize: '0.72rem', color: '#EF4444', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <AlertCircle size={12} />
                    <span>Username @{cleanUsername} is already taken by another user.</span>
                  </p>
                )}
                {!isTooShort && isAvailable && cleanUsername.length >= 3 && (
                  <p style={{ fontSize: '0.72rem', color: 'var(--brand-green)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                    <CheckCircle2 size={12} />
                    <span>@{cleanUsername} is available!</span>
                  </p>
                )}

                <p style={{ fontSize: '0.7rem', color: '#6B7280', margin: '4px 0 0' }}>
                  Usernames are strictly unique. Other users can send funds to you using this @handle.
                </p>
              </div>

              {/* Bio / Passport Collector Tagline */}
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', color: '#9CA3AF', fontWeight: 700, marginBottom: '6px' }}>
                  COLLECTOR BIO / TAGLINE
                </label>
                <div style={{ position: 'relative' }}>
                  <FileText size={16} color="#6B7280" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <textarea
                    rows={3}
                    placeholder="Tell the community what luxury or verified goods you collect..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 36px',
                      borderRadius: '12px',
                      background: '#080F0F',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#FFFFFF',
                      fontSize: '0.82rem',
                      outline: 'none',
                      resize: 'none'
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '12px',
                    background: '#162424',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#9CA3AF',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !isAvailable || isTooShort}
                  className="btn-pill-primary"
                  style={{
                    flex: 2,
                    padding: '12px',
                    fontSize: '0.86rem',
                    fontWeight: 800,
                    opacity: (saving || !isAvailable || isTooShort) ? 0.5 : 1,
                    cursor: (saving || !isAvailable || isTooShort) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? 'Saving...' : 'Save Profile Changes'}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </ModalPortal>
  );
}
