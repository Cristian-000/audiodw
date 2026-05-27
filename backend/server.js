const express = require('express');
const cors = require('cors');
const https = require('https');

const app = express();

// Permitir conexiones desde tu frontend estático
app.use(cors());
app.use(express.json());

// RUTA MAESTRA: Descarga el audio desde el servidor
app.post('/api/generar-mp3', (req, res) => {
    const { texto, idioma } = req.body;
    if (!texto) return res.status(400).json({ error: "Falta el texto." });

    const lang = idioma || 'es';
    const encodedText = encodeURIComponent(texto);
    
    // Usamos el endpoint estable de Google Translate
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&client=tw-ob&tl=${lang}&q=${encodedText}`;

    // Le metemos un User-Agent de una PC real para que Google no sospeche nada
    const opciones = {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        }
    };

    // El servidor va a buscar el archivo
    https.get(url, opciones, (googleRes) => {
        if (googleRes.statusCode !== 200) {
            return res.status(500).json({ error: `Google rechazó la petición con código ${googleRes.statusCode}` });
        }

        // Configuramos las cabeceras para que el navegador del usuario sepa que es un archivo MP3 descargable
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Disposition', `attachment; filename="audio_${Date.now()}.mp3"`);

        // Mandamos el flujo de datos (Stream) directo al cliente a medida que llega
        googleRes.pipe(res);

    }).on('error', (err) => {
        console.error("Error en el puente de audio:", err);
        res.status(500).json({ error: "Error interno al procesar el audio." });
    });
});

// Ruta de diagnóstico para verificar que el servidor esté vivo
app.get('/api/estado', (req, res) => {
    res.json({ mensaje: "¡Conexión exitosa! El Web Service está vivo en Node puro y sin Docker." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor de audio activo en puerto ${PORT}`));