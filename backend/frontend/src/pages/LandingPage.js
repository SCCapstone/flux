"use client"

import { useContext } from "react"
import { Link } from "react-router-dom"
import { ThemeContext } from "../ThemeContext"
import { Book, Users, Award, List, Heart, TrendingUp, ChevronRight } from "lucide-react"
import "../styles/LandingPage.css"

const LandingPage = () => {
  const { theme } = useContext(ThemeContext)

  return (
    <div className={`landing-page ${theme}`}>
      {/* Hero Section */}
      <header className="hero-section">
        <nav className="landing-nav">
          <div className="logo">
            <h1>Flux</h1>
          </div>
          <div className="nav-links">
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <Link to="/login" className="login-btn">
              Login
            </Link>
            <Link to="/register" className="register-btn">
              Sign Up
            </Link>
          </div>
        </nav>

        <div className="hero-content">
          <div className="hero-text">
            <h1>Your Social Reading Journey Starts Here</h1>
            <p>
              Discover, track, and share your reading experiences with friends. Join the community of book lovers and
              elevate your reading habits.
            </p>
            <div className="hero-buttons">
              <Link to="/register" className="primary-btn">
                Get Started
              </Link>
              <a href="#features" className="secondary-btn">
                Learn More
              </a>
            </div>
          </div>
          <div className="hero-video">
            {/* Video placeholder - replace with actual video when ready */}
            <div className="video-container">
              <iframe
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" // Replace with your actual video URL
                title="Flux App Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="section-header">
          <h2>Why Choose Flux?</h2>
          <p>A complete platform for book lovers to connect, discover, and grow</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <Book className="feature-icon" />
            <h3>Track Your Reading</h3>
            <p>Keep a digital record of books you've read, want to read, and are currently reading.</p>
          </div>
          <div className="feature-card">
            <Users className="feature-icon" />
            <h3>Connect with Readers</h3>
            <p>Follow friends and discover what they're reading to expand your literary horizons.</p>
          </div>
          <div className="feature-card">
            <Award className="feature-icon" />
            <h3>Earn Achievements</h3>
            <p>Complete reading challenges and earn badges to showcase your reading accomplishments.</p>
          </div>
          <div className="feature-card">
            <List className="feature-icon" />
            <h3>Create Readlists</h3>
            <p>Organize books into custom lists that you can share with your followers.</p>
          </div>
          <div className="feature-card">
            <Heart className="feature-icon" />
            <h3>Save Favorites</h3>
            <p>Keep track of your favorite books and authors for quick access.</p>
          </div>
          <div className="feature-card">
            <TrendingUp className="feature-icon" />
            <h3>Discover Bestsellers</h3>
            <p>Stay updated with the latest trending and bestselling books in various genres.</p>
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="screenshots-section">
        <div className="section-header">
          <h2>See Flux in Action</h2>
          <p>Explore the intuitive interface and powerful features</p>
        </div>

        <div className="screenshots-carousel">
          <div className="screenshot">
            <img src="/booksearch.png" alt="Flux Home Screen" />
            <div className="screenshot-caption">
              <h3>Discover New Books</h3>
              <p>Search for books by title, author, or genre and add them to your collections.</p>
            </div>
          </div>
          <div className="screenshot">
            <img src="/screenshot2.png" alt="Flux Profile Page" />
            <div className="screenshot-caption">
              <h3>Personalized Profile</h3>
              <p>Showcase your reading stats, achievements, and favorite books.</p>
            </div>
          </div>
          <div className="screenshot">
            <img src="/screenshot3.png" alt="Flux Challenges" />
            <div className="screenshot-caption">
              <h3>Reading Challenges</h3>
              <p>Set goals and track your progress with our gamified reading challenges.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Your Reading Journey?</h2>
          <p>Join Flux today and connect with a community of passionate readers.</p>
          <Link to="/register" className="cta-button">
            Sign Up Now <ChevronRight className="icon" />
          </Link>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about-section">
        <div className="section-header">
          <h2>About the Team</h2>
          <p>Meet the passionate developers behind Flux</p>
        </div>

        <div className="team-grid">
          <div className="team-member">
            <h3>Brendan McNichols</h3>
            <a
              href="https://linkedin.com/in/brendan-mcnichols"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              LinkedIn Profile
            </a>
          </div>
          <div className="team-member">
            <h3>Basith Penna-Hakkim</h3>
            <a
              href="https://linkedin.com/in/basith-penna-hakkim"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              LinkedIn Profile
            </a>
          </div>
          <div className="team-member">
            <h3>Jakub Sykora</h3>
            <a
              href="https://linkedin.com/in/jakub-sykora"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              LinkedIn Profile
            </a>
          </div>
          <div className="team-member">
            <h3>Logan Praylow</h3>
            <a
              href="https://linkedin.com/in/logan-praylow"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              LinkedIn Profile
            </a>
          </div>
          <div className="team-member">
            <h3>Dhruv Patel</h3>
            <a
              href="https://linkedin.com/in/dhruv-patel"
              target="_blank"
              rel="noopener noreferrer"
              className="linkedin-link"
            >
              LinkedIn Profile
            </a>
          </div>
        </div>

        <div className="github-link">
          <h3>Check out our GitHub repo</h3>
          <a
            href="https://github.com/SCCapstone/flux"
            target="_blank"
            rel="noopener noreferrer"
            className="github-button"
          >
            View Repository
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-logo">
            <h2>Flux</h2>
            <p>Your Book Social Network</p>
          </div>
          <div className="footer-links">
            <div className="footer-column">
              <h3>Navigation</h3>
              <a href="#features">Features</a>
              <a href="#about">About</a>
              <Link to="/login">Login</Link>
              <Link to="/register">Sign Up</Link>
            </div>
            <div className="footer-column">
              <h3>Legal</h3>
              <a href="#">Terms of Service</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Cookie Policy</a>
            </div>
            <div className="footer-column">
              <h3>Contact</h3>
              <a href="mailto:contact@fluxapp.com">contact@fluxapp.com</a>
              <div className="social-links">
                <a href="#" aria-label="Twitter">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" aria-label="Facebook">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" aria-label="Instagram">
                  <i className="fab fa-instagram"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Flux. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
