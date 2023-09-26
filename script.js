
const apiKey = "faa74d00fe1eee5f928f7f5bae35e9ff";
const apiUrl = "https://api.openweathermap.org/data/2.5/";


const cityForm = document.getElementById("city-form");
const cityInput = document.getElementById("city-input");
const currentWeatherInfo = document.getElementById("current-weather-info");
const forecastInfo = document.getElementById("forecast-info");
const searchHistory = document.getElementById("search-history");


cityForm.addEventListener("submit", function (e) {
    e.preventDefault();
    const cityName = cityInput.value.trim();

    if (cityName) {
        getWeatherData(cityName);
        cityInput.value = "";
    }
});


function getWeatherData(city) {

    fetch(`${apiUrl}weather?q=${city}&appid=${apiKey}&units=metric`)
        .then((response) => response.json())
        .then((data) => {

            displayCurrentWeather(data);
        })
        .catch((error) => console.error("Error fetching current weather:", error));


    fetch(`${apiUrl}forecast?q=${city}&appid=${apiKey}&units=metric`)
        .then((response) => response.json())
        .then((data) => {

            displayForecast(data);
        })
        .catch((error) => console.error("Error fetching forecast:", error));

    addToSearchHistory(city);
}


function displayCurrentWeather(data) {
    const cityName = data.name;
    const date = new Date(data.dt * 1000).toLocaleDateString();
    const iconUrl = `https://openweathermap.org/img/wn/${data.weather[0].icon}.png`;
    const temperature = data.main.temp;
    const humidity = data.main.humidity;
    const windSpeed = data.wind.speed;


    currentWeatherInfo.innerHTML = `
        <h3>${cityName} - ${date}</h3>
        <img src="${iconUrl}" alt="Weather Icon">
        <p>Temperature: ${temperature}°C</p>
        <p>Humidity: ${humidity}%</p>
        <p>Wind Speed: ${windSpeed} m/s</p>
    `;
}


function displayForecast(data) {
    const forecastData = data.list.slice(0, 5);
    const forecastHTML = forecastData.map((item) => {
        const date = new Date(item.dt * 1000).toLocaleDateString();
        const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}.png`;
        const temperature = item.main.temp;
        const humidity = item.main.humidity;
        const windSpeed = item.wind.speed;

        return `
            <div class="forecast-item">
                <p>${date}</p>
                <img src="${iconUrl}" alt="Weather Icon">
                <p>Temperature: ${temperature}°C</p>
                <p>Humidity: ${humidity}%</p>
                <p>Wind Speed: ${windSpeed} m/s</p>
            </div>
        `;
    }).join("");
    forecastInfo.innerHTML = forecastHTML;
}

function addToSearchHistory(city) {
    const listItem = document.createElement("li");
    listItem.textContent = city;
    listItem.addEventListener("click", () => {
        getWeatherData(city);
    });

    searchHistory.appendChild(listItem);
}
