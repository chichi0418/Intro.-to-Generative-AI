module.exports = {
  definition: {
    name: 'get_weather',
    description: 'Get the current weather for a city or location.',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'City name or location, e.g. "Tokyo", "New York", "London"',
        },
      },
      required: ['location'],
    },
  },
  execute: async ({ location }) => {
    try {
      const url = `https://wttr.in/${encodeURIComponent(location)}?format=j1`;
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'AI-Chat-App/2.0' },
        signal: AbortSignal.timeout(8000),
      });
      if (!resp.ok) return { error: `Weather service returned ${resp.status}` };
      const data = await resp.json();
      const current = data.current_condition?.[0];
      if (!current) return { error: 'No weather data available' };

      const nearestArea = data.nearest_area?.[0];
      const areaName = nearestArea?.areaName?.[0]?.value ?? location;
      const country = nearestArea?.country?.[0]?.value ?? '';

      return {
        location: country ? `${areaName}, ${country}` : areaName,
        temperature_c: current.temp_C,
        temperature_f: current.temp_F,
        feels_like_c: current.FeelsLikeC,
        humidity: `${current.humidity}%`,
        condition: current.weatherDesc?.[0]?.value ?? 'Unknown',
        wind_kmph: current.windspeedKmph,
        visibility_km: current.visibility,
      };
    } catch (err) {
      return { error: err.message || 'Failed to fetch weather' };
    }
  },
};
