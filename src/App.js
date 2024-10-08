import React from 'react';
import './App.css'; // Import your CSS file for styles

const locations = ["Moscow", "Saint Petersburg", "Novosibirsk", "Yekaterinburg", "Kazan"];

class WeatherApp extends React.Component {
  state = {
    currentWeather: null,
    weeklyForecast: [],
    selectedCity: "Moscow",
    searchQuery: "",
    bgClass: "",
    coords: { lat: 55.7558, lon: 37.6176 } 
  };

  apiKey = '78dbb345-142d-44fd-b6e2-7e2d23a97d78';

  fetchWeather = async (latitude, longitude) => {
    try {
      const res = await fetch('/api/v2/forecast?lat=${latitude}&lon=${longitude}&lang=ru_RU&limit=7', {
        headers: {
          'X-Yandex-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        }
      });

      if (!res.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await res.json();
      console.log('Weather data:', result);

      if (result && result.fact) {
        console.log('Temperature:', result.fact.temp);
        console.log('Condition:', result.fact.condition);
        this.setState({
          currentWeather: result.fact,
          weeklyForecast: result.forecasts,
          bgClass: this.determineBgClass(result.fact.condition)
        });
      } else {
        console.error('No weather data or missing required fields in response:', result);
      }
    } catch (error) {
      console.error('Fetch operation problem:', error);
    }
  };

  componentDidMount() {
    const { lat, lon } = this.state.coords;
    this.fetchWeather(lat, lon);
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.coords !== prevState.coords) {
      const { lat, lon } = this.state.coords;
      this.fetchWeather(lat, lon);
    }
  }

  determineBgClass = (condition) => {
    const conditionMap = {
      'clear': 'clear-sky',
      'partly-cloudy': 'partly-cloudy',
      'cloudy': 'cloudy',
      'overcast': 'overcast',
      'drizzle': 'drizzle',
      'light-rain': 'light-rain',
      'rain': 'rain',
      'showers': 'showers',
      'thunderstorm': 'thunderstorm',
      'snow': 'snow',
      'snow-showers': 'snow-showers',
    };
    return conditionMap[condition] || 'default';
  };

  translateCondition = (condition) => {
    const translations = {
      'clear': 'ясно',
      'partly-cloudy': 'малооблачно',
      'cloudy': 'облачно с прояснениями',
      'overcast': 'пасмурно',
      'drizzle': 'морось',
      'light-rain': 'небольшой дождь',
      'rain': 'дождь',
      'showers': 'ливень',
      'thunderstorm': 'гроза',
      'snow': 'снег',
      'snow-showers': 'снегопад',
      'hail': 'град'
    };
    return translations[condition] || condition;
  };

  findCoordinates = (city) => {
    const cityCoords = {
      "Moscow": { lat: 55.7558, lon: 37.6176 },
      "Saint Petersburg": { lat: 59.9343, lon: 30.3351 },
      "Novosibirsk": { lat: 55.0084, lon: 82.9357 },
      "Yekaterinburg": { lat: 56.8389, lon: 60.6057 },
      "Kazan": { lat: 55.8304, lon: 49.0661 }
    };
    return cityCoords[city] || { lat: 55.7558, lon: 37.6176 }; // Default coordinates for Moscow
  };

  handleCitySearch = async () => {
    const { searchQuery } = this.state;
    if (searchQuery) {
      try {
        const geocodeApiKey = '481a3dd6-14d7-4589-afe9-36e777339e75';

        // Fetch coordinates of the city using geocoding API key
        const response = await fetch(`https://geocode-maps.yandex.ru/1.x/?apikey=${geocodeApiKey}&format=json&geocode=${searchQuery}&lang=ru_RU`);
        const data = await response.json();

        // Parse coordinates from the response
        const coordsArray = data.response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos.split(' ').map(parseFloat);

        // Fetch weather data for the obtained coordinates
        this.fetchWeather(coordsArray[1], coordsArray[0]);

        // Update state with the selected city and clear the search input
        this.setState({ selectedCity: searchQuery, searchQuery: "" });
      } catch (error) {
        console.error('Error while searching for city:', error);
      }
    }
  };

  handleInputChange = (e) => {
    this.setState({ searchQuery: e.target.value });
  };

  render() {
    const { currentWeather, weeklyForecast, selectedCity, searchQuery, bgClass } = this.state;

    return (
      <div className={`app ${bgClass}`}>
        <h1>Weather Forecast</h1>
        <div className="weather">
          <h2>Current weather in {selectedCity}</h2>
          {currentWeather ? (
            <div>
              <p>Temperature: {currentWeather.temp}°C</p>
              {currentWeather.icon ? (
                <img src={`https://yastatic.net/weather/i/icons/funky/dark/${currentWeather.icon}.svg`} alt="Weather icon" />
              ) : (
                <p>Icon not available</p>
              )}
              <p>Condition: {this.translateCondition(currentWeather.condition)}</p>
            </div>
          ) : (
            <p>Loading...</p>
          )}
        </div>
        <div className="forecast">
          <h2>Weekly Weather Forecast</h2>
          <div className="forecast-list">
            {weeklyForecast.length > 0 ? (
              weeklyForecast.map((day, idx) => (
                <div key={idx} className="forecast-item">
                  <p>{day.date}</p>
                  {day.parts.day.icon ? (
                    <img src={`https://yastatic.net/weather/i/icons/funky/dark/${day.parts.day.icon}.svg`} alt="Weather icon" />
                  ) : (
                    <p>Icon not available</p>
                  )}
                  <p>Max °C: {day.parts.day.temp_max}°C</p>
                  <p>Min °C: {day.parts.night.temp_min}°C</p>
                  <p>Condition: {this.translateCondition(day.parts.day.condition)}</p>
                </div>
              ))
            ) : (
              <p>Loading forecast...</p>
            )}
          </div>
        </div>
        <div className="search">
          <input
            type="text"
            value={searchQuery}
            onChange={this.handleInputChange}
            placeholder="Enter city"
          />
          <button onClick={this.handleCitySearch}>Search</button>
        </div>
        <div className="cities">
          <h2>Cities</h2>
          {locations.map((city) => (
            <button key={city} onClick={() => {
              const newCoords = this.findCoordinates(city);
              this.setState({ selectedCity: city, coords: newCoords });
            }}>
              {city}
            </button>
          ))}
        </div>
      </div>
    );
  }
}

export default WeatherApp;