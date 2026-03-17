import { FacebookFilled, InstagramFilled } from "@ant-design/icons";

import "./Footer.css";

function Footer() {
  return (
    <footer className="footer-container">
      <div className="footer-logo-section">
        <div className="footer-logo-icon" />
        <span className="footer-logo-text">EduS</span>
      </div>

      <div className="footer-right">
        <div className="footer-copyright">
          ©2025 EduSocial. All rights reserved.
        </div>
        <div className="footer-social-links">
          <a
            href="https://www.facebook.com/tin.nodejs"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link facebook"
          >
            <FacebookFilled style={{ fontSize: "18px" }} />
          </a>
          <a
            href="https://www.instagram.com/tin963145/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-social-link instagram"
            style={{
              background:
                "radial-gradient(circle at 30% 107%, #fdf497 0%, #fdf497 5%, #fd5949 45%, #d6249f 60%, #285AEB 90%)",
            }}
          >
            <InstagramFilled style={{ fontSize: "18px" }} />
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

