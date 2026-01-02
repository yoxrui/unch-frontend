"use client";
import { Heart, Music, User, Play, Pause, MessageSquare } from "lucide-react";
import { useRef, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import "./HomepageChartCard.css";
import { useLanguage } from "../../contexts/LanguageContext";

export default function HomepageChartCard({
    chart,
    index = 0,
    showPlayButton = true,
    onPlay,
    onStop,
    isPlaying = false,
    audioRef
}) {
    const { t } = useLanguage();
    const router = useRouter();
    const {
        id,
        title,
        artists,
        author,
        rating,
        coverUrl,
        likeCount,
        bgmUrl,
        backgroundUrl,
        backgroundV3Url,
        commentsCount: initialCommentsCount
    } = chart;

    const [isMobile, setIsMobile] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const localAudioRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.matchMedia("(max-width: 768px)").matches || 'ontouchstart' in window);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (audioRef && localAudioRef.current) {
            audioRef(localAudioRef.current);
        }
    }, [audioRef]);

    useEffect(() => {
        if (localAudioRef.current) {
            if (isPlaying) {
                localAudioRef.current.play().catch(e => { });
            } else {
                localAudioRef.current.pause();
                localAudioRef.current.currentTime = 0;
            }
        }
    }, [isPlaying]);

    const [commentsCount, setCommentsCount] = useState(initialCommentsCount || 0);

    useEffect(() => {
        const fetchComments = async () => {
            try {
                const apiBase = process.env.NEXT_PUBLIC_API_URL;
                const cleanId = id.toString().replace('UnCh-', '');
                const res = await fetch(`${apiBase}/api/charts/${cleanId}/comment`);
                if (res.ok) {
                    const data = await res.json();
                    const list = Array.isArray(data) ? data : (data.data || []);
                    setCommentsCount(list.length);
                }
            } catch (e) {
            }
        };

        if (id) {
            fetchComments();
        }
    }, [id]);

    const handleMouseEnter = () => {
        if (isMobile) return;
        setIsHovered(true);
        if (onPlay && !isPlaying) {
            onPlay(id, bgmUrl);
        }
    };

    const handleMouseLeave = () => {
        if (isMobile) return;
        setIsHovered(false);
        if (onStop && isPlaying) {
            onStop(id);
        }
    };

    const handleCardClick = (e) => {
        if (e.target.closest('button')) return;

        if (isMobile) {
            if (isPlaying) {
                router.push(`/levels/UnCh-${encodeURIComponent(id)}`);
            } else {
                if (onPlay) onPlay(id, bgmUrl);
            }
        } else {
            router.push(`/levels/UnCh-${encodeURIComponent(id)}`);
        }
    };

    const bgImage = backgroundUrl || backgroundV3Url || coverUrl || "/placeholder.jpg";

    return (
        <div
            className={`homepage-chart-card animate-fade-in-up ${isPlaying ? 'playing' : ''}`}
            style={{ "--index": index, cursor: 'pointer' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onClick={handleCardClick}
        >
            <div
                className={`card-bg-blur ${isHovered ? 'hovered' : ''}`}
                style={{
                    backgroundImage: `url(${bgImage})`
                }}
            />

            <div className={`card-image-container ${isHovered || (isMobile && isPlaying) ? 'disc-mode' : ''}`}>
                <div className="card-image-wrapper">
                    {coverUrl ? (
                        <div className="disc-wrapper">
                            <img src={coverUrl} alt={title} className="card-cover" loading="lazy" />
                            <div className="disc-center-hole"></div>
                        </div>
                    ) : (
                        <div className="card-cover placeholder">
                            <span>No Image</span>
                        </div>
                    )}
                </div>

                {!isHovered && (
                    <div className="card-overlay">
                        <button
                            className={`play-btn ${isPlaying ? "playing" : ""}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (isPlaying && onStop) onStop(id);
                                else if (onPlay) onPlay(id, bgmUrl);
                            }}
                        >
                            {isPlaying ? <Pause size={24} className="text-blue-500" /> : <Play size={24} className="text-blue-500" />}
                        </button>
                    </div>
                )}

                <div className="level-badge">Lv.{rating}</div>
            </div>

            <div className="card-content">
                <div className="card-title-wrapper">
                    <h3 className="card-title" title={title}>{title}</h3>
                </div>

                <div className="card-meta">
                    <div className="meta-item">
                        <Music size={14} />
                        <span className="info-artists" title={artists}>{t('hero.by')}: {artists}</span>
                    </div>
                </div>

                <div className="card-footer">
                    <div className="author-info">
                        <User size={14} />
                        <span className="truncate">{author}</span>
                    </div>
                    <div className="likes-info">
                        <Heart size={14} className={likeCount > 0 ? "text-red-400 fill-current" : ""} />
                        <span>{likeCount}</span>
                    </div>
                    <div className="likes-info" style={{ marginLeft: '8px' }}>
                        <MessageSquare size={14} className="text-blue-400" />
                        <span>{commentsCount}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
