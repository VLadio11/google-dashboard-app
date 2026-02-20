import { useState } from 'react';
import Login from './components/Login';
import PropertySelector from './components/PropertySelector';
import Dashboard from './components/Dashboard';
import { getDateRange } from './utils/dates';
import type { DatePreset } from './types';

type View = 'login' | 'setup' | 'dashboard';

export default function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [gaPropertyId, setGaPropertyId] = useState<string | null>(null);
  const [scSiteUrl, setScSiteUrl] = useState<string | null>(null);
  const [datePreset, setDatePreset] = useState<DatePreset>('28');

  const view: View = !accessToken ? 'login' : !gaPropertyId ? 'setup' : 'dashboard';
  const { startDate, endDate } = getDateRange(datePreset);

  function handleSignIn(token: string) {
    setAccessToken(token);
  }

  function handleSignOut() {
    setAccessToken(null);
    setGaPropertyId(null);
    setScSiteUrl(null);
  }

  function handlePropertySelect(propertyId: string, siteUrl: string | null) {
    setGaPropertyId(propertyId);
    setScSiteUrl(siteUrl);
  }

  function handleReset() {
    setGaPropertyId(null);
    setScSiteUrl(null);
  }

  return (
    <>
      {view === 'login' && <Login onSignIn={handleSignIn} />}
      {view === 'setup' && (
        <PropertySelector
          accessToken={accessToken!}
          onSelect={handlePropertySelect}
          onSignOut={handleSignOut}
        />
      )}
      {view === 'dashboard' && (
        <Dashboard
          accessToken={accessToken!}
          gaPropertyId={gaPropertyId!}
          scSiteUrl={scSiteUrl}
          startDate={startDate}
          endDate={endDate}
          datePreset={datePreset}
          onDatePresetChange={setDatePreset}
          onSignOut={handleSignOut}
          onReset={handleReset}
        />
      )}
    </>
  );
}
