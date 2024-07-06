const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

// PostgreSQL connection pool
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'document_service',
  password: 'Nikhil@007',
  port: 5432,
});

// Setup Express
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware to parse JSON bodies
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Serve static files from the 'static' directory
app.use('/static', express.static(__dirname + '/static'));

// Serve HTML files
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/static/index.html');
});

app.get('/editor.html', (req, res) => {
  res.sendFile(__dirname + '/static/editor.html');
});

// REST API endpoints
app.post('/documents', async (req, res) => {
  const { title = "Untitled", content = "" } = req.body;
  const id = uuidv4();
  try {
    const query = 'INSERT INTO documents (id, title, content, version) VALUES ($1, $2, $3, $4) RETURNING *';
    const values = [id, title, content, 1];
    const { rows } = await pool.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error creating document:', err);
    res.status(500).json({ error: 'Failed to create document' });
  }
});

app.get('/documents/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = 'SELECT * FROM documents WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching document:', err);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

app.put('/documents/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content } = req.body;
  try {
    const query = 'UPDATE documents SET title = $1, content = $2, version = version + 1 WHERE id = $3 RETURNING *';
    const values = [title, content, id];
    const { rows } = await pool.query(query, values);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error updating document:', err);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

app.get('/documents', async (req, res) => {
  try {
    const query = 'SELECT * FROM documents';
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching documents:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('A user connected');
  socket.on('joinDocument', async ({ documentId, email }) => {
    socket.join(documentId);
    try {
      const query = 'SELECT * FROM documents WHERE id = $1';
      const { rows } = await pool.query(query, [documentId]);
      if (rows.length === 0) {
        return socket.emit('error', { error: 'Document not found' });
      }
      socket.emit('documentContent', { document: rows[0] });
      io.to(documentId).emit('collaboratorJoined', { email });
    } catch (err) {
      console.error('Error joining document:', err);
      socket.emit('error', { error: 'Failed to join document' });
    }
  });

  socket.on('editDocument', async ({ documentId, title, content }) => {
    try {
      const query = 'UPDATE documents SET title = $1, content = $2, version = version + 1 WHERE id = $3 RETURNING *';
      const values = [title, content, documentId];
      const { rows } = await pool.query(query, values);
      if (rows.length === 0) {
        return socket.emit('error', { error: 'Document not found' });
      }
      io.to(documentId).emit('documentUpdated', { document: rows[0] });
    } catch (err) {
      console.error('Error editing document:', err);
      socket.emit('error', { error: 'Failed to edit document' });
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

// Start the server
const PORT = process.env.PORT || 8081;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
