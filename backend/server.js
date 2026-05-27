const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

app.use(cors());
app.use(express.json());

// Control de abuso integrado en memoria para proteger tu instancia en Render
const registroIPs = new Map();
const limitadorSeguridad = (req, res, next) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const tiempoActual = Date.now();
    
    if (!registroIPs.has(ip)) {
        registroIPs.set(ip, []);
    }
    
    const peticionesRecientes = registroIPs.get(ip).filter(t => tiempoActual - t < 60000);
    
    if (peticionesRecientes.length >= 20) { 
        return res.status(429).json({ error: "Demasiadas solicitudes. Por favor, espera un minuto." });
    }
    
    peticionesRecientes.push(tiempoActual);
    registroIPs.set(ip, peticionesRecientes);
    next();
};

// --- MULTI-BLOCK INTELLIGENT TEXT SPLITTER ---

const dividirTextoInteligente = (texto, maxLongitud = 200) => {
    const fragmentos = [];
    let actual = texto.trim();
    
    while (actual.length > 0) {
        if (actual.length <= maxLongitud) {
            fragmentos.push(actual);
            break;
        }
        
        // Extraemos el bloque máximo permitido para analizarlo
        let subcadena = actual.substring(0, maxLongitud);
        let puntoCorte = -1;
        
        // Signos de puntuación ordenados por prioridad de estructura lógica
        const signosPuntuacion = ['.', '?', '!', ';', ','];
        
        // Buscamos el último signo de puntuación dentro del bloque de 200 caracteres
        for (const signo of signosPuntuacion) {
            const indexSigno = subcadena.lastIndexOf(signo);
            if (indexSigno > puntoCorte) {
                puntoCorte = indexSigno;
            }
        }
        
        // OPTIMIZACIÓN: Solo cortamos por puntuación si está en una zona razonable 
        // (último 40% del bloque) para evitar fragmentos excesivamente cortos.
        if (puntoCorte !== -1 && puntoCorte > (maxLongitud * 0.6)) {
            puntoCorte = puntoCorte + 1; // Cortamos justo después del signo para incluirlo
        } else {
            // Si no hay puntuación cerca del final, buscamos el último espacio
            puntoCorte = subcadena.lastIndexOf(' ');
            if (puntoCorte === -1) {
                puntoCorte = maxLongitud; // Salvaguarda para palabras continuas gigantes
            }
        }
        
        fragmentos.push(actual.substring(0, puntoCorte).trim());
        actual = actual.substring(puntoCorte).trim();
    }
    return fragmentos;
};

// Utilidad para espaciar las peticiones y mitigar bloqueos de firewall
const esperar = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const obtenerBufferAudio = (texto, idioma) => {
    return new Promise((resolve, reject) => {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${idioma}&q=${encodeURIComponent(texto)}`;
        const opciones = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
            }
        };

        https.get(url, opciones, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Error HTTP de Google: ${res.statusCode}`));
            }
            const fragmentosDatos = [];
            res.on('data', (chunk) => fragmentosDatos.push(chunk));
            res.on('end', () => resolve(Buffer.concat(fragmentosDatos)));
        }).on('error', reject);
    });
};

// --- ENLACES DE LA API ---

app.post('/api/generar-mp3', limitadorSeguridad, async (req, res) => {
    const { texto, idioma } = req.body;
    if (!texto) {
        return res.status(400).json({ error: "El campo de texto está vacío." });
    }

    const idiomaDestino = idioma || 'es-ES';
    
    // Divide priorizando la puntuación natural lo más cercano a 200 caracteres
    const partesDeTexto = dividirTextoInteligente(texto, 200);
    const buffersAudio = [];

    try {
        for (let i = 0; i < partesDeTexto.length; i++) {
            const buffer = await obtenerBufferAudio(partesDeTexto[i], idiomaDestino);
            buffersAudio.push(buffer);
            
            // Pausa estratégica de 350ms para mantener el tráfico con perfil humano
            if (i < partesDeTexto.length - 1) {
                await esperar(350);
            }
        }

        const audioFinal = Buffer.concat(buffersAudio);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', audioFinal.length);
        res.send(audioFinal);

    } catch (error) {
        console.error("Error en puente de audio distribuido:", error);
        res.status(500).json({ error: "Fallo al procesar y unificar los fragmentos de audio." });
    }
});

app.get('/api/estado', (req, res) => {
    res.json({ mensaje: "Servidor Node activo, con soporte para textos largos estructurados." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Backend de procesamiento ejecutándose en el puerto ${PORT}`);
});


/* 
//FUNCIONA PERFECTO,MLIMITE 200
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
*/
