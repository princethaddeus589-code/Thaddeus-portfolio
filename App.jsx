import { useState, useEffect } from 'react';
import './App.css';

const ADMIN_EMAIL = 'princethaddeus589@gmail.com';
const ADMIN_PASSWORD = 'Linda2004@';
const STORAGE_KEYS = ['pg_users', 'team_users', 'pf_users'];

const TITLES = {
  overview: 'Overview',
  users: 'Users',
  portfolios: 'Portfolios',
  activity: 'Activity',
};

function collectData() {
  const users = [];
  const portfolios = [];

  STORAGE_KEYS.forEach((key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return;
      const data = JSON.parse(raw);

      Object.keys(data).forEach((email) => {
        const u = data[email];
        if (!u || !u.email) return;
        if (users.find((x) => x.email === u.email)) return;

        const ups = u.portfolios || [];
        const hasProfile = !!u.profile;

        users.push({
          name: u.name || 'Unknown',
          email: u.email,
          portfolioCount: ups.length || (hasProfile ? 1 : 0),
          source: key,
        });

        if (ups.length) {
          ups.forEach((p) => {
            portfolios.push({
              name: p.portfolioName || p.name || 'Untitled',
              owner: u.name || u.email,
              theme: p.theme || 'dark',
              title: p.title || '—',
              savedAt: p.savedAt || '—',
            });
          });
        } else if (hasProfile) {
          portfolios.push({
            name: u.profile.name || u.name || 'Profile',
            owner: u.name || u.email,
            theme: '—',
            title: u.profile.title || '—',
            savedAt: '—',
          });
        }
      });
    } catch {
      // ignore bad storage
    }
  });

  return { users, portfolios };
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem('admin_ok') === '1'
  );
  const [theme, setTheme] = useState(
    () => localStorage.getItem('admin_theme') || 'light'
  );
  const [panel, setPanel] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState(ADMIN_EMAIL);
  const [loginPassword, setLoginPassword] = useState(ADMIN_PASSWORD);
  const [loginError, setLoginError] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [portfolioSearch, setPortfolioSearch] = useState('');
  const [data, setData] = useState({ users: [], portfolios: [] });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (isLoggedIn) refreshData();
  }, [isLoggedIn]);

  function refreshData() {
    setData(collectData());
  }

  function handleLogin(e) {
    e?.preventDefault();
    const email = loginEmail.trim().toLowerCase();
    if (email === ADMIN_EMAIL.toLowerCase() && loginPassword === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_ok', '1');
      setLoginError('');
      setIsLoggedIn(true);
    } else {
      setLoginError('Incorrect email or password.');
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('admin_ok');
    setIsLoggedIn(false);
    setSidebarOpen(false);
    setLoginError('');
  }

  function showPanel(name) {
    setPanel(name);
    setSidebarOpen(false);
  }

  function deleteUser(email, source) {
    if (!window.confirm(`Remove user ${email}?`)) return;
    try {
      const raw = localStorage.getItem(source);
      if (!raw) return;
      const stored = JSON.parse(raw);
      delete stored[email];
      localStorage.setItem(source, JSON.stringify(stored));
      refreshData();
    } catch {
      window.alert('Could not remove user.');
    }
  }

  const filteredUsers = data.users.filter((u) => {
    const q = userSearch.toLowerCase();
    if (!q) return true;
    return (
      (u.name || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q)
    );
  });

  const filteredPortfolios = data.portfolios.filter((p) => {
    const q = portfolioSearch.toLowerCase();
    if (!q) return true;
    return (
      (p.name || '').toLowerCase().includes(q) ||
      (p.owner || '').toLowerCase().includes(q) ||
      (p.title || '').toLowerCase().includes(q)
    );
  });

  const avg =
    data.users.length > 0
      ? (data.portfolios.length / data.users.length).toFixed(1)
      : '0';
  const themeCount = new Set(
    data.portfolios.map((p) => p.theme).filter((t) => t && t !== '—')
  ).size;

  // ---------- LOGIN ----------
  if (!isLoggedIn) {
    return (
      <>
        <button
          className="theme-toggle"
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
          type="button"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <div className="login-screen">
          <div className="login-card">
            <div className="login-logo">A</div>
            <h1>Admin Dashboard</h1>
            <p className="sub">Portfolio Generator control panel</p>
            {loginError && <div className="login-error">{loginError}</div>}
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  autoComplete="username"
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <button className="btn-primary" type="submit">
                Sign in to dashboard
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ---------- DASHBOARD ----------
  return (
    <>
      <button
        className="theme-toggle"
        onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        type="button"
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </button>

      <div className="app show">
        <div
          className={`sidebar-overlay${sidebarOpen ? ' open' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-top">
            <div className="sidebar-brand">
              <div className="mark">PG</div>
              Portfolio Admin
            </div>
          </div>
          <nav className="sidebar-nav">
            <div className="nav-label">Menu</div>
            {['overview', 'users', 'portfolios', 'activity'].map((id) => (
              <button
                key={id}
                type="button"
                className={`nav-item${panel === id ? ' active' : ''}`}
                onClick={() => showPanel(id)}
              >
                {id === 'overview' && '▣ Overview'}
                {id === 'users' && '◎ Users'}
                {id === 'portfolios' && '▤ Portfolios'}
                {id === 'activity' && '◉ Activity'}
              </button>
            ))}
          </nav>
          <div className="sidebar-bottom">
            <div className="admin-chip">
              <div className="av">P</div>
              <div className="meta">
                <div className="n">Prince Thaddeus</div>
                <div className="r">Administrator</div>
              </div>
            </div>
            <button type="button" className="nav-item" onClick={handleLogout}>
              ← Sign out
            </button>
          </div>
        </aside>

        <div className="main-wrap">
          <header className="topbar">
            <div className="topbar-left">
              <button
                type="button"
                className="menu-btn"
                onClick={() => setSidebarOpen(true)}
              >
                ☰
              </button>
              <h1>{TITLES[panel]}</h1>
            </div>
            <button type="button" className="btn-outline" onClick={refreshData}>
              Refresh
            </button>
          </header>

          <div className="content">
            {/* OVERVIEW */}
            {panel === 'overview' && (
              <div className="panel active">
                <div className="stats">
                  <div className="stat-card">
                    <div className="label">Total users</div>
                    <div className="value">{data.users.length}</div>
                    <div className="foot">Registered accounts</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Portfolios</div>
                    <div className="value">{data.portfolios.length}</div>
                    <div className="foot">Created by users</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Avg per user</div>
                    <div className="value">{avg}</div>
                    <div className="foot">Portfolios / account</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Themes in use</div>
                    <div className="value">{themeCount || 0}</div>
                    <div className="foot">Dark · Light · Blue</div>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="card">
                    <div className="card-head">
                      <h2>Recent users</h2>
                    </div>
                    <div className="table-wrap">
                      {data.users.length === 0 ? (
                        <div className="empty">No users yet.</div>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>User</th>
                              <th>Portfolios</th>
                              <th>Source</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[...data.users]
                              .slice(-5)
                              .reverse()
                              .map((u) => (
                                <tr key={u.email}>
                                  <td>
                                    <div className="user-cell">
                                      <div className="avatar">
                                        {(u.name || '?')[0].toUpperCase()}
                                      </div>
                                      <div>
                                        <div className="name">{u.name}</div>
                                        <div className="email">{u.email}</div>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <span className="badge badge-blue">
                                      {u.portfolioCount}
                                    </span>
                                  </td>
                                  <td>
                                    <span className="badge badge-gray">
                                      {u.source}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-head">
                      <h2>Quick activity</h2>
                    </div>
                    <OverviewActivity users={data.users} portfolios={data.portfolios} />
                  </div>
                </div>
              </div>
            )}

            {/* USERS */}
            {panel === 'users' && (
              <div className="panel active">
                <div className="card">
                  <div className="card-head">
                    <h2>All users</h2>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search by name or email..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                    />
                  </div>
                  <div className="table-wrap">
                    {filteredUsers.length === 0 ? (
                      <div className="empty">No users found.</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>User</th>
                            <th>Email</th>
                            <th>Portfolios</th>
                            <th>Storage</th>
                            <th className="col-action">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredUsers.map((u) => (
                            <tr key={u.email}>
                              <td>
                                <div className="user-cell">
                                  <div className="avatar">
                                    {(u.name || '?')[0].toUpperCase()}
                                  </div>
                                  <div className="name">{u.name}</div>
                                </div>
                              </td>
                              <td style={{ color: 'var(--muted)' }}>{u.email}</td>
                              <td>
                                <span className="badge badge-blue">
                                  {u.portfolioCount}
                                </span>
                              </td>
                              <td>
                                <span className="badge badge-gray">{u.source}</span>
                              </td>
                              <td className="col-action">
                                <button
                                  type="button"
                                  className="btn-sm danger"
                                  onClick={() => deleteUser(u.email, u.source)}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PORTFOLIOS */}
            {panel === 'portfolios' && (
              <div className="panel active">
                <div className="card">
                  <div className="card-head">
                    <h2>All portfolios</h2>
                    <input
                      type="text"
                      className="search-input"
                      placeholder="Search portfolios..."
                      value={portfolioSearch}
                      onChange={(e) => setPortfolioSearch(e.target.value)}
                    />
                  </div>
                  <div className="table-wrap">
                    {filteredPortfolios.length === 0 ? (
                      <div className="empty">No portfolios yet.</div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Portfolio</th>
                            <th>Owner</th>
                            <th>Title</th>
                            <th>Theme</th>
                            <th>Saved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPortfolios.map((p, i) => (
                            <tr key={`${p.name}-${p.owner}-${i}`}>
                              <td>
                                <strong>{p.name}</strong>
                              </td>
                              <td>{p.owner}</td>
                              <td style={{ color: 'var(--muted)' }}>{p.title}</td>
                              <td>
                                <span className="badge badge-green">{p.theme}</span>
                              </td>
                              <td
                                style={{
                                  color: 'var(--muted)',
                                  fontSize: '0.82rem',
                                }}
                              >
                                {p.savedAt}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ACTIVITY */}
            {panel === 'activity' && (
              <div className="panel active">
                <div className="card">
                  <div className="card-head">
                    <h2>System activity</h2>
                  </div>
                  <ActivityList users={data.users} portfolios={data.portfolios} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function OverviewActivity({ users, portfolios }) {
  const items = [];
  [...users]
    .slice(-4)
    .reverse()
    .forEach((u) =>
      items.push({ text: `${u.name} registered`, time: u.email, strong: u.name })
    );
  [...portfolios]
    .slice(-3)
    .reverse()
    .forEach((p) =>
      items.push({
        text: `Portfolio ${p.name}`,
        time: p.owner,
        strong: p.name,
      })
    );

  if (!items.length) {
    return <div className="empty" style={{ padding: 24 }}>No recent activity</div>;
  }

  return (
    <div>
      {items.slice(0, 6).map((a, i) => (
        <div className="activity-item" key={i}>
          <div className="activity-dot" />
          <div>
            <div className="activity-text">
              {a.strong ? (
                <>
                  <strong>{a.strong}</strong>
                  {a.text.replace(a.strong, '')}
                </>
              ) : (
                a.text
              )}
            </div>
            <div className="activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityList({ users, portfolios }) {
  const items = [];
  users.forEach((u) =>
    items.push({ text: `${u.name} created an account`, time: u.email, strong: u.name })
  );
  portfolios.forEach((p) =>
    items.push({
      text: `Portfolio ${p.name} by ${p.owner}`,
      time: p.savedAt !== '—' ? p.savedAt : p.title,
      strong: p.name,
    })
  );

  if (!items.length) {
    return <div className="empty">No activity yet.</div>;
  }

  return (
    <div>
      {items.slice(0, 25).map((a, i) => (
        <div className="activity-item" key={i}>
          <div className="activity-dot" />
          <div>
            <div className="activity-text">
              <strong>{a.strong}</strong>
              {a.text.replace(a.strong, '')}
            </div>
            <div className="activity-time">{a.time}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
