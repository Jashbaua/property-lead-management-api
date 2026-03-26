import 'dotenv/config'; 
import express, { Request, Response } from 'express';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req: Request, res: Response) => {
  res.send('Hello world');
});

app.get('/error', (req: Request, res: Response) => {
  throw new Error('test');
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});