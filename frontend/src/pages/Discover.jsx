
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

// Convert API errors, including FastAPI validation errors, into readable text.
function getErrorMessage(err) {
    const detail = err?.message;

    if (typeof detail === "string") {
        try {
            const parsed = JSON.parse(detail);

            if (Array.isArray(parsed)) {
                return parsed
                    .map((item) => item.msg || JSON.stringify(item))
                    .join(", ");
            }

            if (parsed && typeof parsed === "object") {
                return parsed.detail || parsed.message || JSON.stringify(parsed);
            }
        } catch {
            // The message is ordinary text, not JSON.
        }

        return detail;
    }

    if (Array.isArray(detail)) {
        return detail
            .map((item) => item.msg || JSON.stringify(item))
            .join(", ");
    }

    if (detail && typeof detail === "object") {
        return detail.detail || detail.message || JSON.stringify(detail);
    }

    return "Something went wrong. Please try again.";
}

export default function Discover() {
    const { logout } = useAuth();
    const navigate = useNavigate();

    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    async function loadProfiles() {
        setLoading(true);
        setError("");
        setNotice("");

        try {
            const data = await api("/api/profiles");

            const profileList = Array.isArray(data)
                ? data
                : Array.isArray(data?.profiles)
                    ? data.profiles
                    : [];

            setProfiles(profileList);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadProfiles();
    }, []);

    async function swipe(profile, action) {
        if (busy) return;

        setBusy(true);
        setError("");
        setNotice("");

        try {
            const result = await api("/api/swipes", {
                method: "POST",
                body: JSON.stringify({
                    profile_id: profile.profile_id ?? profile.id ?? profile.user_id,
                    liked: action === "like",
                }),
            });

            // Remove the profile from Discover after the swipe succeeds.
            setProfiles((current) =>
                current.filter(
                    (item) => item.user_id !== profile.user_id
                )
            );

            if (result?.match) {
                setNotice(
                    `It's a match! You and ${profile.name} liked each other.`
                );
            } else if (action === "like") {
                setNotice(
                    `You liked ${profile.name}. A match happens when they like you back.`
                );
            } else {
                setNotice("Profile passed.");
            }
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setBusy(false);
        }
    }

    async function handleLogout() {
        await logout();
        navigate("/", { replace: true });
    }

    return (
        <main className="app-page">
            <header className="app-nav">
                <Link to="/" className="auth-brand">
                    saath<span>.</span>
                </Link>

                <nav>
                    <Link to="/discover">Discover</Link>
                    <Link to="/matches">Matches</Link>
                    <Link to="/profile">My Profile</Link>

                    <button
                        className="nav-logout"
                        onClick={handleLogout}
                    >
                        Log out
                    </button>
                </nav>
            </header>

            <section className="page-container">
                <p className="eyebrow">A NEW BEGINNING</p>

                <h1>People worth getting to know.</h1>

                <p className="muted">
                    Explore profiles and see where a mutual connection leads.
                </p>

                {notice && (
                    <p className="success-message">{notice}</p>
                )}

                {error && (
                    <div className="form-error" role="alert">
                        <p>{error}</p>
                        <button
                            className="secondary-btn"
                            onClick={loadProfiles}
                            disabled={loading || busy}
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <p className="loading">Finding profiles...</p>
                ) : profiles.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-heart">♡</div>

                        <h2>You've seen everyone for now.</h2>

                        <p>Come back later to discover more people.</p>

                        <button
                            className="secondary-btn"
                            onClick={loadProfiles}
                            disabled={busy}
                        >
                            Refresh profiles
                        </button>
                    </div>
                ) : (
                    <div className="discover-grid">
                        {profiles.map((person) => (
                            <article
                                className="person-card"
                                key={person.user_id ?? `${person.name}-${person.age}`}
                            >
                                {person.photo_url ? (
                                    <img
                                        className="person-photo"
                                        src={person.photo_url}
                                        alt={person.name || "Profile photo"}
                                    />
                                ) : (
                                    <div className="person-placeholder">
                                        {person.name?.charAt(0)?.toUpperCase() || "♡"}
                                    </div>
                                )}

                                <div className="person-details">
                                    <h2>
                                        {person.name}
                                        {person.age ? `, ${person.age}` : ""}
                                    </h2>

                                    <p className="muted">
                                        ⌖ {person.location}
                                    </p>

                                    <p>{person.bio}</p>

                                    {person.interests && (
                                        <p className="interest-line">
                                            <strong>Interests:</strong>{" "}
                                            {Array.isArray(person.interests)
                                                ? person.interests.join(", ")
                                                : person.interests}
                                        </p>
                                    )}

                                    <div className="swipe-actions">
                                        <button
                                            className="secondary-btn"
                                            disabled={busy}
                                            onClick={() => swipe(person, "pass")}
                                        >
                                            Pass
                                        </button>

                                        <button
                                            className="primary-btn"
                                            disabled={busy}
                                            onClick={() => swipe(person, "like")}
                                        >
                                            ♡ Like
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}
