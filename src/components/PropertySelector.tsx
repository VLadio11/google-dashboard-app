import { useState, useEffect } from 'react';
import { fetchGA4AccountSummaries } from '../services/analyticsApi';
import { fetchSCSites } from '../services/searchConsoleApi';
import { fetchAdsAccessibleCustomers, fetchAdsCustomerInfo } from '../services/adsApi';
import type { GA4AccountSummary, SCSite, AdsCustomer } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface PropertySelectorProps {
  accessToken: string;
  onSelect: (
    gaPropertyId: string,
    scSiteUrl: string | null,
    adsCustomerId: string | null,
    adsCurrencyCode: string
  ) => void;
  onSignOut: () => void;
}

interface FlatProperty {
  id: string;          // numeric, e.g. "12345"
  displayName: string;
  accountName: string;
}

const HAS_ADS_TOKEN = !!import.meta.env.VITE_GOOGLE_ADS_DEVELOPER_TOKEN;

export default function PropertySelector({ accessToken, onSelect, onSignOut }: PropertySelectorProps) {
  const [properties, setProperties] = useState<FlatProperty[]>([]);
  const [sites, setSites] = useState<SCSite[]>([]);
  const [adsCustomers, setAdsCustomers] = useState<AdsCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [adsError, setAdsError] = useState<string | null>(null);

  const [selectedProperty, setSelectedProperty] = useState('');
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const requests: Promise<unknown>[] = [
          fetchGA4AccountSummaries(accessToken),
          fetchSCSites(accessToken),
        ];
        if (HAS_ADS_TOKEN) {
          requests.push(
            fetchAdsAccessibleCustomers(accessToken).then((ids) =>
              Promise.all(
                ids.map((id) =>
                  fetchAdsCustomerInfo(accessToken, id).catch(() => null)
                )
              )
            )
          );
        }

        const results = await Promise.allSettled(requests);
        const [accountsRes, sitesRes, adsRes] = results;

        // GA4 properties
        if (accountsRes.status === 'fulfilled') {
          const accounts: GA4AccountSummary[] =
            (accountsRes.value as { accountSummaries?: GA4AccountSummary[] }).accountSummaries ?? [];
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
          const siteList: SCSite[] =
            (sitesRes.value as { siteEntry?: SCSite[] }).siteEntry ?? [];
          setSites(siteList);
          if (siteList.length > 0) setSelectedSite(siteList[0].siteUrl);
        }

        // Google Ads customers
        if (HAS_ADS_TOKEN && adsRes) {
          if (adsRes.status === 'fulfilled') {
            const customers = (adsRes.value as (AdsCustomer | null)[]).filter(
              Boolean
            ) as AdsCustomer[];
            setAdsCustomers(customers);
            if (customers.length > 0) setSelectedCustomer(customers[0].id);
          } else {
            const msg =
              adsRes.reason instanceof Error
                ? adsRes.reason.message
                : 'Failed to load Google Ads accounts';
            setAdsError(msg);
          }
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
    const customer = adsCustomers.find((c) => c.id === selectedCustomer);
    onSelect(
      selectedProperty,
      selectedSite || null,
      selectedCustomer || null,
      customer?.currencyCode ?? 'USD'
    );
  }

  return (
    <div className="setup-page">
      <div className="setup-card">
        <h1 className="setup-title">Connect Your Properties</h1>
        <p className="setup-subtitle">
          Choose which GA4 property, Search Console site, and Google Ads account to display.
        </p>

        {loading && <LoadingSpinner message="Fetching your properties..." />}

        {error && (
          <div className="error-banner">
            <strong>Error:</strong> {error}
          </div>
        )}

        {!loading && !error && (
          <div className="setup-fields">
            {/* GA4 */}
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

            {/* Search Console */}
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

            {/* Google Ads */}
            <div className="field-group">
              <label htmlFor="ads-customer" className="field-label">
                Google Ads Account{' '}
                <span className="field-optional">(optional)</span>
              </label>
              {!HAS_ADS_TOKEN ? (
                <div className="empty-state small">
                  Set <code>VITE_GOOGLE_ADS_DEVELOPER_TOKEN</code> in your <code>.env</code> to
                  enable Google Ads data.
                </div>
              ) : adsError ? (
                <div className="error-banner" style={{ fontSize: '12px', padding: '10px 12px' }}>
                  <strong>Ads API error:</strong> {adsError}
                  <div style={{ marginTop: 6, color: '#c5221f' }}>
                    If you are using a <strong>test developer token</strong>, it can only access
                    Google Ads <em>test accounts</em>. Apply for a production token at{' '}
                    <a
                      href="https://developers.google.com/google-ads/api/docs/get-started/dev-token"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'inherit' }}
                    >
                      developers.google.com
                    </a>.
                  </div>
                </div>
              ) : adsCustomers.length === 0 ? (
                <div className="empty-state small">
                  No Google Ads accounts found. Ads data will be skipped.
                </div>
              ) : (
                <select
                  id="ads-customer"
                  className="field-select"
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                >
                  <option value="">— Skip Google Ads —</option>
                  {adsCustomers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.descriptiveName} (ID: {c.id}) · {c.currencyCode}
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
