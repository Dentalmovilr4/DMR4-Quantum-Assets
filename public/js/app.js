import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const userPortfolioRef = ref(db, 'portfolio/config');

// ESTRUCTURA DE ACTIVOS CON PRECIOS BASE
let portafolio = [
    { ticker: 'ECOPETROL', nombre: 'Ecopetrol', cantidad: 1000, precio: 2350, color: '#39ff14', icon: 'fa-oil-well' },
    { ticker: 'AAPL', nombre: 'Apple Inc.', cantidad: 10, precio: 720000, color: '#00f2ff', icon: 'fa-apple' },
    { ticker: 'GLD', nombre: 'ETF Oro', cantidad: 5, precio: 950000, color: '#ffbd00', icon: 'fa-coins' },
    { ticker: 'BTC', nombre: 'Bitcoin', cantidad: 0.02, precio: 270000000, color: '#f7931a', icon: 'fa-bitcoin' }
];

let myChart;
let historyChart;
let historyData = [19000000, 19200000, 18900000, 19500000, 19700000]; // Datos base para el gráfico

// --- MOTOR DE PRECIOS EN VIVO (SIMULADO) ---
// En producción, aquí conectarías con una API real como Binance o Yahoo Finance
function updateLivePrices() {
    portafolio.forEach(asset => {
        const oldPrice = asset.precio;
        // Simular fluctuación entre -1% y +1.2%
        const fluctuation = 1 + (Math.random() * 0.022 - 0.01); 
        asset.precio = Math.round(oldPrice * fluctuation);
        
        // Pequeña corrección para BTC y Apple para que no suban infinitamente en la simulación
        if (asset.ticker === 'BTC' && asset.precio > 300000000) asset.precio *= 0.98;
        if (asset.ticker === 'AAPL' && asset.precio > 800000000) asset.precio *= 0.99;
    });
    
    // Actualizar la interfaz sin guardar en Firebase (solo cambian precios, no cantidades)
    actualizarInterfaz(false); 
}

// Iniciar actualización cada 3 segundos
setInterval(updateLivePrices, 3000);

// --- FUNCIONES DE INTERFAZ ---
function generarInputs() {
    const contenedor = document.getElementById('controls');
    if(!contenedor) return;
    contenedor.innerHTML = '';
    portafolio.forEach((a, index) => {
        contenedor.innerHTML += `
            <div class="input-group">
                <label>
                    <span><i class="fab ${a.icon} muted-icon"></i> ${a.nombre}</span>
                    <span class="ticker-label">${a.ticker}</span>
                </label>
                <input type="number" id="input-${index}" value="${a.cantidad}" step="any">
            </div>`;
    });
}

// Esta función lee los inputs y guarda en Firebase
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

    // Guardar nuevas cantidades en Firebase
    set(userPortfolioRef, saveObj).then(() => {
        console.log("Cantidades sincronizadas.");
        actualizarInterfaz(true); // Forzar actualización de gráficos
    });
}

// Esta función solo renderiza los datos actuales
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

    // Actualizar Valor Total con efecto visual
    const totalTxt = document.getElementById('total-value');
    if(totalTxt) {
        const oldTotal = parseFloat(totalTxt.innerText.replace(/[^0-9.]/g, '')) || 0;
        totalTxt.innerText = `$${valorTotal.toLocaleString()} COP`;
        // Efecto de color según sube o baja el total
        totalTxt.className = valorTotal >= oldTotal ? 'neon-text price-up' : 'neon-text price-down';
    }
    
    // Actualizar Dividendos Ecopetrol
    const eco = portafolio.find(p => p.ticker === 'ECOPETROL');
    const divAnual = eco.cantidad * 312; // Valor dividendo estático por ahora
    const divTxt = document.getElementById('dividend-annual');
    const yieldTxt = document.getElementById('dividend-yield');
    
    if(divTxt) divTxt.innerText = `$${divAnual.toLocaleString()} COP`;
    if(yieldTxt) yieldTxt.innerText = `${((312/eco.precio)*100).toFixed(1)}%`;

    // Actualizar Gráfico Histórico si es necesario
    if (updateHistory) {
        historyData.push(valorTotal);
        if (historyData.length > 7) historyData.shift(); // Mantener solo 7 días
    }

    renderCharts(etiquetas, montos, colores, valorTotal);
    analizarRiesgo(portafolio, valorTotal);
}

function renderCharts(labels, data, colors, total) {
    // Gráfico de Dona
    const ctx = document.getElementById('assetChart');
    if (ctx) {
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx.getContext('2d'), {
            type: 'doughnut',
            data: { labels: labels, datasets: [{ data: data, backgroundColor: colors, borderColor: '#11141f', borderWidth: 3 }] },
            options: { 
                plugins: { 
                    legend: { position: 'bottom', labels: { color: '#c9d1d9', font: { family: "'SF Mono', monospace", size: 10 } } },
                    tooltip: {
                        callbacks: {
                            label: (item) => ` ${item.label}: $${item.raw.toLocaleString()} COP (${((item.raw/total)*100).toFixed(1)}%)`
                        }
                    }
                }, 
                maintainAspectRatio: false,
                cutout: '70%' // Dona más fina
            }
        });
    }

    // Gráfico Histórico
    const ctxH = document.getElementById('historyChart');
    if (ctxH) {
        if (historyChart) historyChart.destroy();
        historyChart = new Chart(ctxH.getContext('2d'), {
            type: 'line',
            data: {
                labels: ['L', 'M', 'M', 'J', 'V', 'S', 'Hoy'],
                datasets: [{ 
                    label: 'Patrimonio COP', 
                    data: historyData, 
                    borderColor: '#00f2ff', 
                    backgroundColor: 'rgba(0, 242, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: '#00f2ff',
                    pointRadius: 3
                }]
            },
            options: { 
                scales: { 
                    y: { display: false }, 
                    x: { ticks: { color: '#8b949e', font: { size: 10 } }, grid: { display: false } } 
                }, 
                plugins: { legend: { display: false } },
                maintainAspectRatio: false 
            }
        });
    }
}

function analizarRiesgo(cartera, total) {
    const actions = document.getElementById('rebalance-actions');
    actions.innerHTML = '';
    cartera.forEach(a => {
        const peso = (a.precio * a.cantidad / total) * 100;
        if (peso > 40) {
            actions.innerHTML += `<li style="color:#ff4444; font-size:0.8rem;">⚠️ ALERTA: Concentración alta en ${a.ticker} (${peso.toFixed(1)}%). Diversificar sugerido.</li>`;
        }
    });
    if(actions.innerHTML === '') actions.innerHTML = '<li style="font-size:0.8rem;">✅ Riesgo de cartera optimizado.</li>';
}

// INICIO SINCRONIZADO CON FIREBASE
onValue(userPortfolioRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        portafolio.forEach(a => { if(data[a.ticker] !== undefined) a.cantidad = data[a.ticker]; });
    }
    generarInputs();
    // Primera renderización con datos actuales e inicialización del histórico
    historyData.push(portafolio.reduce((sum, a) => sum + (a.precio * a.cantidad), 0));
    if (historyData.length > 7) historyData.shift();
    actualizarInterfaz(false);
}, { onlyOnce: true });
