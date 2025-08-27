import express from 'express';
import cors from 'cors';
import { createRoutes } from './routes';
import { MemStorage } from './storage';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize storage
const storage = new MemStorage();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use(createRoutes(storage));

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});