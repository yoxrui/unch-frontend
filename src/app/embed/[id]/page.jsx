import { notFound } from 'next/navigation';
import "./page.css";

const APILink = process.env.NEXT_PUBLIC_API_URL;

async function fetchLevel(rawId) {
    const cleanId = rawId.replace(/^UnCh-/, '');
    const res = await fetch(`${APILink}/api/charts/${cleanId}/`);
    if (!res.ok) throw new Error(`API returned ${res.status}`);
    const json = await res.json();
    const data = json.data;
    const base = json.asset_base_url;

    const buildAssetUrl = (hash) =>
        hash && base && data.author ? `${base}/${data.author}/${data.id}/${hash}` : null;

    return {
        id: data.id,
        title: data.title || 'Untitled Level',
        thumbnail: buildAssetUrl(data.jacket_file_hash),
        author: data.author_full || data.author || 'Unknown',
        artists: data.artists || 'Unknown Artist',
        rating: data.rating || 0,
        backgroundUrl: buildAssetUrl(data.background_file_hash || (data.background && data.background.hash)),
    };
}

export default async function EmbedPage({ params }) {
    const { id } = await params;
    let level;

    try {
        level = await fetchLevel(id);
    } catch (e) {
        notFound();
    }

    const bgImage = level.backgroundUrl || level.thumbnail || '/placeholder.jpg';

    return (
        <div className="embed-container">
            <div
                className="embed-bg"
                style={{ backgroundImage: `url(${bgImage})` }}
            />
            <div className="embed-overlay" />

            <div className="embed-content">
                <div className="embed-header">
                    <img src="/636a8f1e76b38cb1b9eb0a3d88d7df6f.png" alt="Logo" className="embed-mini-logo" />
                    <span>Untitled Charts</span>
                </div>

                <div className="embed-body">
                    <div className="embed-jacket-wrapper">
                        <img src={level.thumbnail || '/placeholder.jpg'} alt={level.title} className="embed-jacket" />
                        <div className="embed-rating">Lv.{level.rating}</div>
                    </div>
                    <div className="embed-info">
                        <h1 className="embed-title" title={level.title}>{level.title}</h1>
                        <div className="embed-author">{level.artists}</div>
                    </div>
                </div>

                <div className="embed-footer">
                    <div className="embed-charter">
                        by: <span>{level.author}</span>
                    </div>
                    <div className="embed-brand">
                        UntitledCharts
                    </div>
                </div>
            </div>
        </div>
    );
}
