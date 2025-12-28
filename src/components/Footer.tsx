import './Footer.css';

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} Audit AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
