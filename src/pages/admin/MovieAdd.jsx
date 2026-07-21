import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../../firebase/config';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaArrowLeft,
  FaSave,
  FaUpload,
  FaTimes,
  FaPlus,
  FaTrash,
  FaImage,
  FaVideo,
  FaFile,
  FaGlobe,
  FaLanguage,
  FaTags,
  FaCalendarAlt,
  FaClock,
  FaStar,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaChevronDown,
  FaChevronUp,
  FaInfoCircle,
  FaExclamationTriangle,
  FaPlay,
  FaPause,
  FaSpinner,
  FaFileVideo,
  FaFileAudio,
  FaFileCode,
  FaLink,
  FaCloudUploadAlt,
  FaRedo,
  FaBan,
  FaCheckCircle,
  FaPen,
  FaSave as FaSaveIcon,
  FaUndo
} from 'react-icons/fa';
import { MdMovie, MdTheaters, MdDescription, MdTitle, MdSubtitles } from 'react-icons/md';
import { format } from 'date-fns';

const MovieAdd = () => {
  const navigate = useNavigate();
  
  // Basic Info
  const [formData, setFormData] = useState({
    title: '',
    originalTitle: '',
    shortTitle: '',
    slug: '',
    description: '',
    shortDescription: '',
    tagline: '',
    releaseYear: '',
    releaseDate: '',
    duration: '',
    country: '',
    productionCompany: '',
    director: '',
    producer: '',
    writer: '',
    cast: [],
    language: '',
    subtitleLanguages: [],
    genres: [],
    categories: [],
    tags: [],
    keywords: '',
    ageRating: '',
    imdbRating: '',
    tmdbId: ''
  });

  // Media
  const [banner, setBanner] = useState({
    method: 'upload',
    file: null,
    url: '',
    preview: '',
    uploadProgress: 0,
    isUploading: false
  });
  
  const [poster, setPoster] = useState({
    method: 'upload',
    file: null,
    url: '',
    preview: '',
    uploadProgress: 0,
    isUploading: false
  });
  
  const [thumbnail, setThumbnail] = useState({
    method: 'upload',
    file: null,
    url: '',
    preview: '',
    uploadProgress: 0,
    isUploading: false
  });

  const [backdrops, setBackdrops] = useState([]);
  const [videoSource, setVideoSource] = useState({
    method: 'url', // 'upload', 'url', 'streaming'
    file: null,
    url: '',
    uploadProgress: 0,
    isUploading: false,
    streamingProvider: ''
  });

  const [subtitles, setSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [qualities, setQualities] = useState([]);

  // Status & Visibility
  const [status, setStatus] = useState('draft');
  const [visibility, setVisibility] = useState('visible');
  const [schedule, setSchedule] = useState({
    publishDate: '',
    publishTime: '',
    expireDate: '',
    expireTime: ''
  });

  // SEO
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    ogImage: '',
    twitterImage: ''
  });

  // UI States
  const [activeSection, setActiveSection] = useState('basic');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  
  const fileInputRef = useRef(null);
  const autoSaveTimerRef = useRef(null);

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: MdTitle },
    { id: 'banner', label: 'Hero Banner', icon: FaImage },
    { id: 'poster', label: 'Poster', icon: FaImage },
    { id: 'thumbnail', label: 'Thumbnail', icon: FaImage },
    { id: 'backdrops', label: 'Backdrops', icon: FaImage },
    { id: 'video', label: 'Video Source', icon: FaVideo },
    { id: 'subtitles', label: 'Subtitles', icon: MdSubtitles },
    { id: 'audio', label: 'Audio Tracks', icon: FaFileAudio },
    { id: 'qualities', label: 'Qualities', icon: FaFileVideo },
    { id: 'metadata', label: 'Metadata', icon: FaTags },
    { id: 'status', label: 'Status & Visibility', icon: FaEye },
    { id: 'schedule', label: 'Schedule', icon: FaCalendarAlt },
    { id: 'seo', label: 'SEO', icon: FaGlobe }
  ];

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title]);

  // Auto-save
  useEffect(() => {
    if (autoSaveEnabled && !isLoading) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      autoSaveTimerRef.current = setTimeout(() => {
        handleAutoSave();
      }, 30000);
    }
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formData, autoSaveEnabled]);

  const handleAutoSave = async () => {
    try {
      const draftData = {
        ...formData,
        banner: banner.preview || banner.url,
        poster: poster.preview || poster.url,
        thumbnail: thumbnail.preview || thumbnail.url,
        backdrops: backdrops.map(b => b.url || b.preview),
        videoSource: videoSource.url || videoSource.file?.name,
        subtitles: subtitles,
        audioTracks: audioTracks,
        qualities: qualities,
        status: 'draft',
        visibility: visibility,
        schedule: schedule,
        seo: seo,
        autoSaved: true,
        autoSavedAt: serverTimestamp()
      };

      // Check if we have an ID (editing) or creating new
      if (formData.id) {
        await updateDoc(doc(db, 'movies', formData.id), draftData);
      } else {
        // Store in localStorage as draft
        localStorage.setItem('movieDraft', JSON.stringify(draftData));
      }
      setLastSaved(new Date());
    } catch (error) {
      console.error('Auto-save error:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleFileUpload = (type, file) => {
    if (!file) return;

    const validImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    
    if (type === 'video' && !validVideoTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, video: 'Please upload a valid video file (MP4, WebM, OGG)' }));
      return;
    }

    if (type !== 'video' && !validImageTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, [type]: 'Please upload a valid image file (JPEG, PNG, WebP, GIF)' }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target.result;
      
      if (type === 'banner') {
        setBanner(prev => ({ ...prev, file, preview, isUploading: true }));
        uploadFileToStorage(file, 'banners', (progress) => {
          setBanner(prev => ({ ...prev, uploadProgress: progress }));
        }).then(url => {
          setBanner(prev => ({ ...prev, url, isUploading: false, uploadProgress: 100 }));
        }).catch(error => {
          console.error('Upload error:', error);
          setBanner(prev => ({ ...prev, isUploading: false }));
        });
      } else if (type === 'poster') {
        setPoster(prev => ({ ...prev, file, preview, isUploading: true }));
        uploadFileToStorage(file, 'posters', (progress) => {
          setPoster(prev => ({ ...prev, uploadProgress: progress }));
        }).then(url => {
          setPoster(prev => ({ ...prev, url, isUploading: false, uploadProgress: 100 }));
        }).catch(error => {
          console.error('Upload error:', error);
          setPoster(prev => ({ ...prev, isUploading: false }));
        });
      } else if (type === 'thumbnail') {
        setThumbnail(prev => ({ ...prev, file, preview, isUploading: true }));
        uploadFileToStorage(file, 'thumbnails', (progress) => {
          setThumbnail(prev => ({ ...prev, uploadProgress: progress }));
        }).then(url => {
          setThumbnail(prev => ({ ...prev, url, isUploading: false, uploadProgress: 100 }));
        }).catch(error => {
          console.error('Upload error:', error);
          setThumbnail(prev => ({ ...prev, isUploading: false }));
        });
      } else if (type === 'backdrop') {
        const newBackdrop = {
          id: Date.now(),
          file,
          preview,
          url: '',
          isUploading: true,
          uploadProgress: 0
        };
        setBackdrops(prev => [...prev, newBackdrop]);
        uploadFileToStorage(file, 'backdrops', (progress) => {
          setBackdrops(prev => prev.map(b => 
            b.id === newBackdrop.id ? { ...b, uploadProgress: progress } : b
          ));
        }).then(url => {
          setBackdrops(prev => prev.map(b => 
            b.id === newBackdrop.id ? { ...b, url, isUploading: false, uploadProgress: 100 } : b
          ));
        }).catch(error => {
          console.error('Upload error:', error);
          setBackdrops(prev => prev.map(b => 
            b.id === newBackdrop.id ? { ...b, isUploading: false } : b
          ));
        });
      } else if (type === 'video') {
        setVideoSource(prev => ({ ...prev, file, isUploading: true }));
        uploadFileToStorage(file, 'videos', (progress) => {
          setVideoSource(prev => ({ ...prev, uploadProgress: progress }));
        }).then(url => {
          setVideoSource(prev => ({ ...prev, url, isUploading: false, uploadProgress: 100 }));
        }).catch(error => {
          console.error('Upload error:', error);
          setVideoSource(prev => ({ ...prev, isUploading: false }));
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const uploadFileToStorage = (file, folder, onProgress) => {
    return new Promise((resolve, reject) => {
      const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(progress);
        },
        (error) => reject(error),
        async () => {
          try {
            const url = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(url);
          } catch (error) {
            reject(error);
          }
        }
      );
    });
  };

  const handleRemoveBackdrop = (id) => {
    setBackdrops(prev => prev.filter(b => b.id !== id));
  };

  const handleMoveBackdrop = (id, direction) => {
    const index = backdrops.findIndex(b => b.id === id);
    if (index === -1) return;
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= backdrops.length) return;
    const newBackdrops = [...backdrops];
    [newBackdrops[index], newBackdrops[newIndex]] = [newBackdrops[newIndex], newBackdrops[index]];
    setBackdrops(newBackdrops);
  };

  const handleAddSubtitle = () => {
    setSubtitles(prev => [...prev, {
      id: Date.now(),
      language: '',
      label: '',
      file: null,
      url: '',
      isDefault: false,
      forced: false,
      enabled: true
    }]);
  };

  const handleSubtitleChange = (id, field, value) => {
    setSubtitles(prev => prev.map(s => 
      s.id === id ? { ...s, [field]: value } : s
    ));
  };

  const handleSubtitleFile = (id, file) => {
    const validSubtitleTypes = ['text/vtt', 'text/srt', 'text/ass', 'text/ssa'];
    if (!validSubtitleTypes.includes(file.type) && !file.name.match(/\.(vtt|srt|ass|ssa)$/)) {
      setErrors(prev => ({ ...prev, subtitle: 'Please upload a valid subtitle file (VTT, SRT, ASS, SSA)' }));
      return;
    }

    setSubtitles(prev => prev.map(s => 
      s.id === id ? { ...s, file, isUploading: true } : s
    ));

    uploadFileToStorage(file, 'subtitles', (progress) => {
      setSubtitles(prev => prev.map(s => 
        s.id === id ? { ...s, uploadProgress: progress } : s
      ));
    }).then(url => {
      setSubtitles(prev => prev.map(s => 
        s.id === id ? { ...s, url, isUploading: false, uploadProgress: 100 } : s
      ));
    }).catch(error => {
      console.error('Subtitle upload error:', error);
      setSubtitles(prev => prev.map(s => 
        s.id === id ? { ...s, isUploading: false } : s
      ));
    });
  };

  const handleRemoveSubtitle = (id) => {
    setSubtitles(prev => prev.filter(s => s.id !== id));
  };

  const handleAddAudioTrack = () => {
    setAudioTracks(prev => [...prev, {
      id: Date.now(),
      language: '',
      label: '',
      file: null,
      url: '',
      isDefault: false,
      codec: '',
      bitrate: '',
      channelType: '',
      enabled: true
    }]);
  };

  const handleAudioTrackChange = (id, field, value) => {
    setAudioTracks(prev => prev.map(a => 
      a.id === id ? { ...a, [field]: value } : a
    ));
  };

  const handleAudioTrackFile = (id, file) => {
    const validAudioTypes = ['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg'];
    if (!validAudioTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, audio: 'Please upload a valid audio file (MP3, M4A, WebM, OGG)' }));
      return;
    }

    setAudioTracks(prev => prev.map(a => 
      a.id === id ? { ...a, file, isUploading: true } : a
    ));

    uploadFileToStorage(file, 'audio', (progress) => {
      setAudioTracks(prev => prev.map(a => 
        a.id === id ? { ...a, uploadProgress: progress } : a
      ));
    }).then(url => {
      setAudioTracks(prev => prev.map(a => 
        a.id === id ? { ...a, url, isUploading: false, uploadProgress: 100 } : a
      ));
    }).catch(error => {
      console.error('Audio upload error:', error);
      setAudioTracks(prev => prev.map(a => 
        a.id === id ? { ...a, isUploading: false } : a
      ));
    });
  };

  const handleRemoveAudioTrack = (id) => {
    setAudioTracks(prev => prev.filter(a => a.id !== id));
  };

  const handleAddQuality = () => {
    setQualities(prev => [...prev, {
      id: Date.now(),
      label: '',
      resolution: '',
      file: null,
      url: '',
      isDefault: false,
      enabled: true
    }]);
  };

  const handleQualityChange = (id, field, value) => {
    setQualities(prev => prev.map(q => 
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const handleQualityFile = (id, file) => {
    const validVideoTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (!validVideoTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, quality: 'Please upload a valid video file (MP4, WebM, OGG)' }));
      return;
    }

    setQualities(prev => prev.map(q => 
      q.id === id ? { ...q, file, isUploading: true } : q
    ));

    uploadFileToStorage(file, 'qualities', (progress) => {
      setQualities(prev => prev.map(q => 
        q.id === id ? { ...q, uploadProgress: progress } : q
      ));
    }).then(url => {
      setQualities(prev => prev.map(q => 
        q.id === id ? { ...q, url, isUploading: false, uploadProgress: 100 } : q
      ));
    }).catch(error => {
      console.error('Quality upload error:', error);
      setQualities(prev => prev.map(q => 
        q.id === id ? { ...q, isUploading: false } : q
      ));
    });
  };

  const handleRemoveQuality = (id) => {
    setQualities(prev => prev.filter(q => q.id !== id));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title) newErrors.title = 'Title is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.releaseYear) newErrors.releaseYear = 'Release year is required';
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.language) newErrors.language = 'Language is required';
    if (!formData.categories || formData.categories.length === 0) {
      newErrors.categories = 'At least one category is required';
    }
    if (!formData.genres || formData.genres.length === 0) {
      newErrors.genres = 'At least one genre is required';
    }
    if (!poster.url && !poster.preview) {
      newErrors.poster = 'Poster is required';
    }
    if (!videoSource.url && !videoSource.file) {
      newErrors.video = 'Video source is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error
      const firstError = Object.keys(errors)[0];
      const element = document.getElementById(`section-${firstError}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsLoading(true);

    try {
      const movieData = {
        ...formData,
        banner: banner.url || banner.preview,
        poster: poster.url || poster.preview,
        thumbnail: thumbnail.url || thumbnail.preview,
        backdrops: backdrops.map(b => b.url || b.preview),
        videoSource: videoSource.url || videoSource.file?.name,
        videoMethod: videoSource.method,
        subtitles: subtitles.map(s => ({
          language: s.language,
          label: s.label,
          url: s.url,
          isDefault: s.isDefault,
          forced: s.forced,
          enabled: s.enabled
        })),
        audioTracks: audioTracks.map(a => ({
          language: a.language,
          label: a.label,
          url: a.url,
          isDefault: a.isDefault,
          codec: a.codec,
          bitrate: a.bitrate,
          channelType: a.channelType,
          enabled: a.enabled
        })),
        qualities: qualities.map(q => ({
          label: q.label,
          resolution: q.resolution,
          url: q.url,
          isDefault: q.isDefault,
          enabled: q.enabled
        })),
        status: status,
        visibility: visibility,
        schedule: schedule,
        seo: seo,
        views: 0,
        likes: 0,
        favorites: 0,
        watchlistAdds: 0,
        shares: 0,
        averageRating: 0,
        totalReviews: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'movies'), movieData);
      
      setSuccess(true);
      setTimeout(() => {
        navigate(`/admin/movies/edit/${docRef.id}`);
      }, 1500);
    } catch (error) {
      console.error('Error saving movie:', error);
      setErrors(prev => ({ ...prev, submit: error.message }));
      setIsLoading(false);
    }
  };

  const handleDiscard = () => {
    if (window.confirm('Are you sure you want to discard this movie? All unsaved changes will be lost.')) {
      localStorage.removeItem('movieDraft');
      navigate('/admin/movies');
    }
  };

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'basic':
        return (
          <div className="section-content">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Movie Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter movie title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
                {errors.title && <span className="error-text">{errors.title}</span>}
              </div>

              <div className="form-group">
                <label>Original Title</label>
                <input
                  type="text"
                  name="originalTitle"
                  value={formData.originalTitle}
                  onChange={handleInputChange}
                  placeholder="Original title (if different)"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Short Title</label>
                <input
                  type="text"
                  name="shortTitle"
                  value={formData.shortTitle}
                  onChange={handleInputChange}
                  placeholder="Short title for display"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Slug</label>
                <input
                  type="text"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  placeholder="auto-generated"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Tagline</label>
                <input
                  type="text"
                  name="tagline"
                  value={formData.tagline}
                  onChange={handleInputChange}
                  placeholder="Movie tagline"
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Full movie description"
                  rows={6}
                  className={`form-textarea ${errors.description ? 'error' : ''}`}
                />
                {errors.description && <span className="error-text">{errors.description}</span>}
              </div>

              <div className="form-group full-width">
                <label>Short Description</label>
                <textarea
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleInputChange}
                  placeholder="Brief description (for cards)"
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label>Release Year *</label>
                <input
                  type="number"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleInputChange}
                  placeholder="2024"
                  className={`form-input ${errors.releaseYear ? 'error' : ''}`}
                />
                {errors.releaseYear && <span className="error-text">{errors.releaseYear}</span>}
              </div>

              <div className="form-group">
                <label>Release Date</label>
                <input
                  type="date"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleInputChange}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Duration (minutes) *</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="120"
                  className={`form-input ${errors.duration ? 'error' : ''}`}
                />
                {errors.duration && <span className="error-text">{errors.duration}</span>}
              </div>

              <div className="form-group">
                <label>Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  placeholder="United States"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Production Company</label>
                <input
                  type="text"
                  name="productionCompany"
                  value={formData.productionCompany}
                  onChange={handleInputChange}
                  placeholder="Production company name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Director</label>
                <input
                  type="text"
                  name="director"
                  value={formData.director}
                  onChange={handleInputChange}
                  placeholder="Director name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Producer</label>
                <input
                  type="text"
                  name="producer"
                  value={formData.producer}
                  onChange={handleInputChange}
                  placeholder="Producer name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Writer</label>
                <input
                  type="text"
                  name="writer"
                  value={formData.writer}
                  onChange={handleInputChange}
                  placeholder="Writer name"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Cast (comma separated)</label>
                <input
                  type="text"
                  name="cast"
                  value={formData.cast.join(', ')}
                  onChange={(e) => handleArrayInput('cast', e.target.value)}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Language *</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="English"
                  className={`form-input ${errors.language ? 'error' : ''}`}
                />
                {errors.language && <span className="error-text">{errors.language}</span>}
              </div>

              <div className="form-group">
                <label>Subtitle Languages (comma separated)</label>
                <input
                  type="text"
                  name="subtitleLanguages"
                  value={formData.subtitleLanguages.join(', ')}
                  onChange={(e) => handleArrayInput('subtitleLanguages', e.target.value)}
                  placeholder="English, Spanish, French"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Genres (comma separated) *</label>
                <input
                  type="text"
                  name="genres"
                  value={formData.genres.join(', ')}
                  onChange={(e) => handleArrayInput('genres', e.target.value)}
                  placeholder="Action, Drama, Thriller"
                  className={`form-input ${errors.genres ? 'error' : ''}`}
                />
                {errors.genres && <span className="error-text">{errors.genres}</span>}
              </div>

              <div className="form-group">
                <label>Categories (comma separated) *</label>
                <input
                  type="text"
                  name="categories"
                  value={formData.categories.join(', ')}
                  onChange={(e) => handleArrayInput('categories', e.target.value)}
                  placeholder="Movie, Series, Documentary"
                  className={`form-input ${errors.categories ? 'error' : ''}`}
                />
                {errors.categories && <span className="error-text">{errors.categories}</span>}
              </div>

              <div className="form-group">
                <label>Tags (comma separated)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags.join(', ')}
                  onChange={(e) => handleArrayInput('tags', e.target.value)}
                  placeholder="Trending, Award Winning, Classic"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Keywords</label>
                <input
                  type="text"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="SEO keywords"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>Age Rating</label>
                <select
                  name="ageRating"
                  value={formData.ageRating}
                  onChange={handleInputChange}
                  className="form-select"
                >
                  <option value="">Select rating</option>
                  <option value="G">G - General Audiences</option>
                  <option value="PG">PG - Parental Guidance</option>
                  <option value="PG-13">PG-13 - Parents Strongly Cautioned</option>
                  <option value="R">R - Restricted</option>
                  <option value="NC-17">NC-17 - Adults Only</option>
                </select>
              </div>

              <div className="form-group">
                <label>IMDb Rating</label>
                <input
                  type="number"
                  name="imdbRating"
                  value={formData.imdbRating}
                  onChange={handleInputChange}
                  placeholder="8.5"
                  step="0.1"
                  min="0"
                  max="10"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label>TMDb ID</label>
                <input
                  type="text"
                  name="tmdbId"
                  value={formData.tmdbId}
                  onChange={handleInputChange}
                  placeholder="TMDb movie ID"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'banner':
        return (
          <div className="section-content">
            <div className="media-upload-section">
              <div className="upload-method-selector">
                <label>Upload Method</label>
                <select
                  value={banner.method}
                  onChange={(e) => setBanner(prev => ({ ...prev, method: e.target.value }))}
                  className="form-select"
                >
                  <option value="upload">Upload File</option>
                  <option value="url">Paste URL</option>
                </select>
              </div>

              {banner.method === 'upload' ? (
                <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload('banner', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {banner.preview ? (
                    <div className="upload-preview">
                      <img src={banner.preview} alt="Banner preview" />
                      {banner.isUploading && (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${banner.uploadProgress}%` }} />
                          <span>{Math.round(banner.uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setBanner({ method: 'upload', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaCloudUploadAlt size={48} />
                      <p>Click or drag to upload banner image</p>
                      <span className="upload-hint">Recommended: 1920 × 1080 px (16:9)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={banner.url}
                    onChange={(e) => {
                      setBanner(prev => ({ ...prev, url: e.target.value, preview: e.target.value }));
                    }}
                    placeholder="https://example.com/banner.jpg"
                    className="form-input"
                  />
                  {banner.preview && (
                    <div className="upload-preview">
                      <img src={banner.preview} alt="Banner preview" />
                      <button
                        className="remove-media"
                        onClick={() => setBanner({ method: 'url', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false })}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {errors.banner && <span className="error-text">{errors.banner}</span>}
            </div>
          </div>
        );

      case 'poster':
        return (
          <div className="section-content">
            <div className="media-upload-section">
              <div className="upload-method-selector">
                <label>Upload Method</label>
                <select
                  value={poster.method}
                  onChange={(e) => setPoster(prev => ({ ...prev, method: e.target.value }))}
                  className="form-select"
                >
                  <option value="upload">Upload File</option>
                  <option value="url">Paste URL</option>
                </select>
              </div>

              {poster.method === 'upload' ? (
                <div className="upload-dropzone poster-upload" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload('poster', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {poster.preview ? (
                    <div className="upload-preview">
                      <img src={poster.preview} alt="Poster preview" />
                      {poster.isUploading && (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${poster.uploadProgress}%` }} />
                          <span>{Math.round(poster.uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPoster({ method: 'upload', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage size={48} />
                      <p>Click or drag to upload poster</p>
                      <span className="upload-hint">Recommended: 1000 × 1500 px (2:3)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={poster.url}
                    onChange={(e) => {
                      setPoster(prev => ({ ...prev, url: e.target.value, preview: e.target.value }));
                    }}
                    placeholder="https://example.com/poster.jpg"
                    className="form-input"
                  />
                  {poster.preview && (
                    <div className="upload-preview poster-preview">
                      <img src={poster.preview} alt="Poster preview" />
                      <button
                        className="remove-media"
                        onClick={() => setPoster({ method: 'url', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false })}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              )}
              {errors.poster && <span className="error-text">{errors.poster}</span>}
            </div>
          </div>
        );

      case 'thumbnail':
        return (
          <div className="section-content">
            <div className="media-upload-section">
              <div className="upload-method-selector">
                <label>Upload Method</label>
                <select
                  value={thumbnail.method}
                  onChange={(e) => setThumbnail(prev => ({ ...prev, method: e.target.value }))}
                  className="form-select"
                >
                  <option value="upload">Upload File</option>
                  <option value="url">Paste URL</option>
                </select>
              </div>

              {thumbnail.method === 'upload' ? (
                <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload('thumbnail', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  {thumbnail.preview ? (
                    <div className="upload-preview">
                      <img src={thumbnail.preview} alt="Thumbnail preview" />
                      {thumbnail.isUploading && (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${thumbnail.uploadProgress}%` }} />
                          <span>{Math.round(thumbnail.uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setThumbnail({ method: 'upload', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false });
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage size={48} />
                      <p>Click or drag to upload thumbnail</p>
                      <span className="upload-hint">Recommended: 1280 × 720 px (16:9)</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={thumbnail.url}
                    onChange={(e) => {
                      setThumbnail(prev => ({ ...prev, url: e.target.value, preview: e.target.value }));
                    }}
                    placeholder="https://example.com/thumbnail.jpg"
                    className="form-input"
                  />
                  {thumbnail.preview && (
                    <div className="upload-preview">
                      <img src={thumbnail.preview} alt="Thumbnail preview" />
                      <button
                        className="remove-media"
                        onClick={() => setThumbnail({ method: 'url', file: null, url: '', preview: '', uploadProgress: 0, isUploading: false })}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 'backdrops':
        return (
          <div className="section-content">
            <div className="backdrops-section">
              <div className="backdrops-header">
                <h4>Backdrop Images</h4>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FaPlus /> Add Backdrop
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => handleFileUpload('backdrop', e.target.files[0])}
                  accept="image/*"
                  style={{ display: 'none' }}
                  multiple
                />
              </div>

              {backdrops.length === 0 ? (
                <div className="empty-state">
                  <FaImage size={32} />
                  <p>No backdrops added yet</p>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Add First Backdrop
                  </button>
                </div>
              ) : (
                <div className="backdrops-grid">
                  {backdrops.map((backdrop, index) => (
                    <div key={backdrop.id} className="backdrop-item">
                      <img src={backdrop.preview} alt={`Backdrop ${index + 1}`} />
                      {backdrop.isUploading && (
                        <div className="upload-progress overlay">
                          <div className="progress-bar" style={{ width: `${backdrop.uploadProgress}%` }} />
                          <span>{Math.round(backdrop.uploadProgress)}%</span>
                        </div>
                      )}
                      <div className="backdrop-actions">
                        <button
                          className="action-btn move-up"
                          onClick={() => handleMoveBackdrop(backdrop.id, 'up')}
                          disabled={index === 0}
                        >
                          <FaChevronUp />
                        </button>
                        <button
                          className="action-btn move-down"
                          onClick={() => handleMoveBackdrop(backdrop.id, 'down')}
                          disabled={index === backdrops.length - 1}
                        >
                          <FaChevronDown />
                        </button>
                        <button
                          className="action-btn remove"
                          onClick={() => handleRemoveBackdrop(backdrop.id)}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="section-content">
            <div className="video-source-section">
              <div className="form-group">
                <label>Video Source Method</label>
                <select
                  value={videoSource.method}
                  onChange={(e) => setVideoSource(prev => ({ ...prev, method: e.target.value }))}
                  className="form-select"
                >
                  <option value="upload">Upload Video File</option>
                  <option value="url">External Streaming URL</option>
                  <option value="streaming">Streaming Provider</option>
                </select>
              </div>

              {videoSource.method === 'upload' && (
                <div className="upload-dropzone video-upload" onClick={() => fileInputRef.current?.click()}>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload('video', e.target.files[0])}
                    accept="video/*"
                    style={{ display: 'none' }}
                  />
                  {videoSource.file ? (
                    <div className="upload-preview">
                      <FaVideo size={48} />
                      <p>{videoSource.file.name}</p>
                      <span>{(videoSource.file.size / (1024 * 1024)).toFixed(2)} MB</span>
                      {videoSource.isUploading && (
                        <div className="upload-progress">
                          <div className="progress-bar" style={{ width: `${videoSource.uploadProgress}%` }} />
                          <span>{Math.round(videoSource.uploadProgress)}%</span>
                        </div>
                      )}
                      <button
                        className="remove-media"
                        onClick={(e) => {
                          e.stopPropagation();
                          setVideoSource(prev => ({ ...prev, file: null, url: '', isUploading: false, uploadProgress: 0 }));
                        }}
                      >
                        <FaTimes />
                      </button>
                    </div>
                  ) : (
                    <div className="upload-placeholder">
                      <FaCloudUploadAlt size={48} />
                      <p>Click or drag to upload video</p>
                      <span className="upload-hint">Supported: MP4, WebM, OGG</span>
                    </div>
                  )}
                </div>
              )}

              {videoSource.method === 'url' && (
                <div className="url-input-group">
                  <input
                    type="url"
                    value={videoSource.url}
                    onChange={(e) => setVideoSource(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="https://example.com/video.mp4 or https://example.com/playlist.m3u8"
                    className="form-input"
                  />
                  <span className="input-hint">Supports: MP4 URL, HLS (.m3u8), DASH</span>
                </div>
              )}

              {videoSource.method === 'streaming' && (
                <div className="form-group">
                  <label>Streaming Provider</label>
                  <select
                    value={videoSource.streamingProvider}
                    onChange={(e) => setVideoSource(prev => ({ ...prev, streamingProvider: e.target.value }))}
                    className="form-select"
                  >
                    <option value="">Select provider</option>
                    <option value="youtube">YouTube</option>
                    <option value="vimeo">Vimeo</option>
                    <option value="dailymotion">Dailymotion</option>
                    <option value="custom">Custom CDN</option>
                  </select>
                  {videoSource.streamingProvider === 'custom' && (
                    <input
                      type="url"
                      value={videoSource.url}
                      onChange={(e) => setVideoSource(prev => ({ ...prev, url: e.target.value }))}
                      placeholder="https://cdn.example.com/video.m3u8"
                      className="form-input"
                      style={{ marginTop: '8px' }}
                    />
                  )}
                </div>
              )}
              {errors.video && <span className="error-text">{errors.video}</span>}
            </div>
          </div>
        );

      case 'subtitles':
        return (
          <div className="section-content">
            <div className="subtitles-section">
              <div className="section-header-actions">
                <h4>Subtitles</h4>
                <button className="btn btn-primary btn-sm" onClick={handleAddSubtitle}>
                  <FaPlus /> Add Subtitle
                </button>
              </div>

              {subtitles.length === 0 ? (
                <div className="empty-state">
                  <MdSubtitles size={32} />
                  <p>No subtitles added</p>
                  <button className="btn btn-primary btn-sm" onClick={handleAddSubtitle}>
                    Add Subtitle
                  </button>
                </div>
              ) : (
                <div className="subtitles-list">
                  {subtitles.map((subtitle) => (
                    <div key={subtitle.id} className="subtitle-item">
                      <div className="subtitle-fields">
                        <div className="form-group">
                          <label>Language</label>
                          <input
                            type="text"
                            value={subtitle.language}
                            onChange={(e) => handleSubtitleChange(subtitle.id, 'language', e.target.value)}
                            placeholder="English"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Label</label>
                          <input
                            type="text"
                            value={subtitle.label}
                            onChange={(e) => handleSubtitleChange(subtitle.id, 'label', e.target.value)}
                            placeholder="English Subtitles"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group file-upload-group">
                          <label>Subtitle File</label>
                          <input
                            type="file"
                            accept=".vtt,.srt,.ass,.ssa"
                            onChange={(e) => handleSubtitleFile(subtitle.id, e.target.files[0])}
                            className="form-input-file"
                          />
                          {subtitle.url && <span className="file-uploaded">✓ File uploaded</span>}
                          {subtitle.isUploading && (
                            <div className="upload-progress small">
                              <div className="progress-bar" style={{ width: `${subtitle.uploadProgress}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={subtitle.isDefault}
                              onChange={(e) => handleSubtitleChange(subtitle.id, 'isDefault', e.target.checked)}
                            />
                            Default
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={subtitle.forced}
                              onChange={(e) => handleSubtitleChange(subtitle.id, 'forced', e.target.checked)}
                            />
                            Forced
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={subtitle.enabled}
                              onChange={(e) => handleSubtitleChange(subtitle.id, 'enabled', e.target.checked)}
                            />
                            Enabled
                          </label>
                        </div>
                      </div>
                      <button
                        className="remove-item"
                        onClick={() => handleRemoveSubtitle(subtitle.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'audio':
        return (
          <div className="section-content">
            <div className="audio-section">
              <div className="section-header-actions">
                <h4>Audio Tracks</h4>
                <button className="btn btn-primary btn-sm" onClick={handleAddAudioTrack}>
                  <FaPlus /> Add Audio Track
                </button>
              </div>

              {audioTracks.length === 0 ? (
                <div className="empty-state">
                  <FaFileAudio size={32} />
                  <p>No audio tracks added</p>
                  <button className="btn btn-primary btn-sm" onClick={handleAddAudioTrack}>
                    Add Audio Track
                  </button>
                </div>
              ) : (
                <div className="audio-list">
                  {audioTracks.map((track) => (
                    <div key={track.id} className="audio-item">
                      <div className="audio-fields">
                        <div className="form-group">
                          <label>Language</label>
                          <input
                            type="text"
                            value={track.language}
                            onChange={(e) => handleAudioTrackChange(track.id, 'language', e.target.value)}
                            placeholder="English"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Label</label>
                          <input
                            type="text"
                            value={track.label}
                            onChange={(e) => handleAudioTrackChange(track.id, 'label', e.target.value)}
                            placeholder="English 5.1"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Codec</label>
                          <input
                            type="text"
                            value={track.codec}
                            onChange={(e) => handleAudioTrackChange(track.id, 'codec', e.target.value)}
                            placeholder="AAC"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Bitrate</label>
                          <input
                            type="text"
                            value={track.bitrate}
                            onChange={(e) => handleAudioTrackChange(track.id, 'bitrate', e.target.value)}
                            placeholder="320 kbps"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Channel Type</label>
                          <select
                            value={track.channelType}
                            onChange={(e) => handleAudioTrackChange(track.id, 'channelType', e.target.value)}
                            className="form-select"
                          >
                            <option value="">Select</option>
                            <option value="mono">Mono</option>
                            <option value="stereo">Stereo</option>
                            <option value="5.1">5.1 Surround</option>
                            <option value="7.1">7.1 Surround</option>
                          </select>
                        </div>
                        <div className="form-group file-upload-group">
                          <label>Audio File</label>
                          <input
                            type="file"
                            accept="audio/*"
                            onChange={(e) => handleAudioTrackFile(track.id, e.target.files[0])}
                            className="form-input-file"
                          />
                          {track.url && <span className="file-uploaded">✓ File uploaded</span>}
                          {track.isUploading && (
                            <div className="upload-progress small">
                              <div className="progress-bar" style={{ width: `${track.uploadProgress}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={track.isDefault}
                              onChange={(e) => handleAudioTrackChange(track.id, 'isDefault', e.target.checked)}
                            />
                            Default
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={track.enabled}
                              onChange={(e) => handleAudioTrackChange(track.id, 'enabled', e.target.checked)}
                            />
                            Enabled
                          </label>
                        </div>
                      </div>
                      <button
                        className="remove-item"
                        onClick={() => handleRemoveAudioTrack(track.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'qualities':
        return (
          <div className="section-content">
            <div className="qualities-section">
              <div className="section-header-actions">
                <h4>Video Qualities</h4>
                <button className="btn btn-primary btn-sm" onClick={handleAddQuality}>
                  <FaPlus /> Add Quality
                </button>
              </div>

              {qualities.length === 0 ? (
                <div className="empty-state">
                  <FaFileVideo size={32} />
                  <p>No qualities added</p>
                  <button className="btn btn-primary btn-sm" onClick={handleAddQuality}>
                    Add Quality
                  </button>
                </div>
              ) : (
                <div className="qualities-list">
                  {qualities.map((quality) => (
                    <div key={quality.id} className="quality-item">
                      <div className="quality-fields">
                        <div className="form-group">
                          <label>Label</label>
                          <input
                            type="text"
                            value={quality.label}
                            onChange={(e) => handleQualityChange(quality.id, 'label', e.target.value)}
                            placeholder="HD"
                            className="form-input"
                          />
                        </div>
                        <div className="form-group">
                          <label>Resolution</label>
                          <select
                            value={quality.resolution}
                            onChange={(e) => handleQualityChange(quality.id, 'resolution', e.target.value)}
                            className="form-select"
                          >
                            <option value="">Select resolution</option>
                            <option value="240p">240p</option>
                            <option value="360p">360p</option>
                            <option value="480p">480p</option>
                            <option value="720p">720p</option>
                            <option value="1080p">1080p</option>
                            <option value="1440p">1440p</option>
                            <option value="2160p">2160p</option>
                          </select>
                        </div>
                        <div className="form-group file-upload-group">
                          <label>Video File</label>
                          <input
                            type="file"
                            accept="video/*"
                            onChange={(e) => handleQualityFile(quality.id, e.target.files[0])}
                            className="form-input-file"
                          />
                          {quality.url && <span className="file-uploaded">✓ File uploaded</span>}
                          {quality.isUploading && (
                            <div className="upload-progress small">
                              <div className="progress-bar" style={{ width: `${quality.uploadProgress}%` }} />
                            </div>
                          )}
                        </div>
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={quality.isDefault}
                              onChange={(e) => handleQualityChange(quality.id, 'isDefault', e.target.checked)}
                            />
                            Default
                          </label>
                          <label>
                            <input
                              type="checkbox"
                              checked={quality.enabled}
                              onChange={(e) => handleQualityChange(quality.id, 'enabled', e.target.checked)}
                            />
                            Enabled
                          </label>
                        </div>
                      </div>
                      <button
                        className="remove-item"
                        onClick={() => handleRemoveQuality(quality.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );

      case 'status':
        return (
          <div className="section-content">
            <div className="status-section">
              <div className="form-group">
                <label>Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="form-select"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="hidden">Hidden</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="form-select"
                >
                  <option value="visible">Visible</option>
                  <option value="hidden">Hidden</option>
                  <option value="members">Members Only</option>
                  <option value="premium">Premium Only</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'schedule':
        return (
          <div className="section-content">
            <div className="schedule-section">
              <div className="form-grid">
                <div className="form-group">
                  <label>Publish Date</label>
                  <input
                    type="date"
                    value={schedule.publishDate}
                    onChange={(e) => setSchedule(prev => ({ ...prev, publishDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Publish Time</label>
                  <input
                    type="time"
                    value={schedule.publishTime}
                    onChange={(e) => setSchedule(prev => ({ ...prev, publishTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Expire Date</label>
                  <input
                    type="date"
                    value={schedule.expireDate}
                    onChange={(e) => setSchedule(prev => ({ ...prev, expireDate: e.target.value }))}
                    className="form-input"
                  />
                </div>
                <div className="form-group">
                  <label>Expire Time</label>
                  <input
                    type="time"
                    value={schedule.expireTime}
                    onChange={(e) => setSchedule(prev => ({ ...prev, expireTime: e.target.value }))}
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="section-content">
            <div className="seo-section">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label>SEO Title</label>
                  <input
                    type="text"
                    value={seo.title}
                    onChange={(e) => setSeo(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="SEO title (max 60 chars)"
                    className="form-input"
                    maxLength="60"
                  />
                  <span className="character-count">{seo.title.length}/60</span>
                </div>

                <div className="form-group full-width">
                  <label>SEO Description</label>
                  <textarea
                    value={seo.description}
                    onChange={(e) => setSeo(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="SEO description (max 160 chars)"
                    rows={3}
                    className="form-textarea"
                    maxLength="160"
                  />
                  <span className="character-count">{seo.description.length}/160</span>
                </div>

                <div className="form-group full-width">
                  <label>SEO Keywords</label>
                  <input
                    type="text"
                    value={seo.keywords}
                    onChange={(e) => setSeo(prev => ({ ...prev, keywords: e.target.value }))}
                    placeholder="keyword1, keyword2, keyword3"
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Canonical URL</label>
                  <input
                    type="url"
                    value={seo.canonicalUrl}
                    onChange={(e) => setSeo(prev => ({ ...prev, canonicalUrl: e.target.value }))}
                    placeholder="https://example.com/movie/..."
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Open Graph Image URL</label>
                  <input
                    type="url"
                    value={seo.ogImage}
                    onChange={(e) => setSeo(prev => ({ ...prev, ogImage: e.target.value }))}
                    placeholder="https://example.com/og-image.jpg"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>Twitter Image URL</label>
                  <input
                    type="url"
                    value={seo.twitterImage}
                    onChange={(e) => setSeo(prev => ({ ...prev, twitterImage: e.target.value }))}
                    placeholder="https://example.com/twitter-image.jpg"
                    className="form-input"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="movie-add-page">
      <div className="page-header">
        <div className="page-header-left">
          <button className="btn btn-secondary" onClick={() => navigate('/admin/movies')}>
            <FaArrowLeft /> Back
          </button>
          <h1>Add New Movie</h1>
        </div>
        <div className="page-header-right">
          {lastSaved && (
            <span className="auto-save-status">
              <FaCheck color="var(--success)" /> Auto-saved {format(lastSaved, 'hh:mm:ss a')}
            </span>
          )}
          <button className="btn btn-secondary" onClick={handleDiscard}>
            <FaTimes /> Discard
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={isLoading}>
            {isLoading ? <FaSpinner className="spinning" /> : <FaSave />}
            {isLoading ? 'Saving...' : 'Save Movie'}
          </button>
        </div>
      </div>

      {errors.submit && (
        <div className="error-banner">
          <FaExclamationTriangle />
          <span>{errors.submit}</span>
        </div>
      )}

      {success && (
        <div className="success-banner">
          <FaCheckCircle />
          <span>Movie saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="movie-add-layout">
        <div className="movie-add-sidebar">
          <div className="section-nav">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  className={`section-nav-item ${activeSection === section.id ? 'active' : ''}`}
                  onClick={() => setActiveSection(section.id)}
                >
                  <Icon size={16} />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="movie-add-content">
          <div className="movie-add-form">
            <div id={`section-${activeSection}`} className="form-section">
              <div className="section-header">
                <h2>{sections.find(s => s.id === activeSection)?.label}</h2>
              </div>
              {renderSection(activeSection)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MovieAdd;
