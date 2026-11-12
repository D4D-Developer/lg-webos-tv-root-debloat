// Live data for the unified status pill: weather + US AQI from Open-Meteo
// (free, no API key, CORS-enabled), apparent network latency (timed off
// the same weather request - no separate ping endpoint needed), and JS
// heap usage via the non-standard Chromium `performance.memory` (present
// on both old and new Chromium builds, so it should work on-device too;
// falls back to "N/A" anywhere it isn't).
//
// The weather/AQI half is also cached to localStorage so a cold TV boot
// can paint instantly from the last-good reading instead of showing
// placeholders until the network round-trip finishes. Latency and memory
// are inherently "this instant" measurements and are never cached - they
// just stay blank until the first real fetch completes.

const WEATHER_URL = "https://api.open-meteo.com/v1/forecast";
const AQI_URL = "https://air-quality-api.open-meteo.com/v1/air-quality";
const CACHE_KEY = "lg-tv-launcher:telemetry-cache";

// WMO weather codes -> a compact icon. Not exhaustive, covers the common
// buckets; unknown codes fall back to a generic cloud.
function iconForWeatherCode(code) {
  if (code === 0) return "☀️";
  if ([1, 2, 3].includes(code)) return "⛅";
  if ([45, 48].includes(code)) return "🌫️";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "🌧️";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "❄️";
  if ([95, 96, 99].includes(code)) return "⛈️";
  return "☁️";
}

// WMO weather codes bucketed by the visual effect they warrant, ranked by
// severity - a 3-hour window can show more than one condition, so this
// picks the worst one to animate (a storm later matters more than light
// rain happening right now).
const EFFECT_SEVERITY = { storm: 4, snow: 3, rain: 2, fog: 1, clear: 0 };

function effectForWeatherCode(code) {
  if ([95, 96, 99].includes(code)) return "storm";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "snow";
  if ([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "rain";
  if ([45, 48].includes(code)) return "fog";
  return "clear";
}

// Open-Meteo's hourly.time strings carry no timezone marker (with
// `timezone=auto`, they're the CITY's local civil time, e.g.
// "2026-11-12T14:00"). `new Date(thatString)` would parse it as the
// BROWSER's local time instead - wrong for any city that doesn't happen to
// share the device's own timezone. Parsing the components manually as if
// UTC, then correcting with the response's own `utc_offset_seconds`, gives
// the real absolute instant regardless of either timezone.
function parseLocationLocalAsUtcMillis(isoLocalString) {
  const [datePart, timePart] = isoLocalString.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  return Date.UTC(y, m - 1, d, hh, mm);
}

// The next ~3 hours of the hourly forecast, reduced to the single worst
// expected condition - "clear" if nothing notable is coming.
function classifyUpcomingWeather(hourly, utcOffsetSeconds = 0) {
  if (!hourly?.time || !hourly?.weather_code) return "clear";
  const now = Date.now();
  const horizon = now + 3 * 60 * 60 * 1000;
  let worst = "clear";
  for (let i = 0; i < hourly.time.length; i++) {
    const actualUtcMillis = parseLocationLocalAsUtcMillis(hourly.time[i]) - utcOffsetSeconds * 1000;
    if (actualUtcMillis < now - 60 * 60 * 1000 || actualUtcMillis > horizon) continue;
    const effect = effectForWeatherCode(hourly.weather_code[i]);
    if (EFFECT_SEVERITY[effect] > EFFECT_SEVERITY[worst]) worst = effect;
  }
  return worst;
}

function readMemoryMB() {
  const mem = performance.memory;
  if (!mem) return null;
  return Math.round(mem.usedJSHeapSize / (1024 * 1024));
}

function readCache(cityName) {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.city !== cityName) return null; // stale for a different city
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(entry) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // Storage full/unavailable - caching is a nice-to-have, never fatal.
  }
}

// What the status pill shows immediately on boot, before the first real
// fetch resolves - `stale: true` lets the UI mark it as a cached reading.
export function getCachedTelemetry(city) {
  const cached = readCache(city.name);
  if (!cached) return null;
  return {
    city: cached.city,
    tempC: cached.tempC,
    weatherIcon: cached.weatherIcon,
    usAqi: cached.usAqi,
    latencyMs: null,
    memMB: null,
    fetchedAt: cached.cachedAt,
    stale: true,
    // Forward-looking by nature - a stale cached reading from a while ago
    // isn't a trustworthy prediction for the next 3 hours, so this stays
    // "clear" (no effect) until the real fetch below actually resolves.
    upcomingWeather: "clear",
  };
}

export async function fetchTelemetry(city) {
  const start = performance.now();

  const weatherReq = fetch(
    `${WEATHER_URL}?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code&hourly=weather_code&forecast_days=1&timezone=auto`
  ).then((r) => r.json());

  const aqiReq = fetch(
    `${AQI_URL}?latitude=${city.lat}&longitude=${city.lon}&current=us_aqi`
  ).then((r) => r.json());

  const [weather, aqi] = await Promise.allSettled([weatherReq, aqiReq]);
  const latencyMs = Math.round(performance.now() - start);
  const weatherOk = weather.status === "fulfilled";
  const aqiOk = aqi.status === "fulfilled";

  // Merge over the previous cache so a transient failure in just one of
  // the two requests doesn't blank out the other's last-good value.
  const prev = readCache(city.name);
  const tempC = weatherOk ? Math.round(weather.value?.current?.temperature_2m) : prev?.tempC ?? null;
  const weatherIcon = weatherOk
    ? iconForWeatherCode(weather.value?.current?.weather_code)
    : prev?.weatherIcon ?? "❔";
  const usAqi = aqiOk ? aqi.value?.current?.us_aqi ?? null : prev?.usAqi ?? null;
  // Not cached (see getCachedTelemetry's note) - falls back to "clear"
  // rather than a stale prediction if this particular fetch failed.
  const upcomingWeather = weatherOk
    ? classifyUpcomingWeather(weather.value?.hourly, weather.value?.utc_offset_seconds)
    : "clear";

  if (weatherOk || aqiOk) {
    writeCache({ city: city.name, tempC, weatherIcon, usAqi, cachedAt: Date.now() });
  }

  return {
    city: city.name,
    tempC,
    weatherIcon,
    usAqi,
    upcomingWeather,
    latencyMs,
    memMB: readMemoryMB(),
    fetchedAt: Date.now(),
    stale: false,
  };
}

export function startTelemetryLoop(getCity, onUpdate, intervalMs = 5 * 60 * 1000) {
  let cancelled = false;

  // Paint instantly from cache (if any) so a cold TV boot never sits on
  // placeholders for the length of a network round-trip.
  const cached = getCachedTelemetry(getCity());
  if (cached) onUpdate(cached);

  async function run() {
    try {
      const data = await fetchTelemetry(getCity());
      if (!cancelled) onUpdate(data);
    } catch (err) {
      console.error("[telemetry] refresh failed", err);
    }
  }

  run();
  const timer = setInterval(run, intervalMs);

  return {
    refreshNow: run,
    stop() {
      cancelled = true;
      clearInterval(timer);
    },
  };
}
