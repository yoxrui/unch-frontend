"use client";
import "./page.css";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import ChartsList from "../../components/charts-list/ChartsList";
import PaginationControls from "../../components/pagination-controls/PaginationControls";
import ChartModal from "../../components/chart-modal/ChartModal";
import { useUser } from "../../contexts/UserContext";
import { useRouter } from "next/navigation";

const APILink = process.env.NEXT_PUBLIC_API_URL;

import { useLanguage } from "../../contexts/LanguageContext";

export default function Dashboard() {
  const router = useRouter();
  const { t } = useLanguage();
  const {
    sonolusUser,
    session,
    isSessionValid,
    clearExpiredSession,
    isClient,
    sessionReady,
  } = useUser();
  useEffect(() => {
    if (sessionReady && (!sonolusUser || !isSessionValid())) {
      router.push("/login");
    }
  }, [sessionReady, sonolusUser, isSessionValid, router]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState(null);
  const [editData, setEditData] = useState(null);
  const [deletablePost, setDeletablePost] = useState(null);


  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
  const audioRefs = useRef({});

  const [form, setForm] = useState({
    title: "",
    artists: "",
    author: "",
    rating: "",
    description: "",
    tags: "",
    jacket: null,
    bgm: null,
    chart: null,
    preview: null,
    background: null,
    visibility: "public"
  });

  const handleMyCharts = async (page = 0) => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem("session");
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(
        `${APILink}/api/charts?page=${page}&type=advanced&status=ALL`,
        {
          headers: {
            Authorization: `${session}`,
          },
        }
      );


      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          console.log("API call failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        throw new Error(`Network error: ${res.status}`);
      }

      const data = await res.json();

      const BASE = data.asset_base_url || `${APILink}`;
      const items = Array.isArray(data?.data) ? data.data : [];

      const normalized = items.map((item) => ({
        id: item.id,
        title: item.title,
        artists: item.artists,
        author: item.author_full,
        author_field: item.chart_design,
        authorId: item.author,
        rating: item.rating,
        description: item.description,
        tags: item.tags,
        coverUrl: item.jacket_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.jacket_file_hash}`
          : "",
        bgmUrl: item.music_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.music_file_hash}`
          : "",
        backgroundUrl: item.background_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.background_file_hash}`
          : `${BASE}/${item.author}/${item.id}/${item.background_v3_file_hash}`,
        has_bg: item.background_file_hash ? true : false,
        chartUrl: item.chart_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.chart_file_hash}`
          : "",
        previewUrl: item.preview_file_hash
          ? `${BASE}/${item.author}/${item.id}/${item.preview_file_hash}`
          : "",
        likeCount: item.like_count,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        status: item.status,
      }));

      setPosts(normalized);
      setPageCount(data.pageCount || 0);
      setTotalCount(data.data?.[0]?.total_count || 0);
      setCurrentPage(page);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {

    if (isClient && sessionReady) {
      handleMyCharts();
    }
  }, [isClient, sessionReady]);

  const openUpload = () => {
    setMode("upload");
    setForm({
      title: "",
      artists: "",
      author: "",
      rating: "",
      description: "",
      tags: "",
      jacket: null,
      bgm: null,
      chart: null,
      preview: null,
      background: null,
      visibility: "public"
    });
    setError(null);
    setIsOpen(true);
  };

  const openEdit = (post) => {
    setMode("edit");
    setForm({
      title: post.title,
      artists: post.artists,
      author: post.author_field,
      rating: String(post.rating ?? ""),
      description: post.description || "",
      tags: post.tags || "",
      jacket: null,
      bgm: null,
      chart: null,
      preview: null,
      background: null,
      visibility: post.status?.toLowerCase() || "public"
    });
    setEditData({
      id: post.id,
      title: post.title,
      jacketUrl: post.coverUrl,
      bgmUrl: post.bgmUrl,
      chartUrl: post.chartUrl,
      previewUrl: post.previewUrl,
      backgroundUrl: post.backgroundUrl,
    });
    setError(null);
    setIsOpen(true);
  };

  const closePanel = () => {
    setIsOpen(false);
    setMode(null);
    setEditData(null);
    setError(null);

    setForm({
      title: "",
      artists: "",
      author: "",
      rating: "",
      description: "",
      tags: "",
      jacket: null,
      bgm: null,
      chart: null,
      preview: null,
      background: null,
    });
  };

  const update = (key) => (e) => {
    const value =
      e.target.type === "file" ? e.target.files?.[0] ?? null : e.target.value;
    setForm((prev) => ({ ...prev, [key]: value }));

    if (error) {
      setError(null);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (mode === "upload") {
      await handleUpload();
    } else if (mode === "edit") {
      await handleEdit();
    }
  };

  const handleEdit = async () => {
    try {
      setLoading(true);
      setError(null);


      if (!isClient) {
        setLoading(false);
        return;
      }


      if (!sessionReady) {
        setLoading(false);
        return;
      }


      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }


      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      if (!editData || !editData.id) {
        setError("No chart selected for editing");
        setLoading(false);
        return;
      }


      if (form.title && form.title.length > 50) {
        setError("Title must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.artists && form.artists.length > 50) {
        setError("Artists must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.author && form.author.length > 50) {
        setError("Charter Name must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.description && form.description.length > 1000) {
        setError("Description must be 1000 characters or less.");
        setLoading(false);
        return;
      }


      let tags = [];
      if (form.tags && typeof form.tags === "string" && form.tags.trim()) {
        tags = form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length > 3) {
          setError("Maximum 3 tags allowed.");
          setLoading(false);
          return;
        }
        for (const tag of tags) {
          if (tag.length > 10) {
            setError(`Tag "${tag}" must be 10 characters or less.`);
            setLoading(false);
            return;
          }
        }
      }


      const chartData = {};

      if (form.title) chartData.title = form.title;
      if (form.artists) chartData.artists = form.artists;
      if (form.author) chartData.author = form.author;
      if (form.rating) chartData.rating = parseInt(form.rating);
      if (form.description) chartData.description = form.description;
      if (tags.length > 0) chartData.tags = tags;
      if (form.visibility) chartData.status = form.visibility.toUpperCase();


      chartData.includes_jacket = form.jacket ? true : false;
      chartData.includes_audio = form.bgm ? true : false;
      chartData.includes_chart = form.chart ? true : false;
      chartData.includes_preview = form.preview ? true : false;
      chartData.includes_background = form.background ? true : false;
      chartData.delete_background = false;
      chartData.delete_preview = false;


      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));


      if (form.jacket) {
        formData.append("jacket_image", form.jacket);
      }
      if (form.bgm) {
        formData.append("audio_file", form.bgm);
      }
      if (form.chart) {
        formData.append("chart_file", form.chart);
      }
      if (form.preview) {
        formData.append("preview_file", form.preview);
      }
      if (form.background) {
        formData.append("background_image", form.background);
      }

      console.log("chartData", chartData);

      formData.forEach((value, key, parent) => {
        console.log("value", value);
        console.log("key", key);
        console.log("parent", parent);
      });


      const response = await fetch(
        `${APILink}/api/charts/${editData.id}/edit/`,
        {
          method: "PATCH",
          headers: {
            Authorization: session,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Edit failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Edit failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Edit successful:", result);


      setIsOpen(false);
      setMode(null);
      setEditData(null);
      setError(null);
      setForm({
        title: "",
        artists: "",
        author: "",
        rating: "",
        description: "",
        tags: "",
        jacket: null,
        bgm: null,
        chart: null,
        preview: null,
        background: null,
      });
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Edit error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      setError(null);


      if (!isClient) {
        setLoading(false);
        return;
      }


      if (!sessionReady) {
        setLoading(false);
        return;
      }


      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }


      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }


      if (
        !form.title ||
        !form.artists ||
        !form.author ||
        !form.rating ||
        !form.chart ||
        !form.bgm ||
        !form.jacket
      ) {
        setError(
          "Please fill in all required fields and upload all required files."
        );
        setLoading(false);
        return;
      }


      if (form.title.length > 50) {
        setError("Title must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.artists.length > 50) {
        setError("Artists must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.author.length > 50) {
        setError("Charter Name must be 50 characters or less.");
        setLoading(false);
        return;
      }
      if (form.description && form.description.length > 1000) {
        setError("Description must be 1000 characters or less.");
        setLoading(false);
        return;
      }


      let tags = [];
      if (form.tags) {
        tags = form.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0);
        if (tags.length > 3) {
          setError("Maximum 3 tags allowed.");
          setLoading(false);
          return;
        }
        for (const tag of tags) {
          if (tag.length > 10) {
            setError(`Tag "${tag}" must be 10 characters or less.`);
            setLoading(false);
            return;
          }
        }
      }


      const chartData = {
        rating: parseInt(form.rating),
        title: form.title,
        artists: form.artists,
        author: form.author,
        tags: tags,
        includes_background: !!form.background,
        includes_preview: !!form.preview,
        status: (form.visibility || "public").toUpperCase(),
      };


      if (form.description) {
        chartData.description = form.description;
      }


      const formData = new FormData();
      formData.append("data", JSON.stringify(chartData));


      formData.append("jacket_image", form.jacket);
      formData.append("chart_file", form.chart);
      formData.append("audio_file", form.bgm);


      if (form.preview) {
        formData.append("preview_file", form.preview);
      }
      if (form.background) {
        formData.append("background_image", form.background);
      }


      const response = await fetch(`${APILink}/api/charts/upload/`, {
        method: "POST",
        headers: {
          Authorization: session,
        },
        body: formData,
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Upload failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Upload successful:", result);


      setIsOpen(false);
      setMode(null);
      setError(null);
      setForm({
        title: "",
        artists: "",
        author: "",
        rating: "",
        description: "",
        tags: "",
        jacket: null,
        bgm: null,
        chart: null,
        preview: null,
        background: null,
      });
      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handlePlay = (postId) => {

    if (currentlyPlaying && currentlyPlaying !== postId) {
      const currentAudio = audioRefs.current[currentlyPlaying];
      if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
      }
    }

    setCurrentlyPlaying(postId);
  };

  const handleStop = (postId) => {
    if (currentlyPlaying === postId) {
      setCurrentlyPlaying(null);
    }
  };

  const handleAudioRef = useCallback((postId, audioElement) => {
    audioRefs.current[postId] = audioElement;
  }, []);

  const handleDelete = async (chart) => {
    const id = chart.id;

    setDeletablePost(chart);
  };

  const actuallyDelete = async () => {
    const chart = deletablePost;
    const chartId = chart.id;
    console.log(chartId)

    setDeletablePost(null);

    try {
      setLoading(true);
      setError(null);


      if (!isClient) {
        setLoading(false);
        return;
      }


      if (!sessionReady) {
        setLoading(false);
        return;
      }


      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }


      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      const response = await fetch(`${APILink}/api/charts/${chartId}/delete/`, {
        method: "DELETE",
        headers: {
          Authorization: session,
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Deletion failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(`Deletion failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Deletion successful:", result);


      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Deletion error error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }

    setDeletablePost(null);
  };

  const handleVisibilityChange = async (chartId, currentStatus, intent) => {

    let nextStatus = intent;














    try {
      setLoading(true);
      setError(null);


      if (!isClient) {
        setLoading(false);
        return;
      }


      if (!sessionReady) {
        setLoading(false);
        return;
      }


      if (!isSessionValid()) {
        console.log("Session expired, clearing data");
        clearExpiredSession();
        setLoading(false);
        return;
      }


      if (!session) {
        console.log("No session token available");
        setError("No session token available");
        setLoading(false);
        return;
      }

      const response = await fetch(
        `${APILink}/api/charts/${chartId}/visibility/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: session,
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          console.log("Visibility change failed due to expired session");
          clearExpiredSession();
          setLoading(false);
          return;
        }
        const errorText = await response.text();
        throw new Error(
          `Visibility change failed: ${response.status} - ${errorText}`
        );
      }

      const result = await response.json();
      console.log("Visibility change successful:", result);


      await handleMyCharts(currentPage);
    } catch (err) {
      console.error("Visibility change error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  if (!isClient || !sessionReady) {
    return (
      <main>
        <div className="loading-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <Loader2 className="animate-spin" size={48} style={{ color: '#38bdf8' }} />
        </div>
      </main>
    );
  }

  if (error)
    return (
      <main>
        <p>Error: {error}</p>
      </main>
    );

  return (
    <main>
      {error && (
        <div
          style={{
            backgroundColor: "#fee",
            color: "#c00",
            padding: "10px",
            margin: "10px",
            borderRadius: "5px",
            border: "1px solid #fcc",
          }}
        >
          {error}
        </div>
      )}
      { }
      <div className="dashboard-content">
        <div className="dashboard-header-row">
          <h1>{t('nav.dashboard')}</h1>
          <button className="upload-btn" onClick={openUpload}>
            <span className="plus-icon">+</span>
            {t('dashboard.create', 'Create')}
          </button>
        </div>

        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>{t('dashboard.loading', 'Loading charts...')}</p>
          </div>
        ) : (
          <>
            {posts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📂</div>
                <h3>{t('dashboard.noCharts', 'No charts found')}</h3>
                <p>{t('dashboard.createFirst', 'Create your first chart to get started!')}</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {posts.map((post) => (
                  <div key={post.id} className="dashboard-card animate-fade-in-up">
                    <div className="card-image-section">
                      {post.coverUrl ? (
                        <img src={post.coverUrl} alt={post.title} className="card-cover" loading="lazy" />
                      ) : (
                        <div className="card-placeholder">
                          <span>No Image</span>
                        </div>
                      )}
                      <div className="card-overlay-actions">
                        <button
                          className="action-icon-btn edit"
                          onClick={() => openEdit(post)}
                          title="Edit Chart"
                        >
                          ✎
                        </button>
                        <button
                          className="action-icon-btn delete"
                          onClick={() => handleDelete(post)}
                          title="Delete Chart"
                        >
                          🗑
                        </button>
                      </div>
                      <div className="card-status-badge" data-status={post.status}>
                        {post.status || 'PUBLIC'}
                      </div>
                    </div>

                    <div className="card-details">
                      <h3 className="card-title" title={post.title}>{post.title}</h3>
                      <p className="card-artist" title={post.artists}>{post.artists}</p>

                      <div className="card-meta-row">
                        <span className="card-rating">Lv. {post.rating}</span>
                        <span className="card-likes">❤️ {post.likeCount || 0}</span>
                      </div>

                      <div className="card-footer-row">
                        <span className="card-date">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <select
                          className="visibility-select"
                          value={post.status || 'PUBLIC'}
                          onChange={(e) => {
                            const next = e.target.value;
                            handleVisibilityChange(post.id, post.status, next);
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="PUBLIC">Public</option>
                          <option value="UNLISTED">Unlisted</option>
                          <option value="PRIVATE">Private</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {posts.length > 0 && (
              <div className="pagination-wrapper">
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={pageCount}
                  onPageChange={handleMyCharts}
                />
              </div>
            )}
          </>
        )}
      </div>

      {isOpen && (
        <ChartModal
          mode={mode}
          isOpen={isOpen}
          onClose={closePanel}
          onSubmit={onSubmit}
          form={form}
          onUpdate={update}
          loading={loading}
          error={error}
        />
      )}

      {deletablePost && (
        <div className="modal-overlay">
          <div className="modal-content delete-modal">
            <h3>Delete Chart?</h3>
            <p>Are you sure you want to delete <strong>{deletablePost.title}</strong>? This cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setDeletablePost(null)}>Cancel</button>
              <button className="btn-delete" onClick={actuallyDelete}>Delete Forever</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
