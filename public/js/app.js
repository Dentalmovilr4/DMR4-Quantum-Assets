import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const userPortfolioRef = ref(db, 'portfolio/config');

let portafolio = [
{ ticker: 'ECOPETROL', nombre: 'Ecopetrol', cantidad: 1000, precio: 2350, color: '#39ff14', icon: 'fa-oil-well' },
{ ticker: 'AAPL', nombre: 'Apple Inc.', cantidad: 10, precio: 720000, color: '#00f2ff', icon: 'fa-apple' },
{ ticker: 'GLD', nombre: 'ETF Oro', cantidad: 5, precio: 950000, color: '#ffbd00', icon: 'fa-coins' },
{ ticker: 'BTC', nombre: 'Bitcoin', cantidad: 0.02, precio: 270000000, color: '#f7931a', icon: 'fa-bitcoin' }
];

let myChart;
let historyChart;
let historyData = [19000000, 19200000, 18900000, 19500000, 19700000];

// =========================
// 🔄 PRECIOS SIMULADOS
// =========================
function updateLivePrices() {
portafolio.forEach(asset => {
const oldPrice = asset.precio;
const fluctuation = 1 + (Math.random() * 0.022 - 0.01);
asset.precio = Math.round(oldPrice * fluctuation);

if (asset.ticker === 'BTC' && asset.precio > 300000000) asset.precio *= 0.98;
if (asset.ticker === 'AAPL' && asset.precio > 800000000) asset.precio *= 0.99;
});

actualizarInterfaz(false);
}

setInterval(updateLivePrices, 3000);

// =========================
// 🎛 INPUTS
// =========================
function generarInputs() {
const contenedor = document.getElementById('controls');
if(!contenedor) return;

contenedor.innerHTML = '';

portafolio.forEach((a, index) => {
contenedor.innerHTML += `
<div class="input-group">
<label>
<span>${a.nombre}</span>
<span class="ticker-label">${a.ticker}</span>
</label>
<input type="number" id="input-${index}" value="${a.cantidad}" step="any">
</div>`;
});
}

// =========================
// ☁️ GUARDAR FIREBASE
// =========================
window.actualizarTodo = function() {
let saveObj = {};

portafolio.forEach((a, index) => {
const input = document.getElementById(`input-${index}`);
if(input) {
const val = parseFloat(input.value) || 0;
a.cantidad = val;
saveObj[a.ticker] = val;
}
});

set(userPortfolioRef, saveObj).then(() => {
console.log("Cantidades sincronizadas.");
actualizarInterfaz(true);
});
}

// =========================
// 📊 INTERFAZ
// =========================
function actualizarInterfaz(updateHistory = false) {

let valorTotal = 0;
const etiquetas = [];
const montos = [];
const colores = [];

portafolio.forEach(a => {
const subtotal = a.precio * a.cantidad;
valorTotal += subtotal;
etiquetas.push(a.ticker);
montos.push(subtotal);
colores.push(a.color);
});

const totalTxt = document.getElementById('total-value');
if(totalTxt) {
const oldTotal = parseFloat(totalTxt.innerText.replace(/[^0-9.]/g, '')) || 0;
totalTxt.innerText = `$${valorTotal.toLocaleString()} COP`;
totalTxt.className = valorTotal >= oldTotal ? 'neon-text price-up' : 'neon-text price-down';
}

const eco = portafolio.find(p => p.ticker === 'ECOPETROL');
const divAnual = eco.cantidad * 312;

const divTxt = document.getElementById('dividend-annual');
const yieldTxt = document.getElementById('dividend-yield');

if(divTxt) divTxt.innerText = `$${divAnual.toLocaleString()} COP`;
if(yieldTxt) yieldTxt.innerText = `${((312/eco.precio)*100).toFixed(1)}%`;

if (updateHistory) {
historyData.push(valorTotal);
if (historyData.length > 7) historyData.shift();
}

renderCharts(etiquetas, montos, colores, valorTotal);
analizarRiesgo(portafolio, valorTotal);
}

// =========================
// 📈 GRÁFICAS
// =========================
function renderCharts(labels, data, colors, total) {

const ctx = document.getElementById('assetChart');

if (ctx) {
if (myChart) myChart.destroy();

myChart = new Chart(ctx, {
type: 'doughnut',
data: {
labels: labels,
datasets: [{
data: data,
backgroundColor: colors
}]
},
options: {
plugins: {
tooltip: {
callbacks: {
label: (item) => `${item.label}: $${item.raw.toLocaleString()} COP (${((item.raw/total)*100).toFixed(1)}%)`
}
}
}
}
});
}

// HISTÓRICO
const ctxH = document.getElementById('historyChart');

if (ctxH) {
if (historyChart) historyChart.destroy();

historyChart = new Chart(ctxH, {
type: 'line',
data: {
labels: ['L','M','M','J','V','S','Hoy'],
datasets: [{
data: historyData,
borderColor: '#00f2ff',
fill: true
}]
}
});
}
}

// =========================
// 🧠 RIESGO
// =========================
function analizarRiesgo(cartera, total) {
const actions = document.getElementById('rebalance-actions');
actions.innerHTML = '';

cartera.forEach(a => {
const peso = (a.precio * a.cantidad / total) * 100;

if (peso > 40) {
actions.innerHTML += `<li style="color:#ff4444;">⚠️ ${a.ticker} alto (${peso.toFixed(1)}%)</li>`;
}
});

if(actions.innerHTML === '') {
actions.innerHTML = '<li>✅ Riesgo OK</li>';
}
}

// =========================
// 🔄 FIREBASE LOAD
// =========================
onValue(userPortfolioRef, (snapshot) => {

const data = snapshot.val();

if (data) {
portafolio.forEach(a => {
if(data[a.ticker] !== undefined) {
a.cantidad = data[a.ticker];
}
});
}

generarInputs();

historyData.push(portafolio.reduce((sum, a) => sum + (a.precio * a.cantidad), 0));
if (historyData.length > 7) historyData.shift();

actualizarInterfaz(false);

}, { onlyOnce: true });
