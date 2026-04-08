import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

console.log("🔥 APP ARRANCANDO");

// =========================
// 🔥 INICIALIZACIÓN SEGURA
// =========================
let app, db, userPortfolioRef;

try {
    app = initializeApp(firebaseConfig);
    db = getDatabase(app);
    userPortfolioRef = ref(db, 'portfolio/config');
    console.log("✅ Firebase OK");
} catch (e) {
    console.log("⚠️ Firebase error:", e);
}

// =========================
// 💼 PORTAFOLIO
// =========================
let portafolio = [
{ ticker: 'ECOPETROL', nombre: 'Ecopetrol', cantidad: 1000, precio: 2350, color: '#39ff14' },
{ ticker: 'AAPL', nombre: 'Apple Inc.', cantidad: 10, precio: 720000, color: '#00f2ff' },
{ ticker: 'GLD', nombre: 'ETF Oro', cantidad: 5, precio: 950000, color: '#ffbd00' },
{ ticker: 'BTC', nombre: 'Bitcoin', cantidad: 0.02, precio: 270000000, color: '#f7931a' }
];

let myChart;
let historyChart;
let historyData = [];

// =========================
// 🚀 INICIO CONTROLADO
// =========================
window.onload = () => {

    console.log("📊 DOM listo");

    if (typeof Chart === "undefined") {
        console.log("❌ Chart NO cargó");
        return;
    }

    console.log("✅ Chart OK");

    generarInputs();
    actualizarInterfaz(true);

    // iniciar precios
    setInterval(updateLivePrices, 3000);

    // Firebase (opcional)
    if (userPortfolioRef) {
        onValue(userPortfolioRef, (snapshot) => {
            const data = snapshot.val();
            if (data) {
                portafolio.forEach(a => {
                    if(data[a.ticker] !== undefined) {
                        a.cantidad = data[a.ticker];
                    }
                });
            }
            actualizarInterfaz(true);
        });
    }
};

// =========================
// 🔄 PRECIOS
// =========================
function updateLivePrices() {
    portafolio.forEach(asset => {
        const fluctuation = 1 + (Math.random() * 0.02 - 0.01);
        asset.precio = Math.round(asset.precio * fluctuation);
    });

    actualizarInterfaz(false);
}

// =========================
// 🎛 INPUTS
// =========================
function generarInputs() {
    const contenedor = document.getElementById('controls');
    if(!contenedor) return;

    contenedor.innerHTML = '';

    portafolio.forEach((a, i) => {
        contenedor.innerHTML += `
        <div class="input-group">
            <label>${a.nombre} (${a.ticker})</label>
            <input type="number" id="input-${i}" value="${a.cantidad}">
        </div>`;
    });
}

// =========================
// ☁️ GUARDAR
// =========================
window.actualizarTodo = function() {
    if (!userPortfolioRef) return;

    let data = {};

    portafolio.forEach((a, i) => {
        const val = parseFloat(document.getElementById(`input-${i}`).value) || 0;
        a.cantidad = val;
        data[a.ticker] = val;
    });

    set(userPortfolioRef, data);
};

// =========================
// 📊 INTERFAZ
// =========================
function actualizarInterfaz(updateHistory = false) {

    let total = 0;
    const labels = [];
    const values = [];
    const colors = [];

    portafolio.forEach(a => {
        const val = a.precio * a.cantidad;
        total += val;
        labels.push(a.ticker);
        values.push(val);
        colors.push(a.color);
    });

    document.getElementById("total-value").innerText =
        `$${Math.round(total).toLocaleString()} COP`;

    if (updateHistory) {
        historyData.push(total);
        if (historyData.length > 7) historyData.shift();
    }

    renderCharts(labels, values, colors, total);
    analizarRiesgo(total);
}

// =========================
// 📈 GRÁFICAS
// =========================
function renderCharts(labels, data, colors, total) {

    const ctx = document.getElementById("assetChart");

    if (ctx) {
        if (myChart) myChart.destroy();

        myChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                labels,
                datasets: [{
                    data,
                    backgroundColor: colors
                }]
            }
        });
    }

    const ctx2 = document.getElementById("historyChart");

    if (ctx2) {
        if (historyChart) historyChart.destroy();

        historyChart = new Chart(ctx2, {
            type: "line",
            data: {
                labels: historyData.map((_, i) => i + 1),
                datasets: [{
                    data: historyData,
                    borderColor: "#00f2ff",
                    fill: true
                }]
            }
        });
    }
}

// =========================
// 🧠 RIESGO
// =========================
function analizarRiesgo(total) {

    const actions = document.getElementById("rebalance-actions");
    actions.innerHTML = "";

    portafolio.forEach(a => {
        const peso = (a.precio * a.cantidad) / total;

        if (peso > 0.4) {
            actions.innerHTML += `<li style="color:red;">⚠️ ${a.ticker} alto</li>`;
        }
    });

    if (!actions.innerHTML) {
        actions.innerHTML = "<li>✅ Riesgo balanceado</li>";
    }
}
