"use client";

import { useState, useEffect } from "react";
import { AdminShell } from "@/components/admin-shell";

interface ChannelStatus {
  name: string;
  configured: boolean;
  status: "configured" | "unconfigured" | "demo_mode";
  details: string;
}

interface IntegrationStatuses {
  push: ChannelStatus;
  email: ChannelStatus;
  sms: ChannelStatus;
  osm: ChannelStatus;
  database: ChannelStatus;
}

export default function TestIntegrationsPage() {
  const [statuses, setStatuses] = useState<IntegrationStatuses | null>(null);
  const [loadingStatuses, setLoadingStatuses] = useState(true);

  // 1. Device Token Test State
  const [tokenUserId, setTokenUserId] = useState("usr-cust-01");
  const [testPushToken, setTestPushToken] = useState("ExponentPushToken[DEMO_TEST_TOKEN_XYZ_123]");
  const [tokenResult, setTokenResult] = useState<Record<string, unknown> | null>(null);
  const [tokenLoading, setTokenLoading] = useState(false);

  // 2. Push Notification Test State
  const [pushOrderId, setPushOrderId] = useState("ORD-984120");
  const [pushCustomerName, setPushCustomerName] = useState("Priya Sundaram");
  const [pushStatusChoice, setPushStatusChoice] = useState("dispatched");
  const [pushResult, setPushResult] = useState<Record<string, unknown> | null>(null);
  const [pushLoading, setPushLoading] = useState(false);

  // 3. EmailJS Test State
  const [emailTo, setEmailTo] = useState("customer.care@example.com");
  const [emailName, setEmailName] = useState("Vikram Malhotra");
  const [emailOrderId, setEmailOrderId] = useState("ORD-984120");
  const [emailStatus, setEmailStatus] = useState("shipped");
  const [emailResult, setEmailResult] = useState<Record<string, unknown> | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);

  // 4. SMS (TextBee) Test State
  const [smsPhone, setSmsPhone] = useState("+919876543210");
  const [smsOrderId, setSmsOrderId] = useState("ORD-984120");
  const [smsStatus, setSmsStatus] = useState("out_for_delivery");
  const [smsResult, setSmsResult] = useState<Record<string, unknown> | null>(null);
  const [smsLoading, setSmsLoading] = useState(false);

  // 5. OpenStreetMap Test State
  const [osmQuery, setOsmQuery] = useState("Indiranagar, Bengaluru");
  const [osmLat, setOsmLat] = useState(12.9716);
  const [osmLon, setOsmLon] = useState(77.5946);
  const [osmPlaceName, setOsmPlaceName] = useState("Bengaluru Central, Karnataka");
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);

  // Fetch integration statuses
  const fetchStatuses = async () => {
    try {
      setLoadingStatuses(true);
      const res = await fetch("/api/integrations/status");
      const data = await res.json();
      setStatuses(data.integrations);
    } catch (e) {
      console.warn("Could not fetch integration statuses:", e);
    } finally {
      setLoadingStatuses(false);
    }
  };

  useEffect(() => {
    fetchStatuses();
  }, []);

  // Handler: Save Device Token
  const handleSaveToken = async () => {
    try {
      setTokenLoading(true);
      setTokenResult(null);
      const res = await fetch("/api/users/device-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: tokenUserId,
          token: testPushToken,
          platform: "android",
        }),
      });
      const data = await res.json();
      setTokenResult(data);
    } catch (e: unknown) {
      const err = e as Error;
      setTokenResult({ success: false, error: err.message });
    } finally {
      setTokenLoading(false);
    }
  };

  // Handler: Test Push Notification
  const handleTestPush = async () => {
    try {
      setPushLoading(true);
      setPushResult(null);
      const res = await fetch("/api/notifications/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceToken: testPushToken,
          orderId: pushOrderId,
          status: pushStatusChoice,
          customerName: pushCustomerName,
        }),
      });
      const data = await res.json();
      setPushResult(data);
    } catch (e: unknown) {
      const err = e as Error;
      setPushResult({ success: false, error: err.message });
    } finally {
      setPushLoading(false);
    }
  };

  // Handler: Test EmailJS
  const handleTestEmail = async () => {
    try {
      setEmailLoading(true);
      setEmailResult(null);
      const res = await fetch("/api/notifications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail: emailTo,
          customerName: emailName,
          orderId: emailOrderId,
          status: emailStatus,
        }),
      });
      const data = await res.json();
      setEmailResult(data);
    } catch (e: unknown) {
      const err = e as Error;
      setEmailResult({ success: false, error: err.message });
    } finally {
      setEmailLoading(false);
    }
  };

  // Handler: Test SMS
  const handleTestSms = async () => {
    try {
      setSmsLoading(true);
      setSmsResult(null);
      const res = await fetch("/api/notifications/sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: smsPhone,
          orderId: smsOrderId,
          status: smsStatus,
        }),
      });
      const data = await res.json();
      setSmsResult(data);
    } catch (e: unknown) {
      const err = e as Error;
      setSmsResult({ success: false, error: err.message });
    } finally {
      setSmsLoading(false);
    }
  };

  // Handler: Test OpenStreetMap Nominatim
  const handleTestOsm = async () => {
    if (!osmQuery.trim()) return;
    try {
      setOsmLoading(true);
      setOsmError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          osmQuery.trim() + ", India"
        )}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "CalinfcoAdminTestingPage/1.0",
          },
        }
      );
      if (res.ok) {
        const results = await res.json();
        if (results && results.length > 0) {
          const match = results[0];
          setOsmLat(parseFloat(match.lat));
          setOsmLon(parseFloat(match.lon));
          setOsmPlaceName(match.display_name || osmQuery);
        } else {
          setOsmError("Address not found on OpenStreetMap. Manual entry fallback active.");
        }
      } else {
        setOsmError(`Nominatim HTTP ${res.status}: fallback to manual entry.`);
      }
    } catch (e: unknown) {
      const err = e as Error;
      setOsmError(`OSM network exception: ${err.message}. Manual address entry is used as fallback.`);
    } finally {
      setOsmLoading(false);
    }
  };

  const getStatusBadge = (cfg?: boolean, statusText?: string) => {
    if (cfg) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Configured
        </span>
      );
    }
    if (statusText === "demo_mode") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          Demo Mode (Memory)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
        Unconfigured (Safe Fallback)
      </span>
    );
  };

  return (
    <AdminShell>
      <div className="space-y-8 max-w-7xl mx-auto">
        {/* Header */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                ⚡ Integration Diagnostics & Test Suite
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Zero-deception live diagnostic suite for Android Push (FCM), EmailJS, TextBee SMS, OpenStreetMap, and Device Tokens.
              </p>
            </div>
            <button
              onClick={fetchStatuses}
              disabled={loadingStatuses}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              🔄 Refresh Statuses
            </button>
          </div>
        </div>

        {/* Global Architecture / Policy Banner */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 leading-relaxed space-y-2">
          <div className="font-semibold text-cyan-400 flex items-center gap-2">
            🛡️ Calinfco Zero-Deception & Zero-Leaks Guarantee:
          </div>
          <p>
            1. All credentials remain in server environment variables or native configuration files (<code className="text-cyan-300 font-mono">google-services.json</code>, <code className="text-cyan-300 font-mono">.env.local</code>). No secrets are exposed to client code.
          </p>
          <p>
            2. When credentials are unconfigured, services gracefully report <code className="text-amber-400 font-mono">&#123; status: &quot;unconfigured&quot; &#125;</code> and never falsify successful delivery.
          </p>
          <p>
            3. Address lookup strictly uses zero-cost OpenStreetMap with complete manual entry fallback for resilient delivery dispatch.
          </p>
        </div>

        {/* Live Channel Status Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Push Notifications</div>
              <div className="text-sm font-bold text-white mt-1">Android FCM / Expo</div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {getStatusBadge(statuses?.push?.configured)}
              <span className="text-[11px] text-slate-500">{statuses?.push?.details || "Checking..."}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Email Dispatch</div>
              <div className="text-sm font-bold text-white mt-1">EmailJS Service</div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {getStatusBadge(statuses?.email?.configured)}
              <span className="text-[11px] text-slate-500">{statuses?.email?.details || "Checking..."}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">SMS Notifications</div>
              <div className="text-sm font-bold text-white mt-1">TextBee Gateway</div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {getStatusBadge(statuses?.sms?.configured)}
              <span className="text-[11px] text-slate-500">{statuses?.sms?.details || "Checking..."}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Maps & Geocoding</div>
              <div className="text-sm font-bold text-white mt-1">OpenStreetMap</div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {getStatusBadge(true)}
              <span className="text-[11px] text-slate-500">Zero-cost Nominatim & Embed</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Persistence</div>
              <div className="text-sm font-bold text-white mt-1">Cloud Firestore</div>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              {getStatusBadge(statuses?.database?.configured, statuses?.database?.status)}
              <span className="text-[11px] text-slate-500">{statuses?.database?.details || "Checking..."}</span>
            </div>
          </div>
        </div>

        {/* Section 1: Device Token Registration Test */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                📱 1. Device Push Token Registration Test
              </h2>
              <p className="text-xs text-slate-400">
                Tests client endpoint <code className="text-cyan-400 font-mono">POST /api/users/device-token</code> which stores native Android FCM device tokens in Firestore.
              </p>
            </div>
            <span className="px-2 py-1 rounded text-xs font-mono bg-slate-800 text-slate-300">
              POST /api/users/device-token
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">User ID</label>
              <input
                type="text"
                value={tokenUserId}
                onChange={(e) => setTokenUserId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Device Push Token (FCM / Expo)</label>
              <input
                type="text"
                value={testPushToken}
                onChange={(e) => setTestPushToken(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveToken}
              disabled={tokenLoading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {tokenLoading ? "Saving Token..." : "Register Device Token"}
            </button>
          </div>

          {tokenResult && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">API Response:</div>
              <pre className="text-xs text-cyan-300 font-mono overflow-x-auto">
                {JSON.stringify(tokenResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Section 2: FCM / Expo Push Notifications Test */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🔔 2. Android Push Notification Dispatch Test
              </h2>
              <p className="text-xs text-slate-400">
                Tests server-side push notification dispatch via FCM / Expo Push Gateway.
              </p>
            </div>
            {getStatusBadge(statuses?.push?.configured)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order ID</label>
              <input
                type="text"
                value={pushOrderId}
                onChange={(e) => setPushOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Name</label>
              <input
                type="text"
                value={pushCustomerName}
                onChange={(e) => setPushCustomerName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Status Trigger</label>
              <select
                value={pushStatusChoice}
                onChange={(e) => setPushStatusChoice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                <option value="placed">Placed (Order Confirmed)</option>
                <option value="confirmed">Confirmed</option>
                <option value="dispatched">Dispatched</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="installed">Installed</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestPush}
              disabled={pushLoading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {pushLoading ? "Dispatching..." : "Send Test Push Notification"}
            </button>
          </div>

          {pushResult && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">API Response:</div>
              <pre className="text-xs text-indigo-300 font-mono overflow-x-auto">
                {JSON.stringify(pushResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Section 3: EmailJS Transactional Email Test */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                ✉️ 3. EmailJS Transactional Email Test
              </h2>
              <p className="text-xs text-slate-400">
                Tests server endpoint <code className="text-cyan-400 font-mono">POST /api/notifications/email</code> via documented EmailJS REST API.
              </p>
            </div>
            {getStatusBadge(statuses?.email?.configured)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Email</label>
              <input
                type="email"
                value={emailTo}
                onChange={(e) => setEmailTo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Recipient Name</label>
              <input
                type="text"
                value={emailName}
                onChange={(e) => setEmailName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order Status</label>
              <input
                type="text"
                value={emailStatus}
                onChange={(e) => setEmailStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestEmail}
              disabled={emailLoading}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {emailLoading ? "Sending Email..." : "Send Test Email"}
            </button>
          </div>

          {emailResult && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">API Response:</div>
              <pre className="text-xs text-blue-300 font-mono overflow-x-auto">
                {JSON.stringify(emailResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Section 4: TextBee SMS Gateway Test */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                💬 4. TextBee SMS Gateway Test
              </h2>
              <p className="text-xs text-slate-400">
                Tests server endpoint <code className="text-cyan-400 font-mono">POST /api/notifications/sms</code> with server-managed TextBee credentials.
              </p>
            </div>
            {getStatusBadge(statuses?.sms?.configured)}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Phone Number (E.164)</label>
              <input
                type="text"
                value={smsPhone}
                onChange={(e) => setSmsPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                placeholder="+919876543210"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order ID</label>
              <input
                type="text"
                value={smsOrderId}
                onChange={(e) => setSmsOrderId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Order Status</label>
              <input
                type="text"
                value={smsStatus}
                onChange={(e) => setSmsStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTestSms}
              disabled={smsLoading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50"
            >
              {smsLoading ? "Dispatching SMS..." : "Send Test SMS"}
            </button>
          </div>

          {smsResult && (
            <div className="mt-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
              <div className="text-xs font-bold text-slate-400 mb-1">API Response:</div>
              <pre className="text-xs text-emerald-300 font-mono overflow-x-auto">
                {JSON.stringify(smsResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Section 5: OpenStreetMap (OSM) Nominatim & Map Rendering Test */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                🗺️ 5. OpenStreetMap (OSM) Nominatim Geocoder & Map Test
              </h2>
              <p className="text-xs text-slate-400">
                Tests zero-cost geocoding via Nominatim and OpenStreetMap embed preview with manual address fallback.
              </p>
            </div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Free & Open Source
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={osmQuery}
              onChange={(e) => setOsmQuery(e.target.value)}
              placeholder="Enter locality or city (e.g. Koramangala, Bengaluru)"
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleTestOsm}
              disabled={osmLoading}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-lg transition disabled:opacity-50 whitespace-nowrap"
            >
              {osmLoading ? "Locating..." : "Geocode Address"}
            </button>
          </div>

          {osmError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              ⚠️ {osmError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-slate-300">Resolved Location:</div>
              <p className="text-xs text-slate-400">{osmPlaceName}</p>
              <div className="pt-2 flex items-center gap-4 text-xs font-mono text-cyan-400">
                <span>Latitude: {osmLat.toFixed(4)}° N</span>
                <span>Longitude: {osmLon.toFixed(4)}° E</span>
              </div>
              <div className="pt-2 text-[11px] text-slate-500">
                Manual Fallback Status: Ready (User can type flat, street, PIN code directly if geocoder is offline).
              </div>
            </div>

            <div className="h-48 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <iframe
                title="OpenStreetMap Live Preview"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${osmLon - 0.01}%2C${osmLat - 0.01}%2C${osmLon + 0.01}%2C${osmLat + 0.01}&layer=mapnik&marker=${osmLat}%2C${osmLon}`}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
