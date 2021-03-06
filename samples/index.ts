import path from 'path';
import { Application } from '../src';
import HelloWorldController from './HelloWorldController';
import UserController from './UserController';

// create a new Application
const app = new Application({
  propertiesPath: path.join(__dirname, './app.config.json'),
  controllers: [UserController, HelloWorldController]
});

// launch the application
app.initialize().start();

export default app;
