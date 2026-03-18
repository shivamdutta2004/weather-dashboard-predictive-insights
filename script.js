const API_KEY = "58e99ac46683e8680356da6a590417d5";

let chartInstance = null;
let mapInstance = null;
let searchHistory = [];

/* ================= WEATHER SEARCH ================= */

async function getWeather(){

const city = document.getElementById("city").value.trim();

if(!city){
alert("Enter city name");
return;
}

try{

const res = await fetch(
`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
);

const data = await res.json();

if(data.cod !== 200){
alert("City not found");
return;
}

displayWeather(data);
addHistory(city);

getForecast(data.coord.lat,data.coord.lon);
getAQI(data.coord.lat,data.coord.lon);
showMap(data.coord.lat,data.coord.lon);

}catch(err){
console.log(err);
alert("Error fetching weather");
}

}

/* ================= DISPLAY WEATHER ================= */

function displayWeather(data){

const city = data.name;
const temp = data.main.temp;
const feels = data.main.feels_like;
const humidity = data.main.humidity;
const wind = data.wind.speed;
const pressure = data.main.pressure;
const visibility = data.visibility;

const desc = data.weather[0].description;

const sunrise = new Date(data.sys.sunrise*1000).toLocaleTimeString();
const sunset = new Date(data.sys.sunset*1000).toLocaleTimeString();

document.getElementById("weather").innerHTML = `

<h2>${city}</h2>

<h1>${temp.toFixed(1)}°C</h1>

<p>${desc}</p>

<p>🌡 Feels like: ${feels.toFixed(1)}°C</p>
<p>💧 Humidity: ${humidity}%</p>
<p>🌬 Wind: ${wind} m/s</p>
<p>👁 Visibility: ${(visibility/1000).toFixed(1)} km</p>
<p>🌡 Pressure: ${pressure} hPa</p>
<p>🌅 Sunrise: ${sunrise}</p>
<p>🌇 Sunset: ${sunset}</p>

`;

createChart(temp);
generateInsights(temp, humidity, wind);

}

/* ================= FORECAST ================= */

async function getForecast(lat,lon){

try{

const res = await fetch(
`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
);

const data = await res.json();

const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));

let html = "";

daily.slice(0,5).forEach(day=>{

const date = new Date(day.dt_txt);
const dayName = date.toLocaleDateString("en-US",{weekday:"short"});

const temp = day.main.temp;
const weatherMain = day.weather[0].main;

let icon = "☀️";

if(weatherMain.includes("Cloud")) icon="☁️";
if(weatherMain.includes("Rain")) icon="🌧";
if(weatherMain.includes("Snow")) icon="❄️";
if(weatherMain.includes("Thunder")) icon="⛈";

html += `

<div class="forecast-card">

<p>${dayName}</p>

<div style="font-size:28px">${icon}</div>

<p>${temp.toFixed(1)}°C</p>

</div>

`;

});

document.getElementById("forecast").innerHTML = html;

/* ===== PREDICTIVE PART ADDED ===== */

let temps = daily.slice(0,5).map(day => day.main.temp);

// Temperature Prediction
let predictedTemp = predictTemperature(temps);

// Rain Prediction
let rainMsg = predictRain(daily);

// Append to insights
document.getElementById("insights").innerHTML += `
<p>📊 Predicted Avg Temp: ${predictedTemp}°C</p>
<p>🌧 ${rainMsg}</p>
`;

}catch(err){
console.log(err);
}

}

/* ================= TEMPERATURE CHART ================= */

