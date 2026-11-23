import './styles.css';
import { initApp } from './app.js';
import { seedDemoProducts } from './seed.js';

seedDemoProducts();
initApp(undefined);
