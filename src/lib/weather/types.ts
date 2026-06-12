export interface WeatherSnapshot {
  location: string;
  region?: string;
  tempF: number;
  tempC: number;
  condition: string;
  icon: string;
  windMph: number;
  humidity: number;
  isDay: boolean;
  chanceOfRain?: number;
  willItRain?: boolean;
}

export interface MoveDayForecast {
  date: string;
  location: string;
  maxTempF: number;
  minTempF: number;
  condition: string;
  icon: string;
  chanceOfRain: number;
  maxWindMph: number;
}

export interface WeatherAlert {
  location: string;
  severity: "info" | "warning" | "severe";
  message: string;
}

export interface RouteWeatherResponse {
  origin: WeatherSnapshot | null;
  destination: WeatherSnapshot | null;
  moveDayForecast: MoveDayForecast | null;
  stopWeather: WeatherSnapshot[];
  alerts: WeatherAlert[];
  /** Set when move date is beyond the 14-day forecast window */
  forecastNote?: string | null;
}
