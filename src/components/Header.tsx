import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="logo">Audit AI</div>
        <nav className="nav">
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/about">About</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
