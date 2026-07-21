import React, { useState, useEffect, useRef } from 'react';
import { storage } from '../../firebase/config';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import {
  FaPlus,
  FaTrash,
  FaTimes,
  FaCloudUploadAlt,
  FaImage,
  FaVideo,
  FaFileAudio,
  FaChevronUp,
  FaChevronDown,
  FaInfoCircle
} from 'react-icons/fa';
import { MdSubtitles } from 'react-icons/md';

const MovieForm = ({ initialData, onSubmit, isEditing = false }) => {
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

  const [media, setMedia] = useState({
    banner: { url: '', preview: '' },
    poster: { url: '', preview: '' },
    thumbnail: { url: '', preview: '' },
    backdrops: []
  });

  const [videoSource, setVideoSource] = useState({
    method: 'url',
    url: '',
    file: null
  });

  const [subtitles, setSubtitles] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [qualities, setQualities] = useState([]);
  const [status, setStatus] = useState('draft');
  const [visibility, setVisibility] = useState('visible');
  const [schedule, setSchedule] = useState({
    publishDate: '',
    publishTime: '',
    expireDate: '',
    expireTime: ''
  });
  const [seo, setSeo] = useState({
    title: '',
    description: '',
    keywords: '',
    canonicalUrl: '',
    ogImage: '',
    twitterImage: ''
  });

  const [activeSection, setActiveSection] = useState('basic');
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        originalTitle: initialData.originalTitle || '',
        shortTitle: initialData.shortTitle || '',
        slug: initialData.slug || '',
        description: initialData.description || '',
        shortDescription: initialData.shortDescription || '',
        tagline: initialData.tagline || '',
        releaseYear: initialData.releaseYear || '',
        releaseDate: initialData.releaseDate || '',
        duration: initialData.duration || '',
        country: initialData.country || '',
        productionCompany: initialData.productionCompany || '',
        director: initialData.director || '',
        producer: initialData.producer || '',
        writer: initialData.writer || '',
        cast: initialData.cast || [],
        language: initialData.language || '',
        subtitleLanguages: initialData.subtitleLanguages || [],
        genres: initialData.genres || [],
        categories: initialData.categories || [],
        tags: initialData.tags || [],
        keywords: initialData.keywords || '',
        ageRating: initialData.ageRating || '',
        imdbRating: initialData.imdbRating || '',
        tmdbId: initialData.tmdbId || ''
      });

      setMedia({
        banner: { url: initialData.banner || '', preview: initialData.banner || '' },
        poster: { url: initialData.poster || '', preview: initialData.poster || '' },
        thumbnail: { url: initialData.thumbnail || '', preview: initialData.thumbnail || '' },
        backdrops: (initialData.backdrops || []).map(url => ({ url, preview: url }))
      });

      setVideoSource({
        method: initialData.videoMethod || 'url',
        url: initialData.videoSource || '',
        file: null
      });

      setSubtitles(initialData.subtitles || []);
      setAudioTracks(initialData.audioTracks || []);
      setQualities(initialData.qualities || []);
      setStatus(initialData.status || 'draft');
      setVisibility(initialData.visibility || 'visible');
      setSchedule(initialData.schedule || { publishDate: '', publishTime: '', expireDate: '', expireTime: '' });
      setSeo(initialData.seo || { title: '', description: '', keywords: '', canonicalUrl: '', ogImage: '', twitterImage: '' });
    }
  }, [initialData]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleArrayInput = (field, value) => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, [field]: items }));
  };

  const handleFileUpload = async (type, file) => {
    if (!file) return;
    
    const storageRef = ref(storage, `${type}s/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        // Update progress state if needed
      },
      (error) => {
        console.error('Upload error:', error);
      },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        
        if (type === 'banner') {
          setMedia(prev => ({ ...prev, banner: { url, preview: url } }));
        } else if (type === 'poster') {
          setMedia(prev => ({ ...prev, poster: { url, preview: url } }));
        } else if (type === 'thumbnail') {
          setMedia(prev => ({ ...prev, thumbnail: { url, preview: url } }));
        } else if (type === 'backdrop') {
          setMedia(prev => ({ 
            ...prev, 
            backdrops: [...prev.backdrops, { url, preview: url }] 
          }));
        } else if (type === 'video') {
          setVideoSource(prev => ({ ...prev, url, file: null }));
        }
      }
    );
  };

  const sections = [
    { id: 'basic', label: 'Basic Info', icon: 'info' },
    { id: 'media', label: 'Media', icon: 'image' },
    { id: 'video', label: 'Video', icon: 'video' },
    { id: 'subtitles', label: 'Subtitles', icon: 'subtitles' },
    { id: 'audio', label: 'Audio', icon: 'audio' },
    { id: 'qualities', label: 'Qualities', icon: 'quality' },
    { id: 'status', label: 'Status', icon: 'status' },
    { id: 'seo', label: 'SEO', icon: 'seo' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      ...media,
      videoSource: videoSource.url,
      videoMethod: videoSource.method,
      subtitles,
      audioTracks,
      qualities,
      status,
      visibility,
      schedule,
      seo
    };
    onSubmit(data);
  };

  const renderSection = (sectionId) => {
    switch (sectionId) {
      case 'basic':
        return (
          <div className="form-section-content">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Title *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter movie title"
                  className={`form-input ${errors.title ? 'error' : ''}`}
                />
              </div>
              <div className="form-group full-width">
                <label>Description *</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Full movie description"
                  rows={4}
                  className="form-textarea"
                />
              </div>
              <div className="form-group">
                <label>Release Year</label>
                <input
                  type="number"
                  name="releaseYear"
                  value={formData.releaseYear}
                  onChange={handleInputChange}
                  placeholder="2024"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Duration (minutes)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="120"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Language</label>
                <input
                  type="text"
                  name="language"
                  value={formData.language}
                  onChange={handleInputChange}
                  placeholder="English"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Categories (comma separated)</label>
                <input
                  type="text"
                  value={formData.categories.join(', ')}
                  onChange={(e) => handleArrayInput('categories', e.target.value)}
                  placeholder="Action, Drama, Comedy"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Genres (comma separated)</label>
                <input
                  type="text"
                  value={formData.genres.join(', ')}
                  onChange={(e) => handleArrayInput('genres', e.target.value)}
                  placeholder="Action, Thriller, Sci-Fi"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Cast (comma separated)</label>
                <input
                  type="text"
                  value={formData.cast.join(', ')}
                  onChange={(e) => handleArrayInput('cast', e.target.value)}
                  placeholder="Actor 1, Actor 2, Actor 3"
                  className="form-input"
                />
              </div>
            </div>
          </div>
        );

      case 'media':
        return (
          <div className="form-section-content">
            <div className="media-upload-grid">
              <div className="media-upload-card">
                <h4>Banner Image</h4>
                <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                  {media.banner.preview ? (
                    <img src={media.banner.preview} alt="Banner" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage size={32} />
                      <p>Upload Banner</p>
                      <span>1920×1080px</span>
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => handleFileUpload('banner', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="media-upload-card">
                <h4>Poster</h4>
                <div className="upload-area poster-upload" onClick={() => fileInputRef.current?.click()}>
                  {media.poster.preview ? (
                    <img src={media.poster.preview} alt="Poster" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage size={32} />
                      <p>Upload Poster</p>
                      <span>1000×1500px</span>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('poster', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div className="media-upload-card">
                <h4>Thumbnail</h4>
                <div className="upload-area" onClick={() => fileInputRef.current?.click()}>
                  {media.thumbnail.preview ? (
                    <img src={media.thumbnail.preview} alt="Thumbnail" />
                  ) : (
                    <div className="upload-placeholder">
                      <FaImage size={32} />
                      <p>Upload Thumbnail</p>
                      <span>1280×720px</span>
                    </div>
                  )}
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('thumbnail', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>

            <div className="backdrops-section">
              <h4>Backdrops</h4>
              <div className="backdrops-grid">
                {media.backdrops.map((backdrop, index) => (
                  <div key={index} className="backdrop-item">
                    <img src={backdrop.preview} alt={`Backdrop ${index + 1}`} />
                    <button
                      className="remove-backdrop"
                      onClick={() => setMedia(prev => ({
                        ...prev,
                        backdrops: prev.backdrops.filter((_, i) => i !== index)
                      }))}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
                <div className="backdrop-add" onClick={() => fileInputRef.current?.click()}>
                  <FaPlus size={24} />
                  <span>Add Backdrop</span>
                  <input
                    type="file"
                    onChange={(e) => handleFileUpload('backdrop', e.target.files[0])}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="form-section-content">
            <div className="form-group">
              <label>Video Source Method</label>
              <select
                value={videoSource.method}
                onChange={(e) => setVideoSource(prev => ({ ...prev, method: e.target.value }))}
                className="form-select"
              >
                <option value="url">External URL</option>
                <option value="upload">Upload File</option>
                <option value="streaming">Streaming Provider</option>
              </select>
            </div>

            {videoSource.method === 'url' && (
              <div className="form-group">
                <label>Video URL</label>
                <input
                  type="url"
                  value={videoSource.url}
                  onChange={(e) => setVideoSource(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/video.mp4 or .m3u8"
                  className="form-input"
                />
                <span className="input-hint">Supports: MP4, HLS (.m3u8), DASH</span>
              </div>
            )}

            {videoSource.method === 'upload' && (
              <div className="upload-dropzone" onClick={() => fileInputRef.current?.click()}>
                <FaCloudUploadAlt size={32} />
                <p>Click to upload video</p>
                <span>MP4, WebM, OGG</span>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload('video', e.target.files[0])}
                  accept="video/*"
                  style={{ display: 'none' }}
                />
              </div>
            )}

            {videoSource.method === 'streaming' && (
              <div className="form-group">
                <label>Streaming Provider URL</label>
                <input
                  type="url"
                  value={videoSource.url}
                  onChange={(e) => setVideoSource(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://cdn.example.com/playlist.m3u8"
                  className="form-input"
                />
              </div>
            )}
          </div>
        );

      case 'subtitles':
        return (
          <div className="form-section-content">
            <div className="subtitles-header">
              <h4>Subtitles</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setSubtitles(prev => [...prev, {
                  id: Date.now(),
                  language: '',
                  label: '',
                  url: '',
                  isDefault: false,
                  forced: false,
                  enabled: true
                }])}
              >
                <FaPlus /> Add Subtitle
              </button>
            </div>

            {subtitles.map((subtitle, index) => (
              <div key={subtitle.id} className="subtitle-item">
                <div className="subtitle-fields">
                  <input
                    type="text"
                    value={subtitle.language}
                    onChange={(e) => {
                      const newSubtitles = [...subtitles];
                      newSubtitles[index].language = e.target.value;
                      setSubtitles(newSubtitles);
                    }}
                    placeholder="Language"
                    className="form-input"
                  />
                  <input
                    type="text"
                    value={subtitle.label}
                    onChange={(e) => {
                      const newSubtitles = [...subtitles];
                      newSubtitles[index].label = e.target.value;
                      setSubtitles(newSubtitles);
                    }}
                    placeholder="Label"
                    className="form-input"
                  />
                  <input
                    type="url"
                    value={subtitle.url}
                    onChange={(e) => {
                      const newSubtitles = [...subtitles];
                      newSubtitles[index].url = e.target.value;
                      setSubtitles(newSubtitles);
                    }}
                    placeholder="Subtitle URL (.vtt, .srt)"
                    className="form-input"
                  />
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={subtitle.isDefault}
                        onChange={(e) => {
                          const newSubtitles = [...subtitles];
                          newSubtitles[index].isDefault = e.target.checked;
                          setSubtitles(newSubtitles);
                        }}
                      />
                      Default
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={subtitle.enabled}
                        onChange={(e) => {
                          const newSubtitles = [...subtitles];
                          newSubtitles[index].enabled = e.target.checked;
                          setSubtitles(newSubtitles);
                        }}
                      />
                      Enabled
                    </label>
                  </div>
                </div>
                <button
                  className="remove-item"
                  onClick={() => setSubtitles(prev => prev.filter(s => s.id !== subtitle.id))}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        );

      case 'audio':
        return (
          <div className="form-section-content">
            <div className="audio-header">
              <h4>Audio Tracks</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setAudioTracks(prev => [...prev, {
                  id: Date.now(),
                  language: '',
                  label: '',
                  url: '',
                  isDefault: false,
                  codec: '',
                  bitrate: '',
                  channelType: '',
                  enabled: true
                }])}
              >
                <FaPlus /> Add Audio Track
              </button>
            </div>

            {audioTracks.map((track, index) => (
              <div key={track.id} className="audio-item">
                <div className="audio-fields">
                  <input
                    type="text"
                    value={track.language}
                    onChange={(e) => {
                      const newTracks = [...audioTracks];
                      newTracks[index].language = e.target.value;
                      setAudioTracks(newTracks);
                    }}
                    placeholder="Language"
                    className="form-input"
                  />
                  <input
                    type="text"
                    value={track.label}
                    onChange={(e) => {
                      const newTracks = [...audioTracks];
                      newTracks[index].label = e.target.value;
                      setAudioTracks(newTracks);
                    }}
                    placeholder="Label"
                    className="form-input"
                  />
                  <input
                    type="url"
                    value={track.url}
                    onChange={(e) => {
                      const newTracks = [...audioTracks];
                      newTracks[index].url = e.target.value;
                      setAudioTracks(newTracks);
                    }}
                    placeholder="Audio URL"
                    className="form-input"
                  />
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={track.isDefault}
                        onChange={(e) => {
                          const newTracks = [...audioTracks];
                          newTracks[index].isDefault = e.target.checked;
                          setAudioTracks(newTracks);
                        }}
                      />
                      Default
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={track.enabled}
                        onChange={(e) => {
                          const newTracks = [...audioTracks];
                          newTracks[index].enabled = e.target.checked;
                          setAudioTracks(newTracks);
                        }}
                      />
                      Enabled
                    </label>
                  </div>
                </div>
                <button
                  className="remove-item"
                  onClick={() => setAudioTracks(prev => prev.filter(a => a.id !== track.id))}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        );

      case 'qualities':
        return (
          <div className="form-section-content">
            <div className="qualities-header">
              <h4>Video Qualities</h4>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setQualities(prev => [...prev, {
                  id: Date.now(),
                  label: '',
                  resolution: '',
                  url: '',
                  isDefault: false,
                  enabled: true
                }])}
              >
                <FaPlus /> Add Quality
              </button>
            </div>

            {qualities.map((quality, index) => (
              <div key={quality.id} className="quality-item">
                <div className="quality-fields">
                  <input
                    type="text"
                    value={quality.label}
                    onChange={(e) => {
                      const newQualities = [...qualities];
                      newQualities[index].label = e.target.value;
                      setQualities(newQualities);
                    }}
                    placeholder="Quality Label"
                    className="form-input"
                  />
                  <select
                    value={quality.resolution}
                    onChange={(e) => {
                      const newQualities = [...qualities];
                      newQualities[index].resolution = e.target.value;
                      setQualities(newQualities);
                    }}
                    className="form-select"
                  >
                    <option value="">Select Resolution</option>
                    <option value="240p">240p</option>
                    <option value="360p">360p</option>
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="1440p">1440p</option>
                    <option value="2160p">2160p</option>
                  </select>
                  <input
                    type="url"
                    value={quality.url}
                    onChange={(e) => {
                      const newQualities = [...qualities];
                      newQualities[index].url = e.target.value;
                      setQualities(newQualities);
                    }}
                    placeholder="Video URL"
                    className="form-input"
                  />
                  <div className="checkbox-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={quality.isDefault}
                        onChange={(e) => {
                          const newQualities = [...qualities];
                          newQualities[index].isDefault = e.target.checked;
                          setQualities(newQualities);
                        }}
                      />
                      Default
                    </label>
                    <label>
                      <input
                        type="checkbox"
                        checked={quality.enabled}
                        onChange={(e) => {
                          const newQualities = [...qualities];
                          newQualities[index].enabled = e.target.checked;
                          setQualities(newQualities);
                        }}
                      />
                      Enabled
                    </label>
                  </div>
                </div>
                <button
                  className="remove-item"
                  onClick={() => setQualities(prev => prev.filter(q => q.id !== quality.id))}
                >
                  <FaTrash />
                </button>
              </div>
            ))}
          </div>
        );

      case 'status':
        return (
          <div className="form-section-content">
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
            <div className="form-group">
              <label>Publish Date</label>
              <input
                type="date"
                value={schedule.publishDate}
                onChange={(e) => setSchedule(prev => ({ ...prev, publishDate: e.target.value }))}
                className="form-input"
              />
            </div>
          </div>
        );

      case 'seo':
        return (
          <div className="form-section-content">
            <div className="form-group full-width">
              <label>SEO Title</label>
              <input
                type="text"
                value={seo.title}
                onChange={(e) => setSeo(prev => ({ ...prev, title: e.target.value }))}
                placeholder="SEO Title (max 60 chars)"
                maxLength="60"
                className="form-input"
              />
            </div>
            <div className="form-group full-width">
              <label>SEO Description</label>
              <textarea
                value={seo.description}
                onChange={(e) => setSeo(prev => ({ ...prev, description: e.target.value }))}
                placeholder="SEO Description (max 160 chars)"
                maxLength="160"
                rows="3"
                className="form-textarea"
              />
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="movie-form">
      <div className="movie-form-layout">
        <div className="movie-form-sidebar">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`form-nav-item ${activeSection === section.id ? 'active' : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </div>
        <div className="movie-form-content">
          <div className="form-section">
            {renderSection(activeSection)}
          </div>
        </div>
      </div>
    </form>
  );
};

export default MovieForm;
