'use client';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { Heart, MessageSquare, Share2, Copy, ExternalLink, ArrowLeft, User, Music, Play, Pause, Volume2, Star, Download, Eye } from 'lucide-react';
import WaveformPlayer from '../../../components/waveform-player/WaveformPlayer';
import { useLanguage } from '../../../contexts/LanguageContext';
import "./LevelCard.css";

export default function LevelCard({ level, SONOLUS_SERVER_URL }) {
  const router = useRouter();
  const { t } = useLanguage();
  const sonolusServerUrl = SONOLUS_SERVER_URL;
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformBars, setWaveformBars] = useState([]);
  const audioRef = useRef(null);

  const getSonolusLink = () => {
    if (!SONOLUS_SERVER_URL) return '';
    const serverWithoutSchema = SONOLUS_SERVER_URL.replace(/^https?:\/\//, '');
    return `https://open.sonolus.com/${serverWithoutSchema}/levels/UnCh-${level.id}`;
  };

  const handleCopyEmbed = async () => {
    const embedCode = `<!-- UntitledCharts Embed -->
<div style="position:relative;width:100%;max-width:500px;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.3);background:linear-gradient(135deg,#1e293b,#0f172a);">
  <a href="${typeof window !== 'undefined' ? window.location.href : ''}" target="_blank" style="display:flex;text-decoration:none;color:white;padding:16px;gap:16px;align-items:center;">
    <img src="${level.thumbnail || ''}" alt="${level.title}" style="width:80px;height:80px;border-radius:12px;object-fit:cover;box-shadow:0 4px 12px rgba(0,0,0,0.4);" />
    <div style="flex:1;">
      <div style="font-weight:700;font-size:1.1em;margin-bottom:4px;">${level.title}</div>
      <div style="color:#94a3b8;font-size:0.9em;margin-bottom:8px;">${t('levelDetail.by')} ${level.artists || t('common.unknownArtist')}</div>
      <div style="display:flex;gap:8px;">
        <span style="background:rgba(56,189,248,0.2);color:#38bdf8;padding:4px 10px;border-radius:20px;font-size:0.75em;">${t('levelDetail.level')} ${level.rating}</span>
        <span style="background:rgba(239,68,68,0.2);color:#f87171;padding:4px 10px;border-radius:20px;font-size:0.75em;">❤ ${level.likes || 0}</span>
      </div>
    </div>
  </a>
  <div style="text-align:center;padding:8px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.7em;color:#64748b;">${t('levelDetail.poweredBy')} UntitledCharts</div>
</div>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      alert(t('levelDetail.embedCopied'));
    } catch (e) {
      alert(`${t('levelDetail.failedToCopy')}: ${e.message}`);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: level.title,
        text: `Check out ${level.title} on UntitledCharts!`,
        url: window.location.href
      }).catch(console.error);
    } else {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href)
          .then(() => alert('Link copied!'))
          .catch(err => {
            console.error('Failed to copy: ', err);
            fallbackCopyTextToClipboard(window.location.href);
          });
      } else {
        fallbackCopyTextToClipboard(window.location.href);
      }
    }
  };

  const fallbackCopyTextToClipboard = (text) => {
    var textArea = document.createElement("textarea");
    textArea.value = text;


    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      var successful = document.execCommand('copy');
      var msg = successful ? 'successful' : 'unsuccessful';
      if (successful) alert('Link copied!');
      else alert('Failed to copy link');
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
      alert('Failed to copy link manually');
    }

    document.body.removeChild(textArea);
  };

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Playback failed", e));
      }
      setIsPlaying(!isPlaying);
    }
  };

  useEffect(() => {
    setWaveformBars(Array.from({ length: 50 }).map(() => ({
      height: 20 + Math.random() * 30,
      delay: Math.random() * 0.5
    })));

    const audio = audioRef.current;
    if (audio) {
      const updateTime = () => setCurrentTime(audio.currentTime);
      const updateDuration = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(audio.duration);
        }
      };

      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      audio.addEventListener('durationchange', updateDuration);
      audio.addEventListener('ended', () => setIsPlaying(false));


      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }


      audio.volume = volume;

      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
        audio.removeEventListener('durationchange', updateDuration);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const formatTime = (time) => {
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const bgmUrl = level.asset_base_url && level.music_hash
    ? `${level.asset_base_url}/${level.authorId || level.author}/${level.id}/${level.music_hash}`
    : null;

  const [showFullDesc, setShowFullDesc] = useState(false);
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      if (!level.id) return;
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL;
        const chartId = level.id.toString().replace('UnCh-', '');
        const res = await fetch(`${apiBase}/api/charts/${chartId}/comment`);

        if (res.ok) {
          const data = await res.json();
          const commentsList = Array.isArray(data) ? data : (data.data || []);
          setComments(commentsList);
        } else if (res.status === 404) {

          setComments([]);
        }
      } catch (e) {
        console.error("Failed to fetch comments", e);
      } finally {
        setLoadingComments(false);
      }
    };

    fetchComments();
  }, [level.id]);

  return (
    <main className="level-detail-wrapper animate-fade-in">
      <div
        className="level-bg-blur"
        style={{
          backgroundImage: level.backgroundV3Url ? `url(${level.backgroundV3Url})` :
            level.backgroundUrl ? `url(${level.backgroundUrl})` :
              level.thumbnail ? `url(${level.thumbnail})` : 'none'
        }}
      />

      <div className="back-btn-container">
        <button onClick={() => {
          if (window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }} className="back-btn">
          <ArrowLeft size={20} />
          {t('levelDetail.back')}
        </button>
      </div>

      <div className="level-detail-container">
        <div className="level-top-section">
          <div className="level-image-container">
            {level.thumbnail ? (
              <img
                src={level.thumbnail}
                className="level-cover"
                alt={level.title}
              />
            ) : (
              <div className="level-cover placeholder">
                <span>{t('common.noImage')}</span>
              </div>
            )}
          </div>

          <div className="level-info">
            <h1 className="level-title">{level.title}</h1>

            <div className="level-credits">
              <div className="level-credit-item">
                <span className="credit-label">{t('levelDetail.by')}</span>
                <span>{level.artists || 'Unknown Artist'}</span>
              </div>
              <div className="level-credit-item">
                <span className="credit-label">{t('levelDetail.chartedBy')}</span>
                <a href="#" className="charter-link">{level.author}</a>
              </div>
            </div>

            <div className="level-stats-row">
              <div className="level-rating-badge">
                Lv. {level.rating}
              </div>
              {level.tags && level.tags.map((tag, i) => (
                <span key={i} className="level-tag-item">
                  {typeof tag === 'object' ? tag.title : tag}
                </span>
              ))}
            </div>

            {level.description && (
              <div className="level-description">
                {level.description}
              </div>
            )}

            <div className="music-player">
              <div className="features-background">
                {bgmUrl && (
                  <WaveformPlayer
                    audioRef={audioRef}
                    isPlaying={isPlaying}
                  />
                )}
              </div>

              <div className="player-content-wrapper">
                <div className="player-info">
                  <div className={`player-disc-container ${isPlaying ? 'spinning' : ''}`}>
                    <div className="disc-wrapper-small">
                      <img
                        src={level.thumbnail}
                        className="level-cover-disc-small"
                        alt=""
                      />
                      <div className="disc-center-hole-small"></div>
                    </div>
                  </div>
                  <div className="player-text">
                    <span className="player-title">{level.title}</span>
                  </div>
                  <span className="player-duration">{formatTime(currentTime)} / {duration ? formatTime(duration) : '--:--'}</span>
                </div>

                <div className="player-controls">
                  <button className="play-btn" onClick={togglePlay}>
                    {isPlaying ? <Pause size={24} /> : <Play size={24} />}
                  </button>
                  { }
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="range"
                      min="0"
                      max={duration || 100}
                      value={currentTime}
                      onChange={(e) => {
                        const time = parseFloat(e.target.value);
                        setCurrentTime(time);
                        if (audioRef.current) audioRef.current.currentTime = time;
                      }}
                      className="player-progress-slider"
                      style={{
                        width: '100%',
                        height: '4px',
                        background: 'rgba(255,255,255,0.2)',
                        borderRadius: '2px',
                        appearance: 'none',
                        cursor: 'pointer'
                      }}
                    />
                  </div>

                  <div className="volume-control">
                    <Volume2 size={18} />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="volume-slider"
                      style={{ width: '60px' }}
                    />
                  </div>
                </div>
              </div>

              {bgmUrl && (
                <audio
                  ref={audioRef}
                  src={bgmUrl.startsWith('http') ? `/api/audio-proxy?url=${encodeURIComponent(bgmUrl)}` : bgmUrl}
                  preload="metadata"
                  style={{ display: 'none' }}
                  crossOrigin="anonymous"
                  onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
                  onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
                  onEnded={() => setIsPlaying(false)}
                  onError={(e) => console.warn("Audio error", e)}
                />
              )}
            </div>

            <div className="level-actions">
              <button
                onClick={() => window.open(getSonolusLink(), '_blank')}
                className="action-btn btn-sonolus"
              >
                {t('levelDetail.openViaSonolus')} <img src="/sonolus-text.png" alt="Sonolus" style={{ height: '1.2em', verticalAlign: 'middle', marginLeft: '6px' }} />
              </button>
              <button
                onClick={handleShare}
                className="action-btn"
              >
                <Share2 size={18} />
                {t('levelDetail.share')}
              </button>
            </div>

          </div>


        </div>
      </div>

      <div className="level-bottom-section">
        <div className="stats-card">
          <h3 className="stats-title">
            <Star size={18} fill="currentColor" />
            {t('levelDetail.statistics')}
          </h3>
          <div className="stats-list">
            <div className="stat-item">
              <Heart size={16} />
              <span className="stat-label">{t('levelDetail.likes')}</span>
              <span className="stat-value">{level.likes || 0}</span>
            </div>
            <div className="stat-item">
              <MessageSquare size={16} />
              <span className="stat-label">{t('levelDetail.comments')}</span>
              <span className="stat-value">{loadingComments ? (level.commentsCount || 0) : comments.length}</span>
            </div>
          </div>
        </div>

        <div className="comments-card" style={{ display: 'block' }}>
          <h3 className="stats-title" style={{ marginBottom: '20px' }}>
            <MessageSquare size={18} />
            {t('levelDetail.comments')} ({comments.length})
          </h3>

          {loadingComments ? (
            <p className="comments-placeholder">Loading comments...</p>
          ) : comments.length > 0 ? (
            <>
              <div className="comments-list" style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comments.slice((page - 1) * 5, page * 5).map((comment, i) => (
                  <div key={i} className="comment-item" style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '12px',
                    borderRadius: '12px',
                    border: '1px solid rgba(255,255,255,0.1)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: '600', color: '#38bdf8' }}>{comment.username || "User"}</span>
                      <span style={{ fontSize: '0.8em', color: 'rgba(255,255,255,0.5)' }}>
                        {comment.created_at ? new Date(comment.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)', fontSize: '0.95em' }}>{comment.content}</p>
                  </div>
                ))}
              </div>
              {comments.length > 5 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '20px' }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: page === 1 ? 'not-allowed' : 'pointer',
                      opacity: page === 1 ? 0.5 : 1
                    }}
                  >
                    Previous
                  </button>
                  <span style={{ display: 'flex', alignItems: 'center', color: '#94a3b8' }}>
                    {page} / {Math.ceil(comments.length / 5)}
                  </span>
                  <button
                    disabled={page >= Math.ceil(comments.length / 5)}
                    onClick={() => setPage(p => Math.min(Math.ceil(comments.length / 5), p + 1))}
                    style={{
                      padding: '8px 16px',
                      background: 'rgba(255,255,255,0.1)',
                      border: 'none',
                      borderRadius: '8px',
                      color: 'white',
                      cursor: page >= Math.ceil(comments.length / 5) ? 'not-allowed' : 'pointer',
                      opacity: page >= Math.ceil(comments.length / 5) ? 0.5 : 1
                    }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <p className="comments-placeholder">No comments yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
