// Wait for the document to be ready before executing JavaScript
$(document).ready(function () {
    // API's
    const APIkey = "faa74d00fe1eee5f928f7f5bae35e9ff";
    const geocodingAPI = "https://api.openweathermap.org/geo/1.0/direct?q=";
    const currentWeatherAPI = "https://api.openweathermap.org/data/2.5/weather";
    const fiveDayForecastAPI = "https://api.openweathermap.org/data/2.5/forecast";
  
    // Variables
    const searchButton = document.querySelector("#search-button");
    const searchInputCity = document.querySelector("#search-input-city");
    const searchInputState = document.querySelector("#search-input-state");
    const searchInputCountry = document.querySelector("#search-input-country");
    const cityDropdown = document.querySelector("#city-dropdown");
  
    const currentWeatherCard = document.querySelectorAll(".current-weather-card");
    const weatherCards = document.querySelectorAll(".weather-card");
    const weatherCardGroup = document.querySelector(".card-group");
  
    // Populate the dropdown with city names from local storage on startup
    var cityList = JSON.parse(localStorage.getItem("cityList"));
    populateDropdown(cityList, cityDropdown);
  
    // TODO Add await to the function calls so that the data is retrieved before it is all displayed.
    // Add a loading icon to the page while the data is being retrieved.
  
    // Add event listener to the dropdown list so that when a city is selected, the weather data is displayed
    cityDropdown.addEventListener("click", function (event) {
      // retrieve the name of the city from the selection list item in the dropdown that triggered the event
      let city = event.target.textContent.split(",")[0];
      searchInputCity.value = city;
      // Trigger the searchinputcity form to act like it was clicked
      searchInputCity.focus();
  
      // Find the object in the cityList array that matches the city name
      cityList = JSON.parse(localStorage.getItem("cityList"));
      let cityObject = cityList.find((cityObj) => cityObj.name === city);
  
      // if the country is the US, then use the city and state
      if (cityObject.country === "US") {
        searchInputState.value = cityObject.state;
        searchInputState.focus();
        searchInputState.blur();
        searchInputCountry.value = "";
      }
      // if the country is not the US, then use the city and country
      else {
        searchInputState.value = "";
        searchInputCountry.value = cityObject.country;
        searchInputCountry.focus();
        searchInputCountry.blur();
      }
  
      // Get the weather data for the city
      retrieveWeatherData(city);
    });
  
    // Add event listener to the search button so that when it is clicked, the weather data is displayed
    searchButton.addEventListener("click", function () {
      // Get the geo coordinates for the city
      // Grab content from the search inputs
      let city = searchInputCity.value;
      let state = searchInputState.value;
      let country = searchInputCountry.value;
  
      // Check to see if the city is in the local storage
      if (!city || !isNaN(city)) {
        alert("Please enter a city name");
        return;
      } else if (state) {
        locationForAPI = city + "," + state + ",US";
      } else if (country) {
        locationForAPI = city + "," + country;
      } else {
        locationForAPI = city;
      }
  
      // Get the weather data for the city
      retrieveWeatherData(locationForAPI);
    });
  
    // Add event that if the enter button is clicked, the search button is clicked
    document.addEventListener("keyup", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        searchButton.click();
      }
    });
  
    // Average the Data from the API call. The API returns data every 3 hours.  We want to average the data for each day.
    function averageData(data, dates) {
      let average = [];
      let weatherData = weatherDescription(data);
  
      for (var i = 0; i < 5; i++) {
        let tempSum = 0;
        let humiditySum = 0;
        let windSum = 0;
        let count = 0;
        let index = dates[Object.keys(dates)[i]];
  
        // Show the value of the key in the dates object
        for (var j = index; j < index + 8; j++) {
          if (j > 39) {
            break;
          }
          tempSum += data.list[j].main.temp;
          humiditySum += data.list[j].main.humidity;
          windSum += data.list[j].wind.speed;
          count++;
        }
        average[i] = {
          dates: Object.keys(dates)[i],
          temp: tempSum / count,
          humidity: humiditySum / count,
          wind: windSum / count,
          weather: weatherData[i],
        };
      }
      return average;
    }
  
    // Get the weather description for the day. The API returns data every 3 hours.  We want to find the most common weather description for the day.
    function weatherDescription(data) {
      let weatherDescription = [];
  
      for (var i = 0; i < 5; i++) {
        // Find the weather id's for the day
        let weather = [];
        for (var j = i * 8; j < 8 * (i + 1); j++) {
          weather.push(data.list[j].weather[0].id);
        }
  
        // Count up the number of times each weather id appears
        let weatherIdCount = {};
        weather.forEach(
          (v) => (weatherIdCount[`${v}`] = (weatherIdCount[`${v}`] || 0) + 1)
        );
  
        // Find the most common weather id for the day
        let max = 0;
        let weatherId = 0;
        for (let key in weatherIdCount) {
          if (weatherIdCount[key] > max) {
            max = weatherIdCount[key];
            weatherId = key;
          }
        }
        // Find the object for the most common weather id
        for (var j = i * 8; j < 8 * (i + 1); j++) {
          if (data.list[j].weather[0].id == weatherId) {
            weatherDescription[i] = data.list[j].weather[0];
            break;
          }
        }
      }
      return weatherDescription;
    }
  
    // Look at each date and see if it is in the dates array.  If not, add it.
    // TODO If it is before 3 am local time, then use the current date as the first day in the forecast?
    function gatherDates(data, currentDate) {
      let dates = {};
      for (var i = 0; i < data.list.length; i++) {
        let date = dayjs(data.list[i].dt_txt.split(" ")[0])
          .utc()
          .format("MMM DD, YYYY");
        if (!dates[date]) {
          dates[date] = i;
        }
      }
      // Delete the first date if there are more than 5 dates because that means it is the current date.
      if (Object.keys(dates)[0] == currentDate) {
        delete dates[Object.keys(dates)[0]];
      }
  
      if (Object.keys(dates).length > 5) {
        delete dates[Object.keys(dates)[dates.length - 1]];
      }
  
      // Dates with the index they start at in the API call
      return dates;
    }
  
    // Display the weather data. weatherData is an array of objects. weatherCards is an array of HTML card elements.
    function displayWeatherData(displayData, weatherCards) {
      // Loop through the weather cards and display the data
      for (let i = 0; i < displayData.length; i++) {
        // Universal elements and data for all cards
        let cardTemp = weatherCards[i].querySelector(".card-temp");
        cardTemp.textContent = displayData[i].temp.toFixed(1);
  
        let cardHumidity = weatherCards[i].querySelector(".card-humidity");
        cardHumidity.textContent = displayData[i].humidity.toFixed(0);
  
        let cardWind = weatherCards[i].querySelector(".card-wind");
        cardWind.textContent = displayData[i].wind.toFixed(0);
  
        let cardWeather = weatherCards[i].querySelector(".card-weather");
        cardWeather.textContent = displayData[i].weather.main;
  
        // Universal Elements for all cards
        let cardDate = weatherCards[i].querySelector(".card-date");
        let cardIcon = weatherCards[i].querySelector(".card-icon");
        cardIcon.setAttribute("alt", displayData[i].weather.description);
  
        // Display data that is different for the current weather card and the 5 day forecast cards
        // Current Weather Card
        if (weatherCards[i].classList.contains("current-weather-card")) {
          cardDate.textContent = displayData[0].date + " " + displayData[0].time;
          cardIcon.setAttribute(
            "src",
            "http://openweathermap.org/img/wn/" +
              displayData[i].weather.icon +
              "@2x.png"
          );
  
          let cardCity = weatherCards[i].querySelector(".card-city");
          cardCity.textContent = displayData[0].city;
  
          let cardCountry = weatherCards[i].querySelector(".card-country");
          if (displayData[0].country == "US") {
            cardCountry.textContent = displayData[0].state;
          } else {
            cardCountry.textContent = displayData[0].country;
          }
        }
        // 5 Day Forecast Cards
        else {
          cardDate.textContent = dayjs(displayData[i].dates)
            .utc()
            .format("MMM DD, YYYY");
          // Change the icon to day if it is night (The way the icon is grabbed, it could be day or night)
          displayData[i].weather.icon = displayData[i].weather.icon.replace(
            "n",
            "d"
          );
          cardIcon.setAttribute(
            "src",
            "http://openweathermap.org/img/wn/" +
              displayData[i].weather.icon +
              "@2x.png"
          );
  
          let cardDay = weatherCards[i].querySelector(".card-day");
          cardDay.textContent = dayjs(displayData[i].dates).format("dddd");
        }
      }
    }
  
    // Populate the dropdown menu with the cities
    function populateDropdown(cityList, cityDropdown) {
      cityDropdown.innerHTML = "";
      if (cityList) {
        for (var i = 0; i < cityList.length; i++) {
          let city = cityList[i].name;
          let state = cityList[i].state;
          let country = cityList[i].country;
          if (country == "US") {
            var location = city + ", " + state;
          } else {
            var location = city + ", " + country;
          }
  
          let option = document.createElement("li");
          let suboption = document.createElement("a");
          suboption.setAttribute("class", "dropdown-item");
          suboption.textContent = location;
          option.appendChild(suboption);
          cityDropdown.appendChild(option);
        }
      }
    }
  
    // Get the weather data for the city that was passed in
    async function retrieveWeatherData(locationForAPI) {
      fetch(geocodingAPI + locationForAPI + "&limit=1" + "&appid=" + APIkey).then(
        function (response) {
          if (response.ok && response.status === 200) {
            response.json().then(async function (cityData) {
              if (cityData.length === 0) {
                alert(
                  "City not found. Please carefully read the instructions and try again."
                );
                return;
              }
              // Save the city data to local storage
  
              // Check to see if there is anything in local storage
              let cityList = JSON.parse(localStorage.getItem("cityList"));
  
              if (cityList === null) {
                cityList = [];
                cityList.push(cityData[0]);
                localStorage.setItem("cityList", JSON.stringify(cityList));
              } else {
                // See if the city is already in the list
                let cityExists = false;
                cityList.every(function (city) {
                  if (
                    city.name == cityData[0].name &&
                    city.state == cityData[0].state &&
                    city.country == cityData[0].country
                  ) {
                    cityExists = true;
                    // Since it exists, stop the loop, but first put the city at the top of the list
                    cityList.unshift(cityList.splice(cityList.indexOf(city), 1)[0]);
                    return false;
                  } else {
                    return true;
                  }
                });
  
                // If the city is not in the list, add it
                if (!cityExists) {
                  // Add the city to the top of the list
                  cityList.unshift(cityData[0]);
                  // Cap the number of cities in local storage at 10
                  cityList = cityList.slice(-10);
                  localStorage.setItem("cityList", JSON.stringify(cityList));
                }
              }
  
              //  populate the dropdown with city names from local storage
  
              populateDropdown(cityList, cityDropdown);
  
              // Get current weather data for the city
              await fetch(
                currentWeatherAPI +
                  "?lat=" +
                  cityData[0].lat +
                  "&lon=" +
                  cityData[0].lon +
                  "&units=imperial" +
                  "&appid=" +
                  APIkey
              ).then(function (response) {
                if (response.ok) {
                  response.json().then(async function (currentWeatherRawData) {
                    let currentDate = dayjs
                      .unix(
                        currentWeatherRawData.dt + currentWeatherRawData.timezone
                      )
                      .utc()
                      .format("MMM D, YYYY");
  
                    let currentTime = dayjs
                      .unix(
                        currentWeatherRawData.dt + currentWeatherRawData.timezone
                      )
                      .utc()
                      .format("h:mm a");
  
                    //  try to find local_names.en, if not, use name
                    let locationName;
                    if (!cityData[0].hasOwnProperty("local_names.en")) {
                      locationName = cityData[0].name;
                    } else {
                      locationName = cityData[0].local_names.en;
                    }
  
                    var currentWeather = [
                      {
                        //   date: currentDate,
                        city: locationName,
                        state: cityData[0].state,
                        country: cityData[0].country,
                        date: currentDate,
                        time: currentTime,
                        temp: currentWeatherRawData.main.temp,
                        humidity: currentWeatherRawData.main.humidity,
                        wind: currentWeatherRawData.wind.speed,
                        weather: currentWeatherRawData.weather[0],
                      },
                    ];
                    displayWeatherData(currentWeather, currentWeatherCard);
  
                    // Get 5 day forecast for the city
                    await fetch(
                      fiveDayForecastAPI +
                        "?lat=" +
                        cityData[0].lat +
                        "&lon=" +
                        cityData[0].lon +
                        "&units=imperial" +
                        "&appid=" +
                        APIkey
                    ).then(function (response) {
                      if (response.ok) {
                        response.json().then(function (forecastWeatherRawData) {
                          var dates = gatherDates(
                            forecastWeatherRawData,
                            currentDate
                          );
                          var fiveDayForecast = averageData(
                            forecastWeatherRawData,
                            dates
                          );
                          displayWeatherData(fiveDayForecast, weatherCards);
                        });
                      } else {
                        alert("Error: " + response.statusText);
                      }
                    });
                  });
                } else {
                  alert("Error: " + response.statusText);
                }
              });
            });
          } else {
            alert("Error: " + response.statusText);
          }
        }
      );
    }
  });