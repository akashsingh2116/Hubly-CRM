import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import MiniChat from "../components/MiniChat";
import "../styles/landing.css";

import heroImg    from "../assets/Group 1.png";
import funnelImg  from "../assets/frame 2.png";
import logoImg    from "../assets/logo.png";
import brandsImg  from "../assets/frame brand.png";
import mailIcon   from "../assets/messenger.png";
import linkedinIcon from "../assets/linkedin.png";
import twitterIcon  from "../assets/twitter.png";
import youtubeIcon  from "../assets/youtube.png";
import botIcon    from "../assets/bot.png";
import figmaIcon  from "../assets/figma.png";
import instaIcon  from "../assets/insta.png";

const FEATURES = [
  {
    icon: "💬",
    color: "icon-blue",
    title: "Omnichannel Inbox",
    body: "Handle emails, live chat, and social messages in one unified inbox. Never miss a customer touchpoint.",
  },
  {
    icon: "🚀",
    color: "icon-purple",
    title: "Deal Pipeline",
    body: "Visualise every deal with a drag-and-drop Kanban board. Move deals through stages and forecast revenue in real time.",
  },
  {
    icon: "⚡",
    color: "icon-green",
    title: "Automation Engine",
    body: "Trigger chatbot replies, assign tickets, and run SLA checks automatically — zero manual toil.",
  },
  {
    icon: "📊",
    color: "icon-orange",
    title: "Advanced Analytics",
    body: "Track CSAT, response times, and agent performance with interactive charts and one-click CSV exports.",
  },
  {
    icon: "🔔",
    color: "icon-red",
    title: "Real-time Notifications",
    body: "Socket-powered live alerts and push notifications keep your team in sync across every device.",
  },
  {
    icon: "🔌",
    color: "icon-teal",
    title: "Webhooks & API",
    body: "Connect Hubly to your stack with HMAC-signed webhooks, a full REST API, and Slack notifications.",
  },
];

const TESTIMONIALS = [
  {
    avatar: "AK",
    color: "#3b82f6",
    name: "Alex Kim",
    role: "VP of Sales, NovaPay",
    text: "Hubly replaced three separate tools for us. The pipeline view alone saved our reps 2 hours a day.",
    stars: 5,
  },
  {
    avatar: "SR",
    color: "#8b5cf6",
    name: "Sara Ramos",
    role: "Customer Success Lead, Helios",
    text: "The live-chat automation is insane. Chatbot handles 60% of tier-1 questions before an agent even sees it.",
    stars: 5,
  },
  {
    avatar: "JT",
    color: "#10b981",
    name: "James Torres",
    role: "Founder, ShopDeck",
    text: "We went from a messy spreadsheet to full CRM in a single afternoon. The import wizard is brilliant.",
    stars: 5,
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="lp2">
      {/* ── Navbar ──────────────────────────────────────────────────────── */}
      <nav ref={navRef} className={`lp2-nav ${scrolled ? "lp2-nav--scrolled" : ""}`}>
        <div className="lp2-nav__inner">
          <a href="#" className="lp2-nav__logo">
            <div className="lp2-nav__logo-mark">H</div>
            <span className="lp2-nav__brand">Hubly</span>
          </a>

          <ul className="lp2-nav__links">
            <li><a href="#features">Features</a></li>
            <li><a href="#how">How it works</a></li>
            <li><a href="#pricing">Pricing</a></li>
            <li><a href="#testimonials">Reviews</a></li>
          </ul>

          <div className="lp2-nav__actions">
            <Link to="/login"  className="lp2-nav__login">Log in</Link>
            <Link to="/signup" className="lp2-btn lp2-btn--primary" style={{ padding: "9px 20px", fontSize: 14 }}>
              Start free trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="lp2-hero">
        <div className="lp2-container">
          <div className="lp2-hero__inner">
            {/* Left: copy */}
            <div className="lp2-hero__copy">
              <div className="lp2-hero__eyebrow">
                <span className="lp2-hero__dot" />
                <span className="lp2-hero__eyebrow-text">Trusted by 2,000+ growing businesses</span>
              </div>

              <h1 className="lp2-hero__title">
                The CRM that{" "}
                <span className="lp2-gradient-text">closes more deals</span>{" "}
                and delights customers
              </h1>

              <p className="lp2-hero__sub">
                Manage contacts, track pipelines, automate support, and grow revenue —
                all from one beautifully designed workspace.
              </p>

              <div className="lp2-hero__actions">
                <Link to="/signup" className="lp2-btn lp2-btn--primary">
                  Get started free →
                </Link>
                <a href="#features" className="lp2-btn lp2-btn--ghost">
                  See features
                </a>
              </div>

              <div className="lp2-hero__social-proof">
                <div className="lp2-hero__avatars">
                  <div className="lp2-hero__avatar lp2-hero__avatar--a">AK</div>
                  <div className="lp2-hero__avatar lp2-hero__avatar--b">SR</div>
                  <div className="lp2-hero__avatar lp2-hero__avatar--c">JT</div>
                  <div className="lp2-hero__avatar lp2-hero__avatar--d">ML</div>
                </div>
                <span>★★★★★ &nbsp;4.9 from 800+ reviews</span>
              </div>
            </div>

            {/* Right: product mockup */}
            <div className="lp2-hero__visual">
              {/* Floating card — top right */}
              <div className="lp2-hero__float-card lp2-hero__float-card--1">
                <div className="lp2-fc-label">This month's revenue</div>
                <div className="lp2-fc-value">$284k</div>
                <div className="lp2-fc-sub">▲ 18% vs last month</div>
              </div>

              {/* Browser chrome mockup */}
              <div className="lp2-hero__mockup">
                <div className="lp2-hero__mockup-bar">
                  <span className="lp2-hero__dot-red" />
                  <span className="lp2-hero__dot-yellow" />
                  <span className="lp2-hero__dot-green" />
                </div>
                <img src={heroImg} alt="Hubly CRM dashboard" className="lp2-hero__screen" />
              </div>

              {/* Floating card — bottom left */}
              <div className="lp2-hero__float-card lp2-hero__float-card--2">
                <div className="lp2-fc-row">
                  <div className="lp2-fc-avatar">AK</div>
                  <div>
                    <div className="lp2-fc-info">New deal won 🎉</div>
                    <div className="lp2-fc-info-sub">Enterprise plan · $12,000</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted by ──────────────────────────────────────────────────── */}
      <section className="lp2-logos">
        <div className="lp2-container">
          <div className="lp2-logos__label">Trusted by teams at</div>
          <div className="lp2-logos__row">
            <img src={brandsImg} alt="Partner brands" style={{ maxWidth: 640, width: "100%", objectFit: "contain" }} />
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────── */}
      <section className="lp2-stats">
        <div className="lp2-container">
          <div className="lp2-stats__grid">
            {[
              { num: "2,000+", label: "Businesses powered" },
              { num: "98%",    label: "Customer satisfaction" },
              { num: "4.2M",   label: "Tickets resolved" },
              { num: "3 min",  label: "Avg first response" },
            ].map((s) => (
              <div className="lp2-stat" key={s.label}>
                <div className="lp2-stat__number">{s.num}</div>
                <div className="lp2-stat__label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────── */}
      <section className="lp2-features" id="features">
        <div className="lp2-container">
          <div className="lp2-section-header">
            <div className="lp2-badge">✦ Features</div>
            <h2 className="lp2-section-title">
              Everything you need to{" "}
              <span className="lp2-gradient-text">run your customer ops</span>
            </h2>
            <p className="lp2-section-sub">
              No more juggling a dozen tabs. Hubly brings contacts, deals, support, and
              analytics under one roof — built for speed from day one.
            </p>
          </div>

          <div className="lp2-features__grid">
            {FEATURES.map((f) => (
              <div className="lp2-feature-card" key={f.title}>
                <div className={`lp2-feature-card__icon ${f.color}`}>{f.icon}</div>
                <h3 className="lp2-feature-card__title">{f.title}</h3>
                <p className="lp2-feature-card__body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="lp2-how" id="how">
        <div className="lp2-container">
          <div className="lp2-section-header">
            <div className="lp2-badge">✦ How it works</div>
            <h2 className="lp2-section-title">Up and running in minutes</h2>
            <p className="lp2-section-sub">
              No lengthy onboarding. Hubly is designed to deliver value from your very first login.
            </p>
          </div>

          <div className="lp2-how__steps">
            <div className="lp2-step lp2-step--1">
              <div className="lp2-step__num">1</div>
              <h3 className="lp2-step__title">Import your data</h3>
              <p className="lp2-step__body">
                Upload a CSV or connect your existing tools. Contacts, deals, and history migrate in seconds.
              </p>
            </div>
            <div className="lp2-step lp2-step--2">
              <div className="lp2-step__num">2</div>
              <h3 className="lp2-step__title">Set up your pipeline</h3>
              <p className="lp2-step__body">
                Customise deal stages, assign teammates, and configure automations — no code needed.
              </p>
            </div>
            <div className="lp2-step lp2-step--3">
              <div className="lp2-step__num">3</div>
              <h3 className="lp2-step__title">Close deals & delight customers</h3>
              <p className="lp2-step__body">
                Your team works from a single workspace. Real-time data means smarter decisions, faster closes.
              </p>
            </div>
          </div>

          {/* Funnel graphic */}
          <div style={{ marginTop: 64, textAlign: "center" }}>
            <img
              src={funnelImg}
              alt="Capture → Nurture → Close funnel"
              style={{
                maxWidth: 680,
                width: "100%",
                borderRadius: 16,
                opacity: .9,
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Testimonials ────────────────────────────────────────────────── */}
      <section className="lp2-testimonials" id="testimonials">
        <div className="lp2-container">
          <div className="lp2-section-header">
            <div className="lp2-badge">✦ Reviews</div>
            <h2 className="lp2-section-title">Teams love Hubly</h2>
            <p className="lp2-section-sub">
              Don't take our word for it — hear from the people using Hubly every day to grow their business.
            </p>
          </div>

          <div className="lp2-testimonials__grid">
            {TESTIMONIALS.map((t) => (
              <div className="lp2-testimonial" key={t.name}>
                <div className="lp2-testimonial__stars">{"★".repeat(t.stars)}</div>
                <p className="lp2-testimonial__quote">{t.text}</p>
                <div className="lp2-testimonial__author">
                  <div
                    className="lp2-testimonial__avatar"
                    style={{ background: t.color }}
                  >
                    {t.avatar}
                  </div>
                  <div>
                    <div className="lp2-testimonial__name">{t.name}</div>
                    <div className="lp2-testimonial__role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section className="lp2-pricing" id="pricing">
        <div className="lp2-container">
          <div className="lp2-section-header">
            <div className="lp2-badge">✦ Pricing</div>
            <h2 className="lp2-section-title">Simple, transparent pricing</h2>
            <p className="lp2-section-sub">
              No hidden fees. Cancel any time. Every plan includes unlimited users and 24/7 support.
            </p>
          </div>

          <div className="lp2-pricing__grid">
            {/* Starter */}
            <div className="lp2-plan">
              <div className="lp2-plan__name">Starter</div>
              <div className="lp2-plan__tagline">
                Perfect for local businesses ready to modernise customer relationships.
              </div>
              <div className="lp2-plan__price">$199</div>
              <div className="lp2-plan__period">per month · billed annually</div>
              <div className="lp2-plan__divider" />
              <div className="lp2-plan__features-label">What's included</div>
              <ul className="lp2-plan__features">
                <li>Unlimited Users</li>
                <li>Contact & Company Management</li>
                <li>GMB Messaging</li>
                <li>Reputation Management</li>
                <li>GMB Call Tracking</li>
                <li>24/7 Award-Winning Support</li>
              </ul>
              <div className="lp2-plan__cta">
                <Link to="/signup" className="lp2-btn lp2-btn--outline" style={{ width: "100%", justifyContent: "center" }}>
                  Get started with Starter
                </Link>
              </div>
            </div>

            {/* Grow (featured) */}
            <div className="lp2-plan lp2-plan--featured">
              <div className="lp2-plan__badge">Most Popular</div>
              <div className="lp2-plan__name">Grow</div>
              <div className="lp2-plan__tagline">
                Full-stack CRM for teams that want to track leads click-to-close.
              </div>
              <div className="lp2-plan__price">$399</div>
              <div className="lp2-plan__period">per month · billed annually</div>
              <div className="lp2-plan__divider" />
              <div className="lp2-plan__features-label">Everything in Starter, plus</div>
              <ul className="lp2-plan__features">
                <li>Deal Pipeline & Kanban Board</li>
                <li>Marketing Automation Campaigns</li>
                <li>Chatbot Automation Engine</li>
                <li>SLA Policies & Breach Alerts</li>
                <li>Advanced Analytics & CSV Export</li>
                <li>Webhook Integrations + API Access</li>
                <li>Live Call Transfer</li>
                <li>Embed-able Form Builder</li>
              </ul>
              <div className="lp2-plan__cta">
                <Link to="/signup" className="lp2-btn lp2-btn--primary" style={{ width: "100%", justifyContent: "center" }}>
                  Get started with Grow →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────────────────────── */}
      <section className="lp2-cta">
        <div className="lp2-container">
          <div className="lp2-badge" style={{ margin: "0 auto 20px" }}>✦ Get started today</div>
          <h2 className="lp2-cta__title">
            Your next customer relationship{" "}
            <span className="lp2-gradient-text">starts here</span>
          </h2>
          <p className="lp2-cta__sub">
            Join 2,000+ businesses using Hubly to close more deals and delight every customer.
          </p>
          <div className="lp2-cta__actions">
            <Link to="/signup" className="lp2-btn lp2-btn--primary">
              Start your free trial →
            </Link>
            <Link to="/login" className="lp2-btn lp2-btn--ghost">
              Already have an account? Log in
            </Link>
          </div>
          <p className="lp2-cta__note">No credit card required · Free 14-day trial · Cancel anytime</p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="lp2-footer">
        <div className="lp2-container">
          <div className="lp2-footer__top">
            {/* Brand column */}
            <div className="lp2-footer__brand">
              <a href="#" className="lp2-nav__logo" style={{ marginBottom: 0 }}>
                <div className="lp2-nav__logo-mark">H</div>
                <span className="lp2-nav__brand">Hubly</span>
              </a>
              <p>
                The all-in-one CRM platform for businesses that want to grow faster,
                support smarter, and close more deals.
              </p>
              <div className="lp2-footer__social">
                <a href="#" className="lp2-footer__soc-btn" aria-label="Email">
                  <img src={mailIcon}    alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
                <a href="#" className="lp2-footer__soc-btn" aria-label="LinkedIn">
                  <img src={linkedinIcon} alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
                <a href="#" className="lp2-footer__soc-btn" aria-label="Twitter">
                  <img src={twitterIcon}  alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
                <a href="#" className="lp2-footer__soc-btn" aria-label="YouTube">
                  <img src={youtubeIcon}  alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
                <a href="#" className="lp2-footer__soc-btn" aria-label="Instagram">
                  <img src={instaIcon}    alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
                <a href="#" className="lp2-footer__soc-btn" aria-label="Figma">
                  <img src={figmaIcon}    alt="" style={{ width: 16, height: 16, objectFit: "contain" }} />
                </a>
              </div>
            </div>

            {/* Link columns */}
            <div className="lp2-footer__col">
              <div className="lp2-footer__col-title">Product</div>
              <a href="#features">Features</a>
              <a href="#pricing">Pricing</a>
              <a href="#how">How it works</a>
              <a href="#">Changelog</a>
              <a href="#">Roadmap</a>
            </div>
            <div className="lp2-footer__col">
              <div className="lp2-footer__col-title">Resources</div>
              <a href="#">Documentation</a>
              <a href="#">API Reference</a>
              <a href="#">Blog</a>
              <a href="#">Success Stories</a>
              <a href="#">Community</a>
            </div>
            <div className="lp2-footer__col">
              <div className="lp2-footer__col-title">Company</div>
              <a href="#">About</a>
              <a href="#">Careers</a>
              <a href="#">Press</a>
              <a href="#">Contact</a>
            </div>
            <div className="lp2-footer__col">
              <div className="lp2-footer__col-title">Legal</div>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <a href="#">Cookie Policy</a>
              <a href="#">Service Status</a>
            </div>
          </div>

          <div className="lp2-footer__bottom">
            <span>© 2025 Hubly CRM. All rights reserved.</span>
            <div style={{ display: "flex", gap: 20 }}>
              <a href="#">Privacy</a>
              <a href="#">Terms</a>
              <a href="#">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Fixed chat widget */}
      <MiniChat />
    </div>
  );
}
