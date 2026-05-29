import { useState } from 'react';
import {
  Navigation, MapPin, Globe, Clock, Compass, Bookmark, Loader2,
  AlertCircle, ChevronUp, ChevronDown, Copy, Check
} from 'lucide-react';
import type { LocationInfo, Coordinates } from '../types';

interface LocationPanelProps {
  userLocation: LocationInfo | null;
  selectedLocation: { coordinates: Coordinates; address?: string; city?: string; country?: string } | null;
  loading: boolean;
  error: string | null;
  onGetLocation: () => void;
  onSavePlace: (name: string) => void;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button onClick={handleCopy} className="p-1 rounded hover:bg-gray-100 transition-colors" title="Copier">
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
    </button>
  );
}

function InfoRow({ icon, label, value, copyable }: { icon: React.ReactNode; label: string; value: string; copyable?: boolean }) {
  return (
    <div className="flex items-start gap-2.5 py-2 border-b border-gray-50 last:border-0">
      <span className="text-blue-500 flex-shrink-0 mt-0.5">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{label}</div>
        <div className="text-sm text-gray-700 mt-0.5 break-words leading-relaxed">{value}</div>
      </div>
      {copyable && <CopyButton text={value} />}
    </div>
  );
}

export default function LocationPanel({
  userLocation,
  selectedLocation,
  loading,
  error,
  onGetLocation,
  onSavePlace,
}: LocationPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const [saveName, setSaveName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  const active = selectedLocation || (userLocation ? {
    coordinates: userLocation.coordinates,
    address: userLocation.address,
    city: userLocation.city,
    country: userLocation.country,
  } : null);

  function handleSave() {
    const name = saveName.trim() || active?.city || 'Lieu favori';
    onSavePlace(name);
    setSaveName('');
    setShowSaveForm(false);
  }

  function formatCoords(c: Coordinates) {
    return `${c.lat.toFixed(6)}, ${c.lng.toFixed(6)}`;
  }

  function formatTime(ts: number) {
    return new Date(ts).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden animate-slide-up">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-blue-200" />
          <span className="text-sm font-semibold text-white">Informations de localisation</span>
        </div>
        {expanded ? <ChevronDown className="w-4 h-4 text-blue-200" /> : <ChevronUp className="w-4 h-4 text-blue-200" />}
      </div>

      {expanded && (
        <div className="p-4">
          {/* Locate button */}
          <button
            onClick={onGetLocation}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 mb-4
              bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400
              text-white text-sm font-medium rounded-xl transition-all duration-200
              shadow-sm hover:shadow-md active:scale-95"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Localisation en cours...</>
            ) : (
              <><Navigation className="w-4 h-4" /> Ma position actuelle</>
            )}
          </button>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl mb-4 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">{error}</p>
            </div>
          )}

          {/* Location info */}
          {active ? (
            <div className="animate-fade-in">
              <div className="space-y-0">
                <InfoRow
                  icon={<Globe className="w-4 h-4" />}
                  label="Coordonnées"
                  value={formatCoords(active.coordinates)}
                  copyable
                />
                {active.address && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Adresse"
                    value={active.address.split(',').slice(0, 4).join(',')}
                  />
                )}
                {active.city && (
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Ville"
                    value={`${active.city}${active.country ? ` — ${active.country}` : ''}`}
                  />
                )}
                {userLocation?.accuracy && !selectedLocation && (
                  <InfoRow
                    icon={<Compass className="w-4 h-4" />}
                    label="Précision"
                    value={userLocation.accuracy < 1000 ? `±${Math.round(userLocation.accuracy)} m` : `±${(userLocation.accuracy / 1000).toFixed(1)} km`}
                  />
                )}
                {userLocation?.timestamp && !selectedLocation && (
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label="Actualisé"
                    value={formatTime(userLocation.timestamp)}
                  />
                )}
              </div>

              {/* Save place */}
              {!showSaveForm ? (
                <button
                  onClick={() => setShowSaveForm(true)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2 px-4
                    border-2 border-dashed border-blue-200 hover:border-blue-400
                    text-blue-600 hover:text-blue-700 text-sm font-medium rounded-xl
                    hover:bg-blue-50 transition-all duration-200"
                >
                  <Bookmark className="w-4 h-4" />
                  Enregistrer ce lieu
                </button>
              ) : (
                <div className="mt-4 flex gap-2 animate-fade-in">
                  <input
                    type="text"
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSave()}
                    placeholder={active.city || "Nom du lieu"}
                    autoFocus
                    className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-lg
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleSave}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    <Bookmark className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-lg transition-colors"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-400">
              <MapPin className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Cliquez sur "Ma position" ou sur la carte</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
