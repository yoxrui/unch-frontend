"use client";
import { useState, useRef } from "react";
import { Loader2 } from "lucide-react";
import "./ChartModal.css";
import { useLanguage } from "../../contexts/LanguageContext";
import AudioControls from "../audio-control/AudioControls";
import AudioVisualizer from "../audio-visualizer/AudioVisualizer";

const ModalInput = ({ id, label, value, onChange, maxLength, placeholder, required = false, type = "text", inputMode, min = undefined, max = undefined }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char-count ${value?.length >= maxLength ? 'limit-reached' : ''}`}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      maxLength={maxLength}
      placeholder={placeholder}
      required={required}
      inputMode={inputMode}
      min={min}
      max={max}
    />
  </div>
);

const ModalTextarea = ({ id, label, value, onChange, maxLength, placeholder }) => (
  <div className="form-group">
    <div className="label-row">
      <label htmlFor={id}>{label}</label>
      {maxLength && (
        <span className={`char-count ${value?.length >= maxLength ? 'limit-reached' : ''}`}>
          {value?.length || 0}/{maxLength}
        </span>
      )}
    </div>
    <textarea
      id={id}
      value={value}
      onChange={onChange}
      rows="4"
      maxLength={maxLength}
      placeholder={placeholder}
    />
  </div>
);

export default function ChartModal({
  isOpen,
  mode,
  form,
  onClose,
  onSubmit,
  onUpdate,
  loading = false,
  editData = null
}) {
  const { t } = useLanguage();
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});

  const handlePlay = (audioId) => {
    if (currentlyPlaying && currentlyPlaying !== audioId) {
      const currentAudio = audioRefs.current[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }
    setCurrentlyPlaying(audioId);
  };

  const handleStop = (audioId) => {
    setCurrentlyPlaying(null);
  };

  const handleAudioRef = (audioId, ref) => {
    audioRefs.current[audioId] = ref;
  };

  const checkFileLimit = (limit, updateHandler) => (e) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].size > limit) {
        alert(`File is too large! Maximum size is ${Math.floor(limit / 1024 / 1024)}MB.`);
        e.target.value = "";
        return;
      }
    }
    updateHandler(e);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="edit-container">
        <div className="modal-header">
          <strong>
            {mode === "edit"
              ? (editData && editData.title ? `Edit: ${editData.title}` : "Edit Chart")
              : "Upload New Chart"
            }
          </strong>
          <button type="button" onClick={onClose} aria-label="Close" className="close-btn">✕</button>
        </div>
        <div className="modal-content">
          {/* Edit Form */}
          <div className="meta-form" hidden={mode !== "edit"}>
            <form onSubmit={onSubmit}>
              <ModalInput id="title_edit" label="Song Title" value={form.title} onChange={onUpdate("title")} maxLength={50} placeholder="e.g. Freedom Dive" />
              <ModalInput id="artists_edit" label="Artist(s)" value={form.artists} onChange={onUpdate("artists")} maxLength={50} placeholder="e.g. xi" />
              <ModalInput id="author_edit" label="Charter Name" value={form.author} onChange={onUpdate("author")} maxLength={50} placeholder="Your Name" />

              <ModalInput id="rating_edit" label="Level" value={form.rating} onChange={onUpdate("rating")} placeholder="e.g. 25" type="number" inputMode="numeric" min={-999} max={999} />

              <ModalTextarea id="description_edit" label="Description (Optional)" value={form.description} onChange={onUpdate("description")} maxLength={1000} placeholder="Tell us about your chart..." />

              <ModalInput id="tags_edit" label="Tags (comma separated)" value={form.tags} onChange={onUpdate("tags")} placeholder="e.g. Anime, Rhythm, Fast" />

              <div className="form-group">
                <label htmlFor="visibility_edit">Visibility</label>
                <select
                  id="visibility_edit"
                  value={form.visibility || "public"}
                  onChange={onUpdate("visibility")}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="form-group file-section">
                <label htmlFor="jacket_edit">Cover Image (png, max 5MB)</label>
                <input
                  id="jacket_edit"
                  type="file"
                  accept="image/png"
                  onChange={checkFileLimit(5 * 1024 * 1024, onUpdate("jacket"))}
                />
                {editData && editData.jacketUrl && !form.jacket && (
                  <div className="file-preview">
                    <img src={editData.jacketUrl} alt="Current jacket" />
                    <span>Current: {editData.jacketUrl.split('/').pop()}</span>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="bgm_edit">Audio (max 20MB)</label>
                <input
                  id="bgm_edit"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(20 * 1024 * 1024, onUpdate("bgm"))}
                />
                {editData && editData.bgmUrl && !form.bgm && (
                  <div className="file-preview">
                    <span>Current: {editData.bgmUrl.split('/').pop()}</span>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.bgmUrl}
                        onPlay={() => handlePlay('edit-bgm')}
                        onStop={() => handleStop('edit-bgm')}
                        isPlaying={currentlyPlaying === 'edit-bgm'}
                        isActive={currentlyPlaying === 'edit-bgm'}
                        audioRef={(ref) => handleAudioRef('edit-bgm', ref)}
                      />
                      {currentlyPlaying === 'edit-bgm' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-bgm']}
                          isPlaying={currentlyPlaying === 'edit-bgm'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_edit">Chart (.SUS/.USC, max 10MB)</label>
                <input
                  id="chart_edit"
                  type="file"
                  onChange={checkFileLimit(10 * 1024 * 1024, onUpdate("chart"))}
                />
                {editData && editData.chartUrl && !form.chart && (
                  <div className="file-preview">
                    <span>Current Chart File</span>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_edit">Preview Audio (Optional)</label>
                <input
                  id="preview_edit"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(20 * 1024 * 1024, onUpdate("preview"))}
                />
                {editData && editData.previewUrl && !form.preview && (
                  <div className="file-preview">
                    <span>Current: {editData.previewUrl.split('/').pop()}</span>
                    <div className="audio-preview-container">
                      <AudioControls
                        bgmUrl={editData.previewUrl}
                        onPlay={() => handlePlay('edit-preview')}
                        onStop={() => handleStop('edit-preview')}
                        isPlaying={currentlyPlaying === 'edit-preview'}
                        isActive={currentlyPlaying === 'edit-preview'}
                        audioRef={(ref) => handleAudioRef('edit-preview', ref)}
                      />
                      {currentlyPlaying === 'edit-preview' && (
                        <AudioVisualizer
                          audioRef={audioRefs.current['edit-preview']}
                          isPlaying={currentlyPlaying === 'edit-preview'}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_edit">Background Image (Optional)</label>
                <input
                  id="background_edit"
                  type="file"
                  accept="image/png"
                  onChange={checkFileLimit(5 * 1024 * 1024, onUpdate("background"))}
                />
                {editData && editData.backgroundUrl && editData.has_bg && !form.background && (
                  <div className="file-preview">
                    <img src={editData.backgroundUrl} alt="Current Background" />
                  </div>
                )}
              </div>

              <button className="edit-save-btn" type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </div>

          {/* Upload Form */}
          <div className="upload-form" hidden={mode !== "upload"}>
            <div className="modal-reminders">
              <h4>⚠️ Read before uploading:</h4>
              <ul>
                <li>Do not upload stolen content or charts you do not have permission to distribute.</li>
                <li>Ensure audio is properly trimmed and under 20MB.</li>
                <li>Chart files must be .sus or .usc format (max 10MB).</li>
                <li>Cover images should be square (max 5MB).</li>
              </ul>
            </div>
            <form onSubmit={onSubmit}>
              <ModalInput id="title_up" label="Song Title *" value={form.title} onChange={onUpdate("title")} maxLength={50} placeholder="e.g. Bad Apple!!" required />
              <ModalInput id="artists_up" label="Artist(s) *" value={form.artists} onChange={onUpdate("artists")} maxLength={50} placeholder="e.g. Alstroemeria Records" required />
              <ModalInput id="author_up" label="Charter Name *" value={form.author} onChange={onUpdate("author")} maxLength={50} placeholder="Your username" required />

              <ModalInput id="rating_up" label="Level *" value={form.rating} onChange={onUpdate("rating")} placeholder="e.g. 28" required type="number" inputMode="numeric" min={-999} max={999} />

              <ModalTextarea id="description_up" label="Description (Optional)" value={form.description} onChange={onUpdate("description")} maxLength={1000} placeholder="Any comments or details..." />

              <ModalInput id="tags_up" label="Tags" value={form.tags} onChange={onUpdate("tags")} placeholder="e.g. Touhou, Vocaloid" />

              <div className="form-group">
                <label htmlFor="visibility_up">Visibility *</label>
                <select
                  id="visibility_up"
                  value={form.visibility || "public"}
                  onChange={onUpdate("visibility")}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div className="form-group file-section">
                <label htmlFor="jacket_up">Cover Image * (max 5MB)</label>
                <input
                  id="jacket_up"
                  type="file"
                  accept="image/png,image/jpeg,image/jp2,image/avif,image/x-icon,image/icns"
                  onChange={checkFileLimit(5 * 1024 * 1024, onUpdate("jacket"))}
                  required
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="bgm_up">Audio File * (mp3, max 20MB)</label>
                <input
                  id="bgm_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(20 * 1024 * 1024, onUpdate("bgm"))}
                  required
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="chart_up">Chart File * (.SUS/.USC, max 10MB)</label>
                <input
                  id="chart_up"
                  type="file"
                  onChange={checkFileLimit(10 * 1024 * 1024, onUpdate("chart"))}
                  required
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="preview_up">Preview Audio (Optional)</label>
                <input
                  id="preview_up"
                  type="file"
                  accept="audio/mp3, audio/mpeg"
                  onChange={checkFileLimit(20 * 1024 * 1024, onUpdate("preview"))}
                />
              </div>

              <div className="form-group file-section">
                <label htmlFor="background_up">Background Image (Optional)</label>
                <input
                  id="background_up"
                  type="file"
                  accept="image/png"
                  onChange={checkFileLimit(1024 * 1024 * 1024, onUpdate("background"))}
                />
              </div>

              <button
                className="upload-save-btn"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    {"Uploading..."}
                  </>
                ) : (
                  "Upload Chart"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
