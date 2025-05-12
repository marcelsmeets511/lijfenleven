import { Link, useLocation } from "wouter";

const Header = () => {
  const [location] = useLocation();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <img className="h6 h6" src="https://lijfenleven.nu/wp-content/uploads/2023/09/Logo-1.png" />
              </Link>
            </div>
            <nav className="hidden sm:ml-6 sm:flex sm:space-x-8" aria-label="Global">
              <Link href="/">
                <a className={`${isActive('/') ? 'border-primary text-dark' : 'border-transparent text-dark-medium hover:border-gray-300 hover:text-dark'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Dashboard
                </a>
              </Link>
              <Link href="/quick-entry">
                <a className={`${isActive('/quick-entry') ? 'border-primary text-dark' : 'border-transparent text-dark-medium hover:border-gray-300 hover:text-dark'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Facturen
                </a>
              </Link>
              <Link href="/customers">
                <a className={`${isActive('/customers') ? 'border-primary text-dark' : 'border-transparent text-dark-medium hover:border-gray-300 hover:text-dark'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Klanten
                </a>
              </Link>
              <Link href="/rates">
                <a className={`${isActive('/rates') ? 'border-primary text-dark' : 'border-transparent text-dark-medium hover:border-gray-300 hover:text-dark'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Tarieven
                </a>
              </Link>
              <Link href="/overview-export">
                <a className={`${isActive('/overview-export') ? 'border-primary text-dark' : 'border-transparent text-dark-medium hover:border-gray-300 hover:text-dark'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}>
                  Rapporten
                </a>
              </Link>
            </nav>
          </div>
          <div className="flex items-center">
            <button type="button" className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
              <span className="sr-only">Bekijk meldingen</span>
              <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* Profile dropdown */}
            <div className="ml-3 relative">
              <div>
                <button type="button" className="bg-white rounded-full flex text-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" id="user-menu-button" aria-expanded="false" aria-haspopup="true">
                  <span className="sr-only">Open gebruikersmenu</span>
                  <img className="h-8 w-8 rounded-full" src="https://lijfenleven.nu/wp-content/uploads/2023/09/Foto-Hein-Kuipers-praktijk-lijfenleven-crop.jpg" alt="Gebruiker profiel foto" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
