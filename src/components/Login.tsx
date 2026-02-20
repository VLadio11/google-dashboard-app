import { useGoogleLogin } from '@react-oauth/google';

const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
].join(' ');

interface LoginProps {
  onSignIn: (accessToken: string) => void;
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function Login({ onSignIn }: LoginProps) {
  const login = useGoogleLogin({
    scope: SCOPES,
    onSuccess: (response) => {
      onSignIn(response.access_token);
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <rect width="48" height="48" rx="12" fill="#E8F0FE" />
              <path d="M34 16H14a2 2 0 00-2 2v12a2 2 0 002 2h20a2 2 0 002-2V18a2 2 0 00-2-2z" fill="#1a73e8" opacity="0.15"/>
              <rect x="12" y="24" width="24" height="2" fill="#1a73e8"/>
              <rect x="16" y="20" width="4" height="8" rx="1" fill="#34a853"/>
              <rect x="22" y="18" width="4" height="10" rx="1" fill="#1a73e8"/>
              <rect x="28" y="22" width="4" height="6" rx="1" fill="#fbbc04"/>
            </svg>
          </div>
          <h1 className="login-title">Analytics Dashboard</h1>
          <p className="login-subtitle">
            Connect Google Analytics and Search Console to see your key metrics in one place.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon feature-blue">GA</span>
            <div>
              <strong>Google Analytics 4</strong>
              <span> — Sessions, users, events &amp; top pages</span>
            </div>
          </div>
          <div className="feature-item">
            <span className="feature-icon feature-green">SC</span>
            <div>
              <strong>Search Console</strong>
              <span> — Clicks, impressions, CTR &amp; top queries</span>
            </div>
          </div>
        </div>

        <button className="btn-google" onClick={() => login()}>
          <GoogleIcon />
          Sign in with Google
        </button>

        <p className="login-note">
          Read-only access only. No data is stored — all requests go directly to Google APIs.
        </p>
      </div>
    </div>
  );
}
