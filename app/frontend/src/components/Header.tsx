import './Header.css'

export function Header() {
  return (
    <header className="app-header">
      <div className="app-header__brand">
        <img className="app-header__logo" src="/favicon.svg" alt="" aria-hidden="true" />
        <span className="app-header__name">Webi Todo</span>
      </div>
    </header>
  )
}
