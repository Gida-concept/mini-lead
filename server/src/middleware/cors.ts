import corsMiddleware from 'cors';

const corsOptions: corsMiddleware.CorsOptions = {
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export const cors = corsMiddleware(corsOptions);
