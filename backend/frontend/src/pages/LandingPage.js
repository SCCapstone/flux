import { useContext } from "react"
import { Link, useNavigate } from "react-router-dom"
import { AuthContext } from "../AuthContext"
import { ThemeContext } from "../ThemeContext"
import "../styles/LandingPage.css"

const LandingPage = () => {
  const { isLoggedIn } = useContext(AuthContext)
  const { theme } = useContext(ThemeContext)
  const navigate = useNavigate()

  // Redirect to home if already logged in
  if (isLoggedIn) {
    navigate("/")
    return null
  }

  return (
    <div className={`landing-page ${theme === "dark" ? "landing-dark" : "landing-light"}`}>
      {/* Hero Section */}
      <header className="landing-header">
        <div className="landing-logo">
          <h1>Flux</h1>
          <p className="landing-tagline">Your Social Book Discovery Platform</p>
        </div>
        <nav className="landing-nav">
          <Link to="/about" className="landing-nav-link">
            About
          </Link>
          <a
            href="https://github.com/SCCapstone/flux"
            target="_blank"
            rel="noopener noreferrer"
            className="landing-nav-link"
          >
            GitHub
          </a>
          <Link to="/login" className="landing-nav-button landing-login">
            Login
          </Link>
          <Link to="/register" className="landing-nav-button landing-register">
            Sign Up
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        {/* Hero Section */}
        <section className="landing-hero">
          <div className="landing-hero-content">
            <h2>Discover, Track, and Share Your Reading Journey</h2>
            <p>
              Flux helps you find your next favorite book, track your reading progress, and connect with fellow book
              lovers. Join our community of readers today!
            </p>
            <div className="landing-cta-buttons">
              <Link to="/register" className="landing-cta-button">
                Get Started
              </Link>
              <a href="#features" className="landing-secondary-button">
                Learn More
              </a>
            </div>
          </div>
          <div className="landing-hero-image">
            <div className="landing-video-container">
              <iframe
                className="landing-video"
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with actual video URL
                title="Flux App Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>



        {/* Features Section */}
        <section id="features" className="landing-features">
          <h2>Why Choose Flux?</h2>
          <div className="landing-features-grid">
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📚</div>
              <h3>Discover New Books</h3>
              <p>Find your next read with our book search feature and NYT bestseller list integration.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">🏆</div>
              <h3>Gamified Reading</h3>
              <p>
                Earn achievements, complete challenges, and maintain reading streaks to make your reading journey more
                engaging.
              </p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">👥</div>
              <h3>Connect with Readers</h3>
              <p>Follow friends, share your reviews, rate books, and discover what others are reading in your community.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">📋</div>
              <h3>Custom Reading Lists</h3>
              <p>Create and organize your reading lists.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">⭐</div>
              <h3>Points & Levels</h3>
              <p>Earn points for reading activities and level up your reader profile.</p>
            </div>
            <div className="landing-feature-card">
              <div className="landing-feature-icon">💯</div>
              <h3>Leaderboards</h3>
              <p>Compare your reading activity and see how you rank among the Flux community.</p>
            </div>
          </div>
        </section>

        {/* App Screenshots */}
        <section className="landing-screenshots">
          <h2>App Screenshots</h2>
          <div className="landing-screenshots-carousel">
            <div className="landing-screenshot-item">
              <img
                src="/interface.png"
                alt="Flux Home Screen"
                className="landing-screenshot"
              />
              <p>Discover new books</p>
            </div>
            <div className="landing-screenshot-item">
              <img
                src="/profile.png"
                alt="Flux Profile Page"
                className="landing-screenshot"
              />
              <p>Customize your profile and check your stats</p>
            </div>
            <div className="landing-screenshot-item">
              <img
                src="/connect.png"
                alt="Flux Social Features"
                className="landing-screenshot"
              />
              <p>Connect with friends</p>
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="landing-cta-section">
          <h2>Ready to Start Your Reading Journey?</h2>
          <p>Join thousands of readers who have already discovered their next favorite book with Flux.</p>
          <Link to="/register" className="landing-cta-button">
            Sign Up Now - It's Free!
          </Link>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-footer-content">
          <div className="landing-footer-logo">
            <h2>Flux</h2>
            <p>Your Social Book Discovery Platform</p>
          </div>
          <div className="landing-footer-links">
            <div className="landing-footer-column">
              <h3>Navigation</h3>
              <Link to="/" className="landing-footer-link">
                Home
              </Link>
              <Link to="/about" className="landing-footer-link">
                About
              </Link>
              <Link to="/login" className="landing-footer-link">
                Login
              </Link>
              <Link to="/register" className="landing-footer-link">
                Sign Up
              </Link>
            </div>
            <div className="landing-footer-column">
              <h3>Connect</h3>
              <a
                href="https://github.com/SCCapstone/flux"
                target="_blank"
                rel="noopener noreferrer"
                className="landing-footer-link"
              >
                GitHub
              </a>
            </div>
          </div>
        </div>
        <div className="landing-footer-bottom">
          <p>&copy; {new Date().getFullYear()} Flux Book App. All rights reserved.</p>
          <p>
            Created by Brendan McNichols, Basith Penna-Hakkim, Jakub Sykora, Logan Praylow, and Dhruv Patel
          </p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
