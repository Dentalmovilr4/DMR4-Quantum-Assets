import { firebaseConfig } from './config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getDatabase, ref, set, onValue 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==========================
// 👤 USUARIO SIMPLE (ID)
// ==========================
let userId = localStorage.getItem("dmr4_user");

if (!userId) {
    userId = "user_" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem("dmr4_user", userId);
}

const userRef = ref(db, `users/${userId}/portfolio`);

// ==========================
// 💼 PORTAFOLIO BASE
// ==========================
let portafolio = [
    { ticker: 'BTC', tipo: 'derivado', riesgo: 'alto', cantidad: 0.02, precio: 0 },
    { ticker: 'ETH', tipo: 'derivado', riesgo: 'alto', cantidad: 0.5, precio: 0 },
    { ticker: 'USDT', tipo: 'renta_fija', riesgo: 'bajo', cantidad: 1000, precio: 1 },
];

// ==========================
// 📡 PRECIOS BINANCE
// ==========================
async function getPrices() {
    const res = await fetch("https://api.binance.com/api/v3/ticker/price");
    const data = await res.json();

    let prices = {};
    data.forEach(p => {
        prices[p.symbol] = parseFloat(p.price);
    });

    return prices;
}

// ==========================
// 🔄 ACTUALIZAR PRECIOS
// ==========================
async function updateLivePrices() {
    try {
        const prices = await getPrices();

        portafolio.forEach(a => {
            if (a.ticker === 'BTC') a.precio = prices['BTCUSDT'] * 4000;
            if (a.ticker === 'ETH') a.precio = prices['ETHUSDT'] * 4000;
            if (a.ticker === 'USDT') a.precio = 4000;
        });

        actualizarInterfaz();

    } catch (e) {
        console.log("Error precios:", e);
    }
}

setInterval(updateLivePrices, 5000);

// ==========================
// 🧠 INPUTS
// ==========================
function generarInputs() {
    const contenedor = document.getElementById('controls');
    contenedor.innerHTML = '';

    portafolio.forEach((a, i) => {
        contenedor.innerHTML += `
        <div class="input-group">
            <label>${a.ticker} (${a.tipo})</label>
            <input type="number" id="input-${i}" value="${a.cantidad}">
        </div>`;
    });
}

// ==========================
// ☁️ GUARDAR
// ==========================
window.actualizarTodo = function() {
    let data = {};

    portafolio.forEach((a, i) => {
        const val = parseFloat(document.getElementById(`input-${i}`).value) || 0;
        a.cantidad = val;
        data[a.ticker] = val;
    });

    set(userRef, data);
};

// ==========================
// 💰 CALCULO
// ==========================
function actualizarInterfaz() {

    let total = 0;

    portafolio.forEach(a => {
        a.valor = a.precio * a.cantidad;
        total += a.valor;
    });

    document.getElementById("total-value").innerText =
        `$${Math.round(total).toLocaleString()} COP`;

    analizarRiesgo(total);
}

// ==========================
// 🧠 MOTOR PRO
// ==========================
function analizarRiesgo(total) {

    const actions = document.getElementById("rebalance-actions");
    actions.innerHTML = '';

    let riesgoTotal = 0;

    portafolio.forEach(a => {

        let peso = a.valor / total;

        let r = (a.riesgo === 'alto') ? 3 :
                (a.riesgo === 'medio') ? 2 : 1;

        riesgoTotal += peso * r;

        if (peso > 0.5) {
            actions.innerHTML += `<li style="color:red;">⚠️ Sobreexposición ${a.ticker}</li>`;
        }
    });

    // 🎯 REBALANCEO
    portafolio.forEach(a => {
        let target = 1 / portafolio.length;
        let actual = a.valor / total;

        let diff = target - actual;
        let monto = diff * total;

        if (Math.abs(monto) > total * 0.05) {
            if (monto > 0) {
                actions.innerHTML += `<li style="color:green;">🟢 Comprar ${a.ticker} $${Math.round(monto)}</li>`;
            } else {
                actions.innerHTML += `<li style="color:red;">🔴 Vender ${a.ticker} $${Math.round(Math.abs(monto))}</li>`;
            }
        }
    });

    let nivel = riesgoTotal < 1.5 ? "🟢 BAJO" :
                riesgoTotal < 2.3 ? "🟡 MEDIO" :
                "🔴 ALTO";

    actions.innerHTML += `<li>🧠 Riesgo: ${nivel}</li>`;
}

// ==========================
// 🔄 CARGA USUARIO
// ==========================
onValue(userRef, (snap) => {
    const data = snap.val();

    if (data) {
        portafolio.forEach(a => {
            if (data[a.ticker]) {
                a.cantidad = data[a.ticker];
            }
        });
    }

    generarInputs();
    actualizarInterfaz();

}, { onlyOnce: true });
