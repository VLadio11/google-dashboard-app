import { useState, useEffect } from 'react';
import { fetchGA4AccountSummaries } from '../services/analyticsApi';
import { fetchSCSites } from '../services/searchConsoleApi';
import type { GA4AccountSummary, SCSite } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PropertySelectorProps {
  accessToken: string;
  onSelect: (gaPropertyId: string, scSiteUrl: string | null) => void;
  onSignOut: () => void;
}

interface FlatProperty {
  id: string;          // numeric, e.g. "12345"
  displayName: string;
  accountName: string;
}

export default function PropertySelector({ accessToken, onSelect, onSignOut }: PropertySelectorProps) {
  const [properties, setProperties] = useState<FlatProperty[]>([]);
  const [sites, setSites] = useState<SCSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedSite, setSelectedSite] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [accountsRes, sitesRes] = await Promise.allSettled([
          fetchGA4AccountSummaries(accessToken),
          fetchSCSites(accessToken),
        ]);

        // GA4 properties
        if (accountsRes.status === 'fulfilled') {
          const accounts: GA4AccountSummary[] = accountsRes.value.accountSummaries ?? [];
          const flat: FlatProperty[] = [];
          for (const account of accounts) {
            for (const prop of account.propertySummaries ?? []) {
              flat.push({
                id: prop.property.replace('properties/', ''),
                displayName: prop.displayName,
                accountName: account.displayName,
              });
            }
          }
          setProperties(flat);
          if (flat.length > 0) setSelectedProperty(flat[0].id);
        }

        // Search Console sites
        if (sitesRes.status === 'fulfilled') {
          const siteList: SCSite[] = sitesRes.value.siteEntry ?? [];
          setSites(siteList);
          if (siteList.length > 0) setSelectedSite(siteList[0].siteUrl);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load properties');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [accessToken]);

  function handleContinue() {
    if (!selectedProperty) return;
    onSelect(selectedProperty, selectedSite || null);
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h1 className="setup-title">Connect Your Properties</h1>
        <p className="setup-subtitle">
          Choose which GA4 property and Search Console site to display.
        </p>

        {loading && <LoadingSpinner message="Fetching your properties..." />}

        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="setup-fields">
            <div className="field-group">
              <label htmlFor="ga-property" className="field-label">
                Google Analytics 4 Property
              </label>
              {properties.length === 0 ? (
                <div className="empty-state small">
                  No GA4 properties found. Make sure you have access to at least one property.
                </div>
              ) : (
                <select
                  id="ga-property"
                  className="field-select"
                  value={selectedProperty}
                  onChange={(e) => setSelectedProperty(e.target.value)}
                >
                  {properties.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.displayName} — {p.accountName} (ID: {p.id})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="sc-site" className="field-label">
                Search Console Site{' '}
                <span className="field-optional">(optional)</span>
              </label>
              {sites.length === 0 ? (
                <div className="empty-state small">
                  No Search Console sites found. Search Console data will be skipped.
                </div>
              ) : (
                <select
                  id="sc-site"
                  className="field-select"
                  value={selectedSite}
                  onChange={(e) => setSelectedSite(e.target.value)}
                >
                  <option value="">— Skip Search Console —</option>
                  {sites.map((s) => (
                    <option key={s.siteUrl} value={s.siteUrl}>
                      {s.siteUrl} ({s.permissionLevel})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <button
              className="btn-primary"
              onClick={handleContinue}
              disabled={!selectedProperty}
            >
              Open Dashboard
            </button>
          </div>
        )}

        <button className="btn-text mt-4" onClick={onSignOut}>
          Sign out
        </button>
      </div>
    </div>
  );
}
