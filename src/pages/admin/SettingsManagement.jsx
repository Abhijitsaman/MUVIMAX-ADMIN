import React, { useState, useEffect } from 'react';
import { db } from '../../firebase/config';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  FaSave,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaGlobe,
  FaPalette,
  FaUser,
  FaFilm,
  FaPlay,
  FaBell,
  FaShieldAlt,
  FaDatabase,
  FaInfoCircle,
  FaUpload,
  FaImage,
  FaTimes,
  FaCloudUploadAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { storage } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const SettingsManagement = () => {
  const [settings, setSettings] = useState({
    general: {
      platformName: 'MUVIMAX',
      platformDescription: 'Premium OTT Streaming Platform',
      contactEmail: 'support@muvimax.com',
      supportEmail: 'support@muvimax.com',
      supportPhone: '',
      websiteUrl: '',
      timezone: 'UTC',
      defaultLanguage: 'en',
      defaultCountry: 'US',
      dateFormat: 'MMM d, yyyy',
      timeFormat: '12h'
    },
    appearance: {
      primaryColor: '#e50914',
      secondaryColor: '#221f1f',
      accentColor: '#ff0a16',
      theme: 'dark',
      logo: '',
      favicon: '',
      loaderLogo: '',
      loadingAnimation: 'spinner'
    },
    user: {
      allowRegistration: true,
      requireEmailVerification: true,
      guestMode: false,
      minimumPasswordLength: 8,
      sessionTimeout: 3600,
      rememberMe: true,
      profileEditing: true,
      avatarUpload: true
    },
    movie: {
      autoPublish: false,
      defaultVisibility: 'visible',
      defaultQuality: '1080p',
      defaultLanguage: 'en',
      defaultCategory: '',
      defaultGenre: '',
      autoSlug: true,
      autoSeo: true,
      autoThumbnail: false
    },
    player: {
      defaultQuality: 'auto',
      defaultPlaybackSpeed: 1,
      autoPlay: true,
      autoResume: true,
      pictureInPicture: true,
      miniPlayer: true,
      keyboardShortcuts: true,
      skipIntro: false,
      skipCredits: false
    },
    notification: {
      enableNotifications: true,
      emailNotifications: true,
      pushNotifications: false,
      systemNotifications: true,
      announcementNotifications: true,
      reviewNotifications: true,
      commentNotifications: true,
      securityNotifications: true
    },
    security: {
      enableTwoFactor: false,
      maxLoginAttempts: 5,
      accountLockTime: 30,
      passwordPolicy: 'medium',
      adminSessionTimeout: 3600,
      ipRestrictions: false,
      trustedDevices: false,
      activityLogging: true,
      securityAlerts: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoProgress, setLogoProgress] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'platform');
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSettings(docSnap.data());
          if (docSnap.data().appearance?.logo) {
            setLogoPreview(docSnap.data().appearance.logo);
          }
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleInputChange = (category, field, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const handleCheckboxChange = (category, field) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: !prev[category][field]
      }
    }));
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
    if (!validImageTypes.includes(file.type)) {
      setError('Please upload a valid image file (JPEG, PNG, WebP, SVG)');
      return;
    }

    setLogoUploading(true);
    setLogoProgress(0);

    const reader = new FileReader();
    reader.onload = (e) => {
      setLogoPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    try {
      const storageRef = ref(storage, `settings/logo_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setLogoProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setLogoUploading(false);
          setError('Failed to upload logo');
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setSettings(prev => ({
            ...prev,
            appearance: {
              ...prev.appearance,
              logo: url
            }
          }));
          setLogoUploading(false);
          setLogoProgress(100);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setLogoUploading(false);
      setError('Failed to upload logo');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    
    try {
      const docRef = doc(db, 'settings', 'platform');
      await setDoc(docRef, {
        ...settings,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: FaGlobe },
    { id: 'appearance', label: 'Appearance', icon: FaPalette },
    { id: 'user', label: 'User Settings', icon: FaUser },
    { id: 'movie', label: 'Movie Settings', icon: FaFilm },
    { id: 'player', label: 'Player Settings', icon: FaPlay },
    { id: 'notification', label: 'Notifications', icon: FaBell },
    { id: 'security', label: 'Security', icon: FaShieldAlt }
  ];

  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  const renderSettings = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Platform Name</label>
                <input
                  type="text"
                  value={settings.general.platformName}
                  onChange={(e) => handleInputChange('general', 'platformName', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group full-width">
                <label>Platform Description</label>
                <textarea
                  value={settings.general.platformDescription}
                  onChange={(e) => handleInputChange('general', 'platformDescription', e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input
                  type="email"
                  value={settings.general.contactEmail}
                  onChange={(e) => handleInputChange('general', 'contactEmail', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Support Email</label>
                <input
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => handleInputChange('general', 'supportEmail', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Support Phone</label>
                <input
                  type="text"
                  value={settings.general.supportPhone}
                  onChange={(e) => handleInputChange('general', 'supportPhone', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Website URL</label>
                <input
                  type="url"
                  value={settings.general.websiteUrl}
                  onChange={(e) => handleInputChange('general', 'websiteUrl', e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Timezone</label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => handleInputChange('general', 'timezone', e.target.value)}
                  className="form-select"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST</option>
                  <option value="America/Los_Angeles">PST</option>
                  <option value="Europe/London">GMT</option>
                  <option value="Asia/Kolkata">IST</option>
                  <option value="Asia/Tokyo">JST</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Language</label>
                <select
                  value={settings.general.defaultLanguage}
                  onChange={(e) => handleInputChange('general', 'defaultLanguage', e.target.value)}
                  className="form-select"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="hi">Hindi</option>
                  <option value="ja">Japanese</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Country</label>
                <input
                  type="text"
                  value={settings.general.defaultCountry}
                  onChange={(e) => handleInputChange('general', 'defaultCountry', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'appearance':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>Primary Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.appearance.primaryColor}
                    onChange={(e) => handleInputChange('appearance', 'primaryColor', e.target.value)}
                    className="form-input color-hex"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Secondary Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={settings.appearance.secondaryColor}
                    onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.appearance.secondaryColor}
                    onChange={(e) => handleInputChange('appearance', 'secondaryColor', e.target.value)}
                    className="form-input color-hex"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Accent Color</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={settings.appearance.accentColor}
                    onChange={(e) => handleInputChange('appearance', 'accentColor', e.target.value)}
                    className="color-picker"
                  />
                  <input
                    type="text"
                    value={settings.appearance.accentColor}
                    onChange={(e) => handleInputChange('appearance', 'accentColor', e.target.value)}
                    className="form-input color-hex"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Theme</label>
                <select
                  value={settings.appearance.theme}
                  onChange={(e) => handleInputChange('appearance', 'theme', e.target.value)}
                  className="form-select"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label>Platform Logo</label>
                <div className="logo-upload-section">
                  <div 
                    className="logo-upload-dropzone"
                    onClick={() => document.getElementById('logoInput').click()}
                  >
                    {logoPreview ? (
                      <div className="logo-preview">
                        <img src={logoPreview} alt="Logo preview" />
                        {logoUploading && (
                          <div className="upload-overlay">
                            <div className="progress-bar" style={{ width: `${logoProgress}%` }} />
                            <span>{Math.round(logoProgress)}%</span>
                          </div>
                        )}
                        <button
                          className="remove-logo"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLogoPreview('');
                            handleInputChange('appearance', 'logo', '');
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="upload-placeholder">
                        <FaCloudUploadAlt size={32} />
                        <p>Click to upload logo</p>
                        <span>PNG, JPEG, WebP, SVG</span>
                      </div>
                    )}
                    <input
                      id="logoInput"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleLogoUpload(e.target.files[0])}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Loading Animation</label>
                <select
                  value={settings.appearance.loadingAnimation}
                  onChange={(e) => handleInputChange('appearance', 'loadingAnimation', e.target.value)}
                  className="form-select"
                >
                  <option value="spinner">Spinner</option>
                  <option value="pulse">Pulse</option>
                  <option value="skeleton">Skeleton</option>
                  <option value="none">None</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'user':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.user.allowRegistration}
                    onChange={() => handleCheckboxChange('user', 'allowRegistration')}
                  />
                  Allow Registration
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.user.requireEmailVerification}
                    onChange={() => handleCheckboxChange('user', 'requireEmailVerification')}
                  />
                  Require Email Verification
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.user.guestMode}
                    onChange={() => handleCheckboxChange('user', 'guestMode')}
                  />
                  Enable Guest Mode
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.user.rememberMe}
                    onChange={() => handleCheckboxChange('user', 'rememberMe')}
                  />
                  Remember Me
                </label>
              </div>
              <div className="form-group">
                <label>Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.user.minimumPasswordLength}
                  onChange={(e) => handleInputChange('user', 'minimumPasswordLength', parseInt(e.target.value))}
                  min="6"
                  max="20"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Session Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.user.sessionTimeout}
                  onChange={(e) => handleInputChange('user', 'sessionTimeout', parseInt(e.target.value))}
                  min="300"
                  max="86400"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'movie':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.movie.autoPublish}
                    onChange={() => handleCheckboxChange('movie', 'autoPublish')}
                  />
                  Auto Publish Movies
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.movie.autoSlug}
                    onChange={() => handleCheckboxChange('movie', 'autoSlug')}
                  />
                  Auto Generate Slug
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.movie.autoSeo}
                    onChange={() => handleCheckboxChange('movie', 'autoSeo')}
                  />
                  Auto Generate SEO
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.movie.autoThumbnail}
                    onChange={() => handleCheckboxChange('movie', 'autoThumbnail')}
                  />
                  Auto Generate Thumbnail
                </label>
              </div>
              <div className="form-group">
                <label>Default Visibility</label>
                <select
                  value={settings.movie.defaultVisibility}
                  onChange={(e) => handleInputChange('movie', 'defaultVisibility', e.target.value)}
                  className="form-select"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="members">Members Only</option>
                  <option value="premium">Premium Only</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Quality</label>
                <select
                  value={settings.movie.defaultQuality}
                  onChange={(e) => handleInputChange('movie', 'defaultQuality', e.target.value)}
                  className="form-select"
                >
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="2160p">2160p</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Language</label>
                <input
                  type="text"
                  value={settings.movie.defaultLanguage}
                  onChange={(e) => handleInputChange('movie', 'defaultLanguage', e.target.value)}
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'player':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.player.autoPlay}
                    onChange={() => handleCheckboxChange('player', 'autoPlay')}
                  />
                  Auto Play
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.player.autoResume}
                    onChange={() => handleCheckboxChange('player', 'autoResume')}
                  />
                  Auto Resume
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.player.pictureInPicture}
                    onChange={() => handleCheckboxChange('player', 'pictureInPicture')}
                  />
                  Picture in Picture
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.player.keyboardShortcuts}
                    onChange={() => handleCheckboxChange('player', 'keyboardShortcuts')}
                  />
                  Keyboard Shortcuts
                </label>
              </div>
              <div className="form-group">
                <label>Default Quality</label>
                <select
                  value={settings.player.defaultQuality}
                  onChange={(e) => handleInputChange('player', 'defaultQuality', e.target.value)}
                  className="form-select"
                >
                  <option value="auto">Auto</option>
                  <option value="480p">480p</option>
                  <option value="720p">720p</option>
                  <option value="1080p">1080p</option>
                  <option value="2160p">2160p</option>
                </select>
              </div>
              <div className="form-group">
                <label>Default Playback Speed</label>
                <select
                  value={settings.player.defaultPlaybackSpeed}
                  onChange={(e) => handleInputChange('player', 'defaultPlaybackSpeed', parseFloat(e.target.value))}
                  className="form-select"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'notification':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.enableNotifications}
                    onChange={() => handleCheckboxChange('notification', 'enableNotifications')}
                  />
                  Enable Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.emailNotifications}
                    onChange={() => handleCheckboxChange('notification', 'emailNotifications')}
                  />
                  Email Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.pushNotifications}
                    onChange={() => handleCheckboxChange('notification', 'pushNotifications')}
                  />
                  Push Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.systemNotifications}
                    onChange={() => handleCheckboxChange('notification', 'systemNotifications')}
                  />
                  System Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.announcementNotifications}
                    onChange={() => handleCheckboxChange('notification', 'announcementNotifications')}
                  />
                  Announcement Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.reviewNotifications}
                    onChange={() => handleCheckboxChange('notification', 'reviewNotifications')}
                  />
                  Review Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.commentNotifications}
                    onChange={() => handleCheckboxChange('notification', 'commentNotifications')}
                  />
                  Comment Notifications
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.notification.securityNotifications}
                    onChange={() => handleCheckboxChange('notification', 'securityNotifications')}
                  />
                  Security Notifications
                </label>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="settings-section">
            <div className="form-grid">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.enableTwoFactor}
                    onChange={() => handleCheckboxChange('security', 'enableTwoFactor')}
                  />
                  Enable Two-Factor Authentication
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.ipRestrictions}
                    onChange={() => handleCheckboxChange('security', 'ipRestrictions')}
                  />
                  IP Restrictions
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.trustedDevices}
                    onChange={() => handleCheckboxChange('security', 'trustedDevices')}
                  />
                  Trusted Devices
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.activityLogging}
                    onChange={() => handleCheckboxChange('security', 'activityLogging')}
                  />
                  Activity Logging
                </label>
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={settings.security.securityAlerts}
                    onChange={() => handleCheckboxChange('security', 'securityAlerts')}
                  />
                  Security Alerts
                </label>
              </div>
              <div className="form-group">
                <label>Max Login Attempts</label>
                <input
                  type="number"
                  value={settings.security.maxLoginAttempts}
                  onChange={(e) => handleInputChange('security', 'maxLoginAttempts', parseInt(e.target.value))}
                  min="3"
                  max="10"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Account Lock Time (minutes)</label>
                <input
                  type="number"
                  value={settings.security.accountLockTime}
                  onChange={(e) => handleInputChange('security', 'accountLockTime', parseInt(e.target.value))}
                  min="5"
                  max="120"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Password Policy</label>
                <select
                  value={settings.security.passwordPolicy}
                  onChange={(e) => handleInputChange('security', 'passwordPolicy', e.target.value)}
                  className="form-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="form-group">
                <label>Admin Session Timeout (seconds)</label>
                <input
                  type="number"
                  value={settings.security.adminSessionTimeout}
                  onChange={(e) => handleInputChange('security', 'adminSessionTimeout', parseInt(e.target.value))}
                  min="600"
                  max="86400"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="settings-management">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <span className="page-count">System Configuration</span>
        </div>
        <div className="page-header-right">
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving || logoUploading}
          >
            {saving ? <FaSpinner className="spinning" /> : <FaSave />}
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-layout">
        <div className="settings-sidebar">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="settings-content">
          <div className="settings-panel">
            {renderSettings()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
