const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

// Habilitar CORS para permitir solicitudes desde tu sitio estático
app.use(cors());
app.use(express.json());

// Endpoint de Proxy para evadir bloqueos de CORS y errores 404
app.post('/api/generar-mp3', (req, res) => {
    const { texto, idioma } = req.body;
    if (!texto) {
        return res.status(400).json({ error: "Por favor, proporciona un texto válido." });
    }

    const idiomaDestino = idioma || 'es-ES';
    const textoCodificado = encodeURIComponent(texto);
    
    // Endpoint estable de Google Translate
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${idiomaDestino}&q=${textoCodificado}`;

    // Cabecera simulando una solicitud de navegador limpio
    const opciones = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    };

    https.get(url, opciones, (googleRes) => {
        if (googleRes.statusCode !== 200) {
            return res.status(500).json({ error: `El proveedor de audio respondió con código ${googleRes.statusCode}` });
        }

        // Transmitir directamente los datos binarios al frontend
        res.setHeader('Content-Type', 'audio/mpeg');
        googleRes.pipe(res);

    }).on('error', (err) => {
        console.error("Error en el puente de audio del backend:", err);
        res.status(500).json({ error: "Error interno del servidor al procesar el audio." });
    });
});

// Endpoint rápido para verificar el estado y despertar la instancia de Render
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: "¡Conexión exitosa! El Web Service está activo en Node puro." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de audio ejecutándose correctamente en el puerto ${PORT}`);
});
