import { useContext, useState } from "react"
import { Link } from "react-router-dom"
import { ThemeContext } from "../ThemeContext"
import { ArrowLeft, Github, Linkedin, Sun, Moon } from 'lucide-react'
import LoginModal from "../components/LoginModal"
import RegisterModal from "../components/RegisterModal"
import "../styles/AboutPage.css"

const AboutPage = () => {
  const { theme, toggleTheme } = useContext(ThemeContext)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [registerModalOpen, setRegisterModalOpen] = useState(false)

  const teamMembers = [
    {
      name: "Brendan McNichols",
      linkedin: "https://www.linkedin.com/in/brendan-mcnichols-14bb0a20b/",
      github: "https://github.com/CSE-BrendanMcNichols",
    },
    {
      name: "Basith Penna-Hakkim",
      linkedin: "https://linkedin.com/in/basith-penna-hakkim",
      github: "https://github.com/basithph-byte",
    },
    {
      name: "Jakub Sykora",
      linkedin: "https://linkedin.com/in/jakub-sykora",
      github: "https://github.com/Jsykora1",
    },
    {
      name: "Logan Praylow",
      linkedin: "https://linkedin.com/in/logan-praylow",
      github: "https://github.com/Logan-Praylow",
    },
    {
      name: "Dhruv Patel",
      linkedin: "https://linkedin.com/in/dhruv-patel",
      github: "https://github.com/DhruvBPUSC",
    },
  ]

  return (
    <div className={`about-page ${theme === "dark" ? "about-dark" : "about-light"}`}>
      <header className="about-header">
        <div className="about-logo">
          <h1>Flux</h1>
        </div>
        <nav className="about-nav">
          <Link to="/" className="about-nav-link about-back-link">
            <ArrowLeft size={18} />
            Back to Home
          </Link>
          <div className="about-auth-buttons">
            <button
              className="theme-toggle about-theme-toggle"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun className="icon" /> : <Moon className="icon" />}
            </button>
            <button onClick={() => setLoginModalOpen(true)} className="about-nav-button about-login-button">
              Login
            </button>
            <button onClick={() => setRegisterModalOpen(true)} className="about-nav-button about-register-button">
              Sign Up
            </button>
          </div>
        </nav>
      </header>

      <main className="about-main">
        <section className="about-hero">
          <h2>About Flux</h2>
          <p>
            Flux is a social book discovery platform designed to help readers find their next favorite book, track their
            reading progress, and connect with a community of fellow book lovers.
          </p>
        </section>

        <section className="about-mission">
          <h2>Our Mission</h2>
          <p>
            We believe that reading is both a personal journey and a social experience. Our mission is to create a
            platform that enhances both aspects of reading by providing the ability to search for new books while
            facilitating meaningful connections between readers.
          </p>
          <p>
            Through gamification elements like challenges, achievements, and reading streaks, we aim to make reading more
            engaging and help readers build consistent reading habits.
          </p>
        </section>

        <section className="about-team">
          <h2>Meet Our Team</h2>
          <div className="about-team-grid">
            {teamMembers.map((member, index) => (
              <div key={index} className="about-team-card">
                <div className="about-team-avatar">
                  {/* Placeholder for team member photo */}
                  <div className="about-avatar-placeholder">{member.name.charAt(0)}</div>
                </div>
                <h3>{member.name}</h3>
                <div className="about-team-social">
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-social-link"
                    aria-label={`${member.name}'s LinkedIn profile`}
                  >
                    <Linkedin size={20} />
                  </a>
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="about-social-link"
                    aria-label={`${member.name}'s GitHub profile`}
                  >
                    <Github size={20} />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-project">
          <h2>Our Project</h2>
          <p>
            Flux was developed as a capstone project at the University of South Carolina. The application combines our
            team's passion for reading with our technical skills in web development.
          </p>
          <p>
            We've built Flux using React for the frontend and Django for the backend, creating a responsive and
            feature-rich application that works across devices.
          </p>
          <div className="about-project-links">
            <a
              href="https://github.com/SCCapstone/flux"
              target="_blank"
              rel="noopener noreferrer"
              className="about-github-link"
            >
              <Github size={20} />
              View on GitHub
            </a>
          </div>
        </section>
      </main>

      <footer className="about-footer">
        <div className="about-footer-content">
          <p>&copy; {new Date().getFullYear()} Flux Book App. All rights reserved.</p>
          <Link to="/" className="about-footer-link">
            Back to Home
          </Link>
        </div>
      </footer>
      
      {/* Modal Components */}
      <LoginModal 
        isOpen={loginModalOpen} 
        onClose={() => setLoginModalOpen(false)} 
        openRegister={() => setRegisterModalOpen(true)} 
      />
      <RegisterModal 
        isOpen={registerModalOpen} 
        onClose={() => setRegisterModalOpen(false)} 
        openLogin={() => setLoginModalOpen(true)} 
      />
    </div>
  )
}

export default AboutPage
