
import { Link } from "react-router-dom";
import "./Landing.css";

const examples = [
  {
    name: "Ananya",
    age: 25,
    location: "Kochi, Kerala",
    photo:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Arjun",
    age: 27,
    location: "Bengaluru",
    photo:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80",
  },
  {
    name: "Meera",
    age: 24,
    location: "Thiruvananthapuram",
    photo:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80",
  },
];

export default function Landing() {
  return (
    <main className="landing">
      <header className="landing-nav">
        <Link className="brand" to="/">
          saath<span>.</span>
        </Link>

        <nav className="landing-links">
          <a href="#how-it-works">How it works</a>
          <a href="#examples">Discover</a>
        </nav>

        <div className="nav-actions">
          <Link className="login-link" to="/login">
            Log in
          </Link>
          <Link className="primary-btn" to="/register">
            Join Saath
          </Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <span className="eyebrow">
            ✦ A more meaningful way to meet
          </span>

          <h1>
            Your story deserves a
            <em> beautiful beginning.</em>
          </h1>

          <p>
            Meet people who share your values, understand your
            dreams, and are ready to build something meaningful
            with you.
          </p>

          <div className="hero-actions">
            <Link className="primary-btn" to="/register">
              Find your person <span>↗</span>
            </Link>
            <a className="text-link" href="#how-it-works">
              Discover how it works →
            </a>
          </div>

          <div className="hero-note">
            <span className="note-heart">♥</span>
            <span>Real connections begin with being yourself.</span>
          </div>
        </div>

        <div className="hero-image-wrap">
          <img
            className="hero-image"
            src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1100&q=85"
            alt="A couple sharing a happy moment"
          />

          <div className="floating-note">
            <span className="floating-heart">♥</span>
            <div>
              <strong>Made for meaningful connections</strong>
              <small>Your next chapter starts here.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="values-strip">
        <div><span>♡</span> Be yourself</div>
        <div><span>✧</span> Meet with intention</div>
        <div><span>♥</span> Choose each other</div>
      </section>

      <section className="how-section" id="how-it-works">
        <div className="section-heading">
          <span className="eyebrow">THE SAATH WAY</span>
          <h2>Something real, in three steps.</h2>
          <p>
            No complicated steps. Just a better way to begin.
          </p>
        </div>

        <div className="steps-grid">
          <article className="step-card">
            <span className="step-number">01</span>
            <div className="step-icon">✎</div>
            <h3>Tell your story</h3>
            <p>
              Create a profile that reflects your personality,
              values, and what matters most to you.
            </p>
          </article>

          <article className="step-card">
            <span className="step-number">02</span>
            <div className="step-icon">♡</div>
            <h3>Discover people</h3>
            <p>
              Explore profiles, learn about people, and like
              someone when you feel a connection.
            </p>
          </article>

          <article className="step-card">
            <span className="step-number">03</span>
            <div className="step-icon">✧</div>
            <h3>Connect mutually</h3>
            <p>
              When you both like each other, it becomes a match
              and a chance to start something new.
            </p>
          </article>
        </div>
      </section>

      <section className="examples-section" id="examples">
        <div className="examples-heading">
          <div>
            <span className="eyebrow">A LITTLE INSPIRATION</span>
            <h2>Every story starts somewhere.</h2>
          </div>
          <Link className="text-link" to="/register">
            Start your story →
          </Link>
        </div>

        <div className="example-grid">
          {examples.map((person) => (
            <article className="example-card" key={person.name}>
              <img src={person.photo} alt={person.name} />
              <div className="example-info">
                <span className="example-label">ILLUSTRATIVE EXAMPLE</span>
                <h3>{person.name}, {person.age}</h3>
                <p>⌖ {person.location}</p>
              </div>
            </article>
          ))}
        </div>

        <p className="example-disclaimer">
          These are illustrative examples, not registered Saath members.
        </p>
      </section>

      <section className="final-cta">
        <span className="eyebrow">YOUR NEXT CHAPTER AWAITS</span>
        <h2>Good things begin with a hello.</h2>
        <p>
          Come as you are. Your story is worth discovering.
        </p>
        <Link className="primary-btn" to="/register">
          Join Saath today ↗
        </Link>
      </section>

      <footer className="landing-footer">
        <Link className="brand" to="/">saath<span>.</span></Link>
        <p>Made for meaningful beginnings.</p>
        <div>
          <Link to="/login">Log in</Link>
          <Link to="/register">Join Saath</Link>
        </div>
      </footer>
    </main>
  );
}
