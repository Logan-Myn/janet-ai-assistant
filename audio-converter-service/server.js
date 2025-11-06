const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const cors = require('cors');
const { Readable, PassThrough } = require('stream');

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration - restrict to your Janet domain in production
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  methods: ['POST'],
}));

app.use(express.json());

// Configure multer for in-memory file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 16 * 1024 * 1024, // 16MB max (WhatsApp limit)
  },
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'audio-converter' });
});

/**
 * Convert OGG/Opus to WAV endpoint
 * Accepts: multipart/form-data with 'audio' field
 * Returns: WAV audio file
 */
app.post('/convert', upload.single('audio'), async (req, res) => {
  const startTime = Date.now();

  if (!req.file) {
    return res.status(400).json({ error: 'No audio file provided' });
  }

  console.log(`[${new Date().toISOString()}] Converting audio: ${req.file.size} bytes, mimetype: ${req.file.mimetype}`);

  try {
    const audioBuffer = req.file.buffer;
    const bufferStream = new Readable();
    bufferStream.push(audioBuffer);
    bufferStream.push(null);

    const outputChunks = [];
    const outputStream = new PassThrough();

    outputStream.on('data', (chunk) => {
      outputChunks.push(chunk);
    });

    outputStream.on('end', () => {
      const wavBuffer = Buffer.concat(outputChunks);
      const duration = Date.now() - startTime;

      console.log(`[${new Date().toISOString()}] Conversion complete: ${wavBuffer.length} bytes, took ${duration}ms`);

      // Send WAV file back
      res.set({
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length,
        'X-Conversion-Time-Ms': duration,
      });
      res.send(wavBuffer);
    });

    ffmpeg(bufferStream)
      .inputFormat('ogg')
      .audioCodec('pcm_s16le') // 16-bit PCM
      .audioChannels(1) // Mono
      .audioFrequency(16000) // 16kHz sample rate
      .format('wav')
      .on('error', (err) => {
        console.error(`[${new Date().toISOString()}] FFmpeg error:`, err);

        if (!res.headersSent) {
          res.status(500).json({
            error: 'Audio conversion failed',
            message: err.message
          });
        }
      })
      .on('start', (commandLine) => {
        console.log(`[${new Date().toISOString()}] FFmpeg command: ${commandLine}`);
      })
      .pipe(outputStream, { end: true });

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Conversion error:`, error);

    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File too large',
        message: 'Audio file must be less than 16MB'
      });
    }
  }

  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Audio Converter Service running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Convert endpoint: http://localhost:${PORT}/convert`);
});
