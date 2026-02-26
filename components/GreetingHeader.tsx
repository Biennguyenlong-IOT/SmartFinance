
import React, { useState, useEffect } from 'react';

const getWeatherIcon = (code: number, isDay: boolean): string => {
  // WMO Weather interpretation codes (WW)
  // https://open-meteo.com/en/docs
  if (code === 0) return isDay ? "☀️" : "🌕"; // Clear sky
  if (code === 1 || code === 2) return isDay ? "🌤️" : "☁️"; // Mainly clear, partly cloudy
  if (code === 3) return "☁️"; // Overcast
  if (code === 45 || code === 48) return "🌫️"; // Fog
  if (code >= 51 && code <= 55) return "🌦️"; // Drizzle
  if (code >= 61 && code <= 65) return "🌧️"; // Rain
  if (code >= 66 && code <= 67) return "🧊"; // Freezing rain
  if (code >= 71 && code <= 75) return "❄️"; // Snow
  if (code === 77) return "🌨️"; // Snow grains
  if (code >= 80 && code <= 82) return "🌧️"; // Rain showers
  if (code >= 85 && code <= 86) return "🌨️"; // Snow showers
  if (code >= 95) return "⛈️"; // Thunderstorm
  return isDay ? "☀️" : "🌙";
};

export const GreetingHeader: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [weatherData, setWeatherData] = useState<{ icon: string; temp: number | null }>({
    icon: "",
    temp: null
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async (lat: number, lon: number) => {
      try {
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        );
        const data = await response.json();
        if (data.current_weather) {
          const { weathercode, is_day, temperature } = data.current_weather;
          setWeatherData({
            icon: getWeatherIcon(weathercode, is_day === 1),
            temp: Math.round(temperature)
          });
        }
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thời tiết:", error);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchWeather(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.warn("Không thể lấy vị trí:", error.message);
        }
      );
    }
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) return { text: "Chào buổi sáng!", sub: "Chúc bạn một ngày mới tràn đầy năng lượng", fallbackIcon: "☀️" };
    if (hour >= 12 && hour < 18) return { text: "Chào buổi chiều!", sub: "Hy vọng công việc của bạn đang tiến triển tốt", fallbackIcon: "🌤️" };
    if (hour >= 18 && hour < 22) return { text: "Chào buổi tối!", sub: "Đã đến lúc nghỉ ngơi và ghi lại chi tiêu hôm nay", fallbackIcon: "🌙" };
    return { text: "Chào buổi khuya!", sub: "Khuya rồi, nghỉ ngơi sớm để giữ gìn sức khỏe nhé", fallbackIcon: "✨" };
  };

  const greeting = getGreeting();
  const dayName = currentTime.toLocaleDateString('vi-VN', { weekday: 'long' });
  const dateStr = currentTime.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 rounded-[2.5rem] p-8 shadow-2xl shadow-indigo-100 text-white">
      {/* Decorative Circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-400/20 rounded-full translate-y-24 -translate-x-24 blur-2xl"></div>

      <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center text-4xl shadow-inner border border-white/10">
              {weatherData.icon || greeting.fallbackIcon}
            </div>
            {weatherData.temp !== null && (
              <div className="absolute -top-2 -right-2 bg-white/30 backdrop-blur-md px-2 py-1 rounded-lg border border-white/20 text-[10px] font-black">
                {weatherData.temp}°C
              </div>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-black tracking-tight leading-none mb-2">{greeting.text}</h2>
            <p className="text-indigo-100/80 font-medium text-sm md:text-base">{greeting.sub}</p>
          </div>
        </div>

        <div className="bg-black/20 backdrop-blur-md rounded-3xl p-6 border border-white/10 min-w-[200px] text-center md:text-right">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200 mb-1">{dayName}, {dateStr}</p>
          <p className="text-4xl font-black tracking-tighter tabular-nums">{timeStr}</p>
        </div>
      </div>
    </div>
  );
};
