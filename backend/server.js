const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors());
app.use(express.json());

// Control de abuso integrado en memoria (Sin dependencias extras)
const registroIPs = new Map();
const limitadorSeguridad = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const tiempoActual = Date.now();
    
    if (!registroIPs.has(ip)) {
        registroIPs.set(ip, []);
    }
    
    // Ventana de tiempo de 1 minuto
    const peticionesRecientes = registroIPs.get(ip).filter(t => tiempoActual - t < 60000);
    
    if (peticionesRecientes.length >= 20) { // Máximo 20 peticiones por minuto
        return res.status(429).json({ error: "Demasiadas solicitudes. Por favor, espera un minuto." });
    }
    
    peticionesRecientes.push(tiempoActual);
    registroIPs.set(ip, peticionesRecientes);
    next();
};

app.post('/api/generar-mp3', limitadorSeguridad, (req, res) => {
    const { texto, idioma } = req.body;
    if (!texto) {
        return res.status(400).json({ error: "El campo de texto está vacío." });
    }

    const idiomaDestino = idioma || 'es-ES';
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${idiomaDestino}&q=${encodeURIComponent(texto)}`;

    const opciones = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    };

    https.get(url, opciones, (googleRes) => {
        if (googleRes.statusCode !== 200) {
            return res.status(500).json({ error: `Error del proveedor externo: ${googleRes.statusCode}` });
        }
        res.setHeader('Content-Type', 'audio/mpeg');
        googleRes.pipe(res);
    }).on('error', (err) => {
        console.error("Error en puente:", err);
        res.status(500).json({ error: "Fallo interno al procesar transferencia de audio." });
    });
});

app.get('/api/estado', (req, res) => {
    res.json({ mensaje: "Servidor Node puro activo, seguro y optimizado." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Consola de audio backend ejecutándose en el puerto ${PORT}`);
});
