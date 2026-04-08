// ==========================================
// 🚀 DMR4 QUANTUM - CORE ENGINE
// ==========================================
import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Inicialización de Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const userPortfolioRef = ref(db, 'portfolio/config');

// Estado global del Portafolio
let portafolio = [
    { ticker: 'ECOPETROL', nombre: 'Ecopetrol', cantidad: 1000, precio: 2350, color: '#39ff14', icon: 'fa-oil-well' },
    { ticker: 'AAPL', nombre: 'Apple Inc.', cantidad: 10, precio: 720000, color: '#00f2ff', icon: 'fa-apple' },
    { ticker: 'GLD', nombre: 'ETF Oro', cantidad: 5, precio: 950000, color: '#ffbd00', icon: 'fa-coins' },
    { ticker: 'BTC', nombre: 'Bitcoin', cantidad: 0.02, precio: 270000000, color: '#f7931a', icon: 'fa-bitcoin' }
];

let myChart;
let historyChart;
let historyData = [19000000, 19200000, 18900000, 19500000, 19700000];

// ==========================================
// 🔄 SIMULACIÓN DE MERCADO (LIVE)
// ==========================================
function updateLivePrices() {
    portafolio.forEach(asset => {
        const oldPrice = asset.precio;
        // Simula volatilidad de mercado del +/- 1.2%
        const fluctuation = 1 + (Math.random() * 0.024 - 0.012);
        asset.precio = Math.round(oldPrice * fluctuation);

        // Control de límites para activos volátiles
        if (asset.ticker === 'BTC' && asset.precio > 350000000) asset.precio *= 0.95;
        if (asset.ticker === 'AAPL' && asset.precio > 900000000) asset.precio *= 0.98;
    });

    actualizarInterfaz(false);
}

// Actualizar precios cada 3 segundos
setInterval(updateLivePrices, 3000);

// ==========================================
// 🎛 GENERACIÓN DE INTERFAZ DE USUARIO
// ==========================================
function generarInputs() {
    const contenedor = document.getElementById('controls');
    if (!contenedor) return;

    contenedor.innerHTML = '';

    portafolio.forEach((a, index) => {
        const div = document.createElement('div');
        div.className = 'control-group';
        div.style = "margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between; background: rgba(255,255,255,0.05); padding: 8px; border-radius: 5px;";
        div.innerHTML = `
            <span style="font-size: 0.9rem;"><i class="fa-solid ${a.icon}" style="color: ${a.color}"></i> ${a.ticker}</span>
            <input type="number" step="any" id="input-${index}" value="${a.cantidad}" 
                style="background: #111; color: white; border: 1px solid var(--border-color); width: 80px; text-align: right; padding: 4px; border-radius: 4px;">
        `;
        contenedor.appendChild(div);
    });
}

// ==========================================
// ☁️ SYNC CON FIREBASE (MODO GLOBAL)
// ==========================================
window.actualizarTodo = function() {
    let saveObj = {};

    portafolio.forEach((a, index) => {
        const input = document.getElementById(`input-${index}`);
        if (input) {
            const val = parseFloat(input.value) || 0;
            a.cantidad = val;
            saveObj[a.ticker] = val;
        }
    });

    set(userPortfolioRef, saveObj)
        .then(() => {
            console.log("✅ Datos sincronizados en Firebase");
            actualizarInterfaz(true);
            
            // Efecto visual de guardado
            const btn = document.getElementById('btn-recalc');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> Sincronizado';
            setTimeout(() => {
                btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Sincronizar Cantidades';
            }, 2000);
        })
        .catch(err => console.error("Error al guardar:", err));
};

// ==========================================
// 📊 MOTOR DE RENDERIZADO E IA DE RIESGO
// ==========================================
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

    // Actualizar Panel de Valor Total
    const totalTxt = document.getElementById('total-value');
    if (totalTxt) {
        totalTxt.innerText = `$${valorTotal.toLocaleString('es-CO')} COP`;
    }

    // Análisis Ecopetrol (Dividendos)
    const eco = portafolio.find(p => p.ticker === 'ECOPETROL');
    if (eco) {
        const divAnual = eco.cantidad * 312; // Dividendo estimado por acción
        const divTxt = document.getElementById('dividend-annual');
        const yieldTxt = document.getElementById('dividend-yield');

        if (divTxt) divTxt.innerText = `$${divAnual.toLocaleString('es-CO')} COP`;
        if (yieldTxt) yieldTxt.innerText = `${((312 / eco.precio) * 100).toFixed(2)}%`;
    }

    if (updateHistory) {
        historyData.push(valorTotal);
        if (historyData.length > 7) historyData.shift();
    }

    renderCharts(etiquetas, montos, colores, valorTotal);
    analizarRiesgo(portafolio, valorTotal);
}

function renderCharts(labels, data, colors, total) {
    // Gráfico de Dona (DMR4 Assets)
    const ctx = document.getElementById('assetChart');
    if (ctx) {
        if (myChart) myChart.destroy();
        myChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{ data: data, backgroundColor: colors, borderWidth: 0 }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (item) => `${item.label}: $${item.raw.toLocaleString()} COP (${((item.raw / total) * 100).toFixed(1)}%)`
                        }
                    }
                }
            }
        });
    }

    // Gráfico Histórico
    const ctxH = document.getElementById('historyChart');
    if (ctxH) {
        if (historyChart) historyChart.destroy();
        historyChart = new Chart(ctxH, {
            type: 'line',
            data: {
                labels: ['L', 'M', 'M', 'J', 'V', 'S', 'Hoy'],
                datasets: [{
                    label: 'Patrimonio',
                    data: historyData,
                    borderColor: '#00f2ff',
                    backgroundColor: 'rgba(0, 242, 255, 0.1)',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: { y: { display: false }, x: { grid: { display: false } } }
            }
        });
    }
}

function analizarRiesgo(cartera, total) {
    const actions = document.getElementById('rebalance-actions');
    if (!actions) return;
    actions.innerHTML = '';

    cartera.forEach(a => {
        const peso = (a.precio * a.cantidad / total) * 100;
        if (peso > 35) {
            actions.innerHTML += `<li style="color:#ff4444; margin-bottom: 5px;">⚠️ <strong>${a.ticker}</strong> excedido (${peso.toFixed(1)}%). Recomendado reducir.</li>`;
        }
    });

    if (actions.innerHTML === '') {
        actions.innerHTML = '<li style="color:var(--neon-green);">✅ Portafolio balanceado. Sin alertas de IA.</li>';
    }
}

// ==========================================
// 🔄 CARGA INICIAL DESDE FIREBASE
// ==========================================
onValue(userPortfolioRef, (snapshot) => {
    const data = snapshot.val();
    if (data) {
        portafolio.forEach(a => {
            if (data[a.ticker] !== undefined) {
                a.cantidad = data[a.ticker];
            }
        });
    }

    generarInputs();
    actualizarInterfaz(true);
}, { onlyOnce: true });

