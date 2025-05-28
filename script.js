const weatherApiKey = '49f563be3c6d910987f8faaaddb6010f';
const rapidApiKey = 'bdd3874361msh2e1e187f9decf48p10fc47jsnf7a437c26bf9';

let timeInterval;

window.addEventListener('load', () => {
  const greeting = document.getElementById('greeting-message');
  const message = 'Xin chào, đây là 1 trang web nhỏ của mình!';
  let index = 0;

  const typeSound = new Audio('./type-writter.mp3');
  typeSound.volume = 0.5;

  const typeInterval = setInterval(() => {
    if (index < message.length) {
      greeting.textContent += message.charAt(index);
      if (typeSound.canPlayType('audio/mpeg')) {
        typeSound.currentTime = 0;
        if (index % 2 === 0) typeSound.play();
      }
      index++;
    } else {
      clearInterval(typeInterval);
      setTimeout(() => greeting.remove(), 4000);
    }
  }, 80);

  // Lấy vị trí hiện tại
  if ('geolocation' in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords;
      try {
        showLoading(true);
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${weatherApiKey}&units=metric&lang=vi`);
        if (!res.ok) throw new Error('Không thể lấy vị trí hiện tại');
        const data = await res.json();
        displayWeather(data, true);
      } catch (error) {
        showError(error.message);
      } finally {
        showLoading(false);
      }
    });
  }
});

// Gợi ý thành phố
const cityInput = document.getElementById('city-input');
const datalist = document.getElementById('city-options');

cityInput.addEventListener('input', async () => {
  const query = cityInput.value.trim();
  datalist.innerHTML = '';
  if (query.length < 2) return;

  try {
    const res = await fetch(`https://wft-geo-db.p.rapidapi.com/v1/geo/cities?limit=5&namePrefix=${query}`, {
      headers: {
        'X-RapidAPI-Key': rapidApiKey,
        'X-RapidAPI-Host': 'wft-geo-db.p.rapidapi.com',
      },
    });
    const data = await res.json();
    data.data.forEach(city => {
      const option = document.createElement('option');
      option.value = `${city.city}, ${city.countryCode}`;
      datalist.appendChild(option);
    });
  } catch (err) {
    console.error('Lỗi khi lấy gợi ý thành phố:', err);
  }
});

// Nút "Xem thời tiết"
document.getElementById('get-weather').addEventListener('click', async () => {
  const city = cityInput.value.trim();
  if (!city) return showError('Vui lòng nhập tên thành phố');

  try {
    showLoading(true);
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${weatherApiKey}&units=metric&lang=vi`);
    if (!res.ok) throw new Error('Không tìm thấy thành phố');
    const data = await res.json();
    displayWeather(data, false);
  } catch (err) {
    showError(err.message);
  } finally {
    showLoading(false);
  }
});

// Hiển thị thời tiết
function displayWeather(data, isAutoLocation) {
  document.getElementById('city-text').textContent = `${data.name}, ${data.sys.country}`;
  document.getElementById('location-icon').style.display = isAutoLocation ? 'inline' : 'none';
  document.getElementById('temp').textContent = Math.round(data.main.temp);
  document.getElementById('desc').textContent = data.weather[0].description;
  document.getElementById('humidity').textContent = data.main.humidity;

  const iconCode = data.weather[0].icon;
  const iconUrl = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  const weatherIcon = document.getElementById('weather-icon');
  weatherIcon.src = iconUrl;
  weatherIcon.style.display = 'block';

  const resultBox = document.getElementById('weather-result');
  resultBox.style.opacity = 0;
  setTimeout(() => {
    resultBox.style.opacity = 1;
  }, 100);

  clearInterval(timeInterval);
  const timezoneOffset = data.timezone;
  updateLocalTime(timezoneOffset);
  timeInterval = setInterval(() => updateLocalTime(timezoneOffset), 1000);

  drawWeatherEffect(data.weather[0].main.toLowerCase());
}

// Cập nhật thời gian địa phương
function updateLocalTime(timezoneOffset) {
  const nowUTC = new Date(new Date().getTime() + new Date().getTimezoneOffset() * 60000);
  const localTime = new Date(nowUTC.getTime() + timezoneOffset * 1000);
  const formattedTime = localTime.toLocaleTimeString('vi-VN');
  document.getElementById('local-time').textContent = formattedTime;
}

// Hiển thị spinner loading
function showLoading(isLoading) {
  const spinner = document.getElementById('loading-spinner');
  if (spinner) spinner.style.display = isLoading ? 'flex' : 'none';
}

// Hiển thị lỗi UI
function showError(message) {
  const errorEl = document.getElementById('error-message');
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    setTimeout(() => {
      errorEl.textContent = '';
      errorEl.style.display = 'none';
    }, 4000);
  } else {
    alert(message); // fallback
  }
}

// Vẽ hiệu ứng thời tiết trên canvas
function drawWeatherEffect(weather) {
  const canvas = document.getElementById('weatherCanvas');
  const ctx = canvas.getContext('2d');

  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  let particles = [];
  const count = (weather.includes('rain') || weather.includes('snow')) ? 150 : 100;

  function createParticles() {
    particles = [];
    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 5 + 2,
        speed: Math.random() * 2 + 1,
      });
    }
  }

  function drawParticles(color, shape = 'circle') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = color;
    particles.forEach(p => {
      ctx.beginPath();
      if (shape === 'line') {
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x, p.y + p.size * 2);
        ctx.strokeStyle = color;
        ctx.stroke();
      } else {
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function updateParticles() {
    particles.forEach(p => {
      p.y += p.speed;
      if (p.y > canvas.height) {
        p.y = 0;
        p.x = Math.random() * canvas.width;
      }
    });
  }

  function animate(color, shape) {
    drawParticles(color, shape);
    updateParticles();
    requestAnimationFrame(() => animate(color, shape));
  }

  createParticles();

  if (weather.includes('rain')) {
    animate('blue', 'line');
  } else if (weather.includes('snow')) {
    animate('white', 'circle');
  } else if (weather.includes('cloud')) {
    animate('gray', 'circle');
  } else if (weather.includes('clear')) {
    animate('yellow', 'circle');
  } else if (weather.includes('fog')) {
    animate('lightgray', 'circle');
  } else if (weather.includes('thunder')) {
    animate('purple', 'line');
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}