function createChart(temp){

const ctx = document.getElementById("tempChart");

if(chartInstance) chartInstance.destroy();

const dark = document.body.classList.contains("dark");

chartInstance = new Chart(ctx,{

type:"line",

data:{
labels:["Mon","Tue","Wed","Thu","Fri"],
datasets:[{
label:"Temperature °C",
data:[temp-2,temp-1,temp,temp-1,temp+1],
borderColor:"#0077ff",
backgroundColor:"rgba(0,119,255,0.2)",
tension:0.4
}]
},

options:{
plugins:{
legend:{
labels:{color:dark?"#fff":"#000"}
}
},
scales:{
x:{
ticks:{color:dark?"#fff":"#000"},
grid:{color:dark?"#555":"#ccc"}
},
y:{
ticks:{color:dark?"#fff":"#000"},
grid:{color:dark?"#555":"#ccc"}
}
}
}

});

}

/* ================= GEO LOCATION ================= */

function getLocation(){

navigator.geolocation.getCurrentPosition(async pos=>{

const lat = pos.coords.latitude;
const lon = pos.coords.longitude;

const res = await fetch(
`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
);

const data = await res.json();

displayWeather(data);

getForecast(lat,lon);
getAQI(lat,lon);
showMap(lat,lon);

});

}

/* ================= WEATHER MAP ================= */

function showMap(lat,lon){

if(mapInstance) mapInstance.remove();

mapInstance = L.map("map").setView([lat,lon],10);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png")
.addTo(mapInstance);

L.marker([lat,lon]).addTo(mapInstance);

}

/* ================= AIR QUALITY ================= */

async function getAQI(lat,lon){

try{

const res = await fetch(
`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${API_KEY}`
);

const data = await res.json();

const aqi = data.list[0].main.aqi;
const pm25 = data.list[0].components.pm2_5;
const pm10 = data.list[0].components.pm10;
const co = data.list[0].components.co;

const levels=["Good","Fair","Moderate","Poor","Very Poor"];

document.getElementById("aqi").innerHTML=`

<p><b>AQI Level:</b> ${levels[aqi-1]}</p>
<p>PM2.5: ${pm25}</p>
<p>PM10: ${pm10}</p>
<p>CO: ${co}</p>

`;

}catch(err){
console.log(err);
}

}

/* ================= WEATHER INSIGHTS ================= */

function generateInsights(temp, humidity, wind){

let insights=[];

if(temp>32){
insights.push("🔥 It's hot, stay hydrated");
}
else if(temp<18){
insights.push("❄️ It's cold, wear warm clothes");
}
else{
insights.push("🌤 Weather is comfortable");
}

if(humidity>70){
insights.push("💧 High humidity, may feel sweaty");
}
else{
insights.push("💧 Humidity is normal");
}

if(wind>5){
insights.push("🌬 Strong winds outside");
}
else{
insights.push("🍃 Calm wind conditions");
}

if(temp>30 && humidity>70){
insights.push("⚠️ Avoid going out in afternoon");
}
else{
insights.push("✅ Good time for outdoor activity");
}

document.getElementById("insights").innerHTML =
insights.map(i=>`<p>${i}</p>`).join("");

}

/* ================= PREDICTION FUNCTIONS ================= */

function predictTemperature(temps){
let sum = 0;
temps.forEach(t => sum += t);
return (sum / temps.length).toFixed(1);
}

function predictRain(daily){

let rainDays = daily.slice(0,5).filter(day =>
day.weather[0].main.toLowerCase().includes("rain")
).length;

if(rainDays >= 3){
return "High chance of rain in coming days";
}
else if(rainDays > 0){
return "Possible rain in upcoming days";
}
else{
return "Low chance of rain";
}

}

/* ================= SEARCH HISTORY ================= */

function addHistory(city){

if(!searchHistory.includes(city))
searchHistory.push(city);

let html="Recent Searches: ";

searchHistory.forEach(c=>{
html+=`<span class="history-item" onclick="searchHistoryCity('${c}')">${c}</span>`;
});

document.getElementById("history").innerHTML=html;

}

function searchHistoryCity(city){

document.getElementById("city").value=city;
getWeather();

}

/* ================= DARK MODE ================= */

function toggleTheme(){

document.body.classList.toggle("dark");

}