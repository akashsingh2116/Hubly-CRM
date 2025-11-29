import React from "react";
import MiniChat from "../components/MiniChat";
import { Link } from "react-router-dom";
import mailIcon from "../assets/messenger.png";
import linkedinIcon from "../assets/linkedin.png";
import twitterIcon from "../assets/twitter.png";
import youtubeIcon from "../assets/youtube.png";
import botIcon from "../assets/bot.png";
import figmaIcon from "../assets/figma.png";
import instaIcon from "../assets/insta.png";

// imports using your asset names
import heroImg from "../assets/Group 1.png";
import funnelImg from "../assets/frame 2.png";
import logoImg from "../assets/logo.png";
import brandsImg from "../assets/frame brand.png";

export default function LandingPage() {
  return (
    <div className="landing-page">
      {/* Top navbar */}
      <header className="lp-header">
        <div className="lp-header-left">
          <img src={logoImg} alt="Hubly" className="lp-logo-img" />
        </div>

        <div className="lp-header-right">
          <Link to="/login" className="lp-link-button">
            Login
          </Link>

          <Link to="/signup" className="lp-primary-button small">
            Sign up
          </Link>
        </div>
      </header>

      <main>
        {/* Hero section (top viewport) */}
        <section className="lp-hero">
          <section className="lp-hero-left">
            <h1 className="lp-hero-title">
              Grow Your Business Faster
              <br />
              with Hubly CRM
            </h1>
            <p className="lp-hero-subtitle">
              Manage leads, automate workflows, and close deals effortlessly—
              all in one powerful platform.
            </p>

            <div className="lp-hero-actions">
              <button className="lp-primary-button">Get started</button>

              <button className="lp-ghost-button">
                <span className="lp-play-icon">
                  <span className="lp-play-triangle" />
                </span>
                <span>Watch Video</span>
              </button>
            </div>
          </section>

          <section className="lp-hero-right">
            <div className="lp-hero-main-card">
              <img
                src={heroImg}
                alt="Hubly CRM preview"
                className="lp-hero-photo"
              />
            </div>
          </section>
        </section>

        {/* Brands strip */}
        <section className="lp-brands">
          <img
            src={brandsImg}
            alt="Trusted by Adobe, Elastic, Opendoor, Airtable, Framer"
            className="lp-brands-img"
          />
        </section>

        {/* Core section – only funnel image */}
        <section className="lp-core">
          <div className="lp-core-inner">
            <h2 className="lp-section-title">
              At its core, Hubly is a robust CRM solution.
            </h2>
            <p className="lp-section-subtitle">
              Hubly helps businesses streamline customer interactions, track
              leads, and automate tasks—saving you time and maximizing revenue.
              Whether you&apos;re a startup or an enterprise, Hubly adapts to
              your needs, giving you the tools to scale efficiently.
            </p>

            <div className="lp-core-funnel">
              <img
                src={funnelImg}
                alt="Capture, nurture, close funnel"
                className="lp-core-funnel-img"
              />
            </div>
          </div>
        </section>

        {/* Plans section */}
        <section className="lp-plans">
          <div className="lp-plans-inner">
            <h2 className="lp-section-title">We have plans for everyone!</h2>
            <p className="lp-section-subtitle narrow">
              We started with a strong foundation, then simply built all of the
              sales and marketing tools ALL businesses need under one platform.
            </p>

            <div className="lp-plan-grid">
              {/* Starter plan */}
              <div className="lp-plan-card">
                <h3 className="lp-plan-name">STARTER</h3>
                <p className="lp-plan-tagline">
                  Best for local businesses needing to improve their online
                  reputation.
                </p>

                <div className="lp-plan-price-row">
                  <span className="lp-plan-price">$199</span>
                  <span className="lp-plan-price-meta">/monthly</span>
                </div>

                <div className="lp-plan-section-label">
                  What&apos;s included
                </div>
                <ul className="lp-plan-list">
                  <li>Unlimited Users</li>
                  <li>GMB Messaging</li>
                  <li>Reputation Management</li>
                  <li>GMB Call Tracking</li>
                  <li>24/7 Award Winning Support</li>
                </ul>

                <button className="lp-plan-btn">SIGN UP FOR STARTER</button>
              </div>

              {/* Grow plan */}
              <div className="lp-plan-card">
                <h3 className="lp-plan-name">GROW</h3>
                <p className="lp-plan-tagline">
                  Best for all businesses that want to take full control of
                  their marketing automation and track their leads, click to
                  close.
                </p>

                <div className="lp-plan-price-row">
                  <span className="lp-plan-price">$399</span>
                  <span className="lp-plan-price-meta">/monthly</span>
                </div>

                <div className="lp-plan-section-label">
                  What&apos;s included
                </div>
                <ul className="lp-plan-list">
                  <li>Pipeline Management</li>
                  <li>Marketing Automation Campaigns</li>
                  <li>Live Call Transfer</li>
                  <li>GMB Messaging</li>
                  <li>Embed-able Form Builder</li>
                  <li>Reputation Management</li>
                  <li>24/7 Award Winning Support</li>
                </ul>

                <button className="lp-plan-btn">SIGN UP FOR STARTER</button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <div className="lp-footer-brand">
            <img src={logoImg} alt="Hubly" className="lp-footer-logo-img" />
          </div>

          <div className="lp-footer-columns">
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Product</div>
              <a href="#">Universal checkout</a>
              <a href="#">Payment workflows</a>
              <a href="#">Observability</a>
              <a href="#">UpliftAI</a>
              <a href="#">Apps &amp; integrations</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Resources</div>
              <a href="#">Blog</a>
              <a href="#">Success stories</a>
              <a href="#">News room</a>
              <a href="#">Terms</a>
              <a href="#">Privacy</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Why Primer</div>
              <a href="#">Expand to new markets</a>
              <a href="#">Boost payment success</a>
              <a href="#">Improve conversion rates</a>
              <a href="#">Reduce payments fraud</a>
              <a href="#">Recover revenue</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Company</div>
              <a href="#">Careers</a>
            </div>
            <div className="lp-footer-col">
              <div className="lp-footer-col-title">Developers</div>
              <a href="#">Primer Docs</a>
              <a href="#">API Reference</a>
              <a href="#">Payment methods guide</a>
              <a href="#">Service status</a>
              <a href="#">Community</a>
            </div>
          </div>
        </div>

        <div className="lp-footer-social-icons">
          <a href="#" className="lp-social-icon">
            <img src={mailIcon} alt="mail" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={linkedinIcon} alt="linkedin" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={twitterIcon} alt="twitter" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={botIcon} alt="boticon" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={youtubeIcon} alt="youtube" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={instaIcon} alt="instagram" />
          </a>
          <a href="#" className="lp-social-icon">
            <img src={figmaIcon} alt="figma" />
          </a>
        </div>
      </footer>

      {/* Chat widget fixed in bottom-right */}
      <MiniChat />
    </div>
  );
}
