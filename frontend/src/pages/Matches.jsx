
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function Matches() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadMatches() {
      try {
        const data = await api("/api/matches");
        setMatches(Array.isArray(data) ? data : data.matches || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadMatches();
  }, []);

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <main className="app-page">
      <header className="app-nav">
        <Link to="/" className="auth-brand">saath<span>.</span></Link>
        <nav>
          <Link to="/discover">Discover</Link>
          <Link to="/matches">Matches</Link>
          <Link to="/profile">My Profile</Link>
          <button className="nav-logout" onClick={handleLogout}>
            Log out
          </button>
        </nav>
      </header>

      <section className="page-container">
        <p className="eyebrow">A MUTUAL CONNECTION</p>
        <h1>Your matches.</h1>
        <p className="muted">
          When two people like each other, something new can begin.
        </p>

        {loading ? (
          <p className="loading">Loading your matches...</p>
        ) : error ? (
          <p className="form-error">{error}</p>
        ) : matches.length === 0 ? (
          <div className="empty-state">
            <div className="empty-heart">♡</div>
            <h2>Your story is still unfolding.</h2>
            <p>
              You don't have any mutual matches yet. Keep discovering people.
            </p>
            <Link className="primary-btn" to="/discover">
              Discover people
            </Link>
          </div>
        ) : (
          <div className="discover-grid">
            {matches.map((item, index) => {
              // Supports either a profile directly or a match
              // object containing a nested profile.
              const person = item.profile || item.person || item;

              return (
                <article
                  className="person-card match-card"
                  key={item.id || person.user_id || index}
                >
                  {person.photo_url ? (
                    <img
                      className="person-photo"
                      src={person.photo_url}
                      alt={person.name}
                    />
                  ) : (
                    <div className="person-placeholder">
                      {person.name?.charAt(0)?.toUpperCase() || "♡"}
                    </div>
                  )}

                  <div className="person-details">
                    <span className="match-label">♥ MUTUAL LIKE</span>
                    <h2>{person.name}{person.age ? `, ${person.age}` : ""}</h2>
                    <p className="muted">⌖ {person.location}</p>
                    <p>{person.bio}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
