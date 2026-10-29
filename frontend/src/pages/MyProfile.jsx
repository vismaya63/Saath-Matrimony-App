
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

const emptyProfile = {
  name: "",
  age: "",
  gender: "",
  location: "",
  bio: "",
  interests: "",
  photo_url: "",
};

export default function MyProfile() {
  const { user, refreshUser, logout } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState(emptyProfile);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const existingProfile = user?.profile;

  useEffect(() => {
    if (existingProfile) {
      setForm({
        ...emptyProfile,
        ...existingProfile,
        age: existingProfile.age ?? "",
        interests: Array.isArray(existingProfile.interests)
          ? existingProfile.interests.join(", ")
          : existingProfile.interests ?? "",
      });
    }
  }, [existingProfile]);

  function updateField(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);

    const payload = {
      ...form,
      age: Number(form.age),
    };

    try {
      if (existingProfile) {
        await api("/api/profiles/me", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/profiles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }

      await refreshUser();
      setMessage("Your profile has been saved successfully.");
    } catch (err) {
      setError(err.message);
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
        <p className="eyebrow">YOUR SAATH PROFILE</p>
        <h1>{existingProfile ? "Your story, your way." : "Tell us about yourself."}</h1>
        <p className="muted">
          {existingProfile
            ? "Update your details whenever you need to."
            : "Create your profile to start discovering people."}
        </p>

        <form className="profile-form" onSubmit={handleSubmit}>
          <label htmlFor="name">Your name</label>
          <input
            id="name"
            name="name"
            value={form.name}
            onChange={updateField}
            maxLength={80}
            required
          />

          <div className="form-row">
            <div>
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min="18"
                max="100"
                value={form.age}
                onChange={updateField}
                required
              />
            </div>

            <div>
              <label htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={updateField}
                required
              >
                <option value="">Select</option>
                <option value="Woman">Woman</option>
                <option value="Man">Man</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <label htmlFor="location">City or location</label>
          <input
            id="location"
            name="location"
            value={form.location}
            onChange={updateField}
            placeholder="e.g. Kochi, Kerala"
            required
          />

          <label htmlFor="bio">About you</label>
          <textarea
            id="bio"
            name="bio"
            value={form.bio}
            onChange={updateField}
            placeholder="Share a little about your personality and values..."
            rows={4}
            maxLength={1000}
            required
          />

          <label htmlFor="interests">Interests</label>
          <input
            id="interests"
            name="interests"
            value={form.interests}
            onChange={updateField}
            placeholder="Music, travel, reading"
          />
          <small className="muted">Separate interests with commas.</small>

          <label htmlFor="photo_url">Profile photo URL (optional)</label>
          <input
            id="photo_url"
            name="photo_url"
            type="url"
            value={form.photo_url}
            onChange={updateField}
            placeholder="https://example.com/photo.jpg"
          />

          {error && <p className="form-error">{error}</p>}
          {message && <p className="success-message">{message}</p>}

          <button className="primary-btn full-btn" disabled={busy}>
            {busy ? "Saving..." : "Save profile"}
          </button>
        </form>
      </section>
    </main>
  );
}
