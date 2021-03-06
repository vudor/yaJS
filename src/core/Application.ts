import { Server } from 'http';
import Koa from 'koa';
import ApplicationCache from '../data/ApplicationCache';
import { ApplicationConfig, Newable, RestControllerConfig } from '../types';
import { getControllerMetadata } from '../Utils';
import AppRouter from './AppRouter';
import { Properties } from './Properties';

/**
 * Entry Point of the Haru-Application.
 * This Class is Responsible for creating and starting the Application
 * with multiple Endpoints using Koa as Web-Framework.
 *
 * @example
 * // create and configure the Application
 * const app = new Application({
 *   propertiesPath = "./app.config.json",
 *   controllers = [ExampleController],
 *  })
 *
 *  // initialize and start your App
 *  app.initialize().start();
 *
 * @class Application
 */
export default class Application {
  /**
   * Instance of the Koa Object.
   *
   * @private
   * @type {Koa}
   * @memberof Application
   */
  private app: Koa;

  /**
   * Instance of the KoaRouter Object.
   *
   * @private
   * @type {KoaRouter}
   * @memberof Application
   */
  private router: AppRouter;

  /**
   * List of Controllers to be registered within the Application.
   *
   * @private
   * @type {Newable[]}
   * @memberof Application
   */
  private controllers: Newable[];

  /**
   * The Properties used by the Application
   *
   * @private
   * @type {Properties}
   * @memberof Application
   */
  private properties: Properties;

  /**
   * Logger to be used by the Application.
   *
   * @private
   * @type {Console}
   * @memberof Application
   */
  private logger: Console;

  /**
   * Reference to the Server Object created by Koa once the Application is up and running.
   *
   * @private
   * @type {Server}
   * @memberof Application
   */
  private server: Server | undefined;

  /**
   * Creates an instance of Application.
   * @param {ApplicationConfig} {
   *     propertiesPath = "/haru.config.json",
   *     controllers = [],
   *     defaultPort = 8080,
   *   } configuration used to set up the Application
   * @memberof Application
   */
  constructor({
    propertiesPath = '/haru.config.json',
    controllers = [],
    logger = console
  }: ApplicationConfig) {
    this.app = new Koa();
    this.router = new AppRouter();
    this.properties = new Properties(propertiesPath, logger);

    this.controllers = controllers;
    this.logger = logger;
  }

  /**
   * Initializes the service by setting up required dependencies
   *
   * @return {Application} the initialized application
   * @memberof KoaService
   */
  public initialize(): Application {
    this.controllers.forEach((controllerClass) => {
      // instantiate new Controller
      const meta: RestControllerConfig = getControllerMetadata(
        controllerClass.prototype
      );

      const controllerInstance = new controllerClass();
      this.router.configureEndpoints(
        meta.routes,
        controllerInstance,
        meta.basePath
      );

      ApplicationCache.set(controllerClass.prototype.name, controllerInstance);
    });

    return this;
  }

  /**
   * Starts the Application.
   *
   * @param {number} [port=8080] the port on which the Application will be started.
   * @return {Promise<void>}
   * @memberof Application
   */
  public async start(port = 8080): Promise<void> {
    this.app.use(this.router.routes());
    this.app.use(this.router.allowedMethods());

    const usedPort = this.getPortFromProperties() ?? port;
    this.server = this.app.listen(usedPort);
    this.logger.info(
      `Haru App started @ http://localhost:${usedPort} \n${this.getAvailableRoutes()}`
    );
  }

  /**
   * Helper function to return the Applications available and registered routes in human readable format.
   * TODO: improve formatting of the available routes i.e. alignment and readability
   *
   * @private
   * @return {string} the formatted routing info
   * @memberof Application
   */
  private getAvailableRoutes(): string {
    return this.router.stack
      ? this.router.stack
          .map((route) => `[${route.methods}] \t\t =>  ${route.path}`)
          .join('\n')
      : '';
  }

  /**
   * Terminates the Application.
   *
   * @return {Server} the server object.
   * @memberof Application
   */
  public close(): Server | undefined {
    return this.server?.close();
  }

  /**
   * Helper function for retrieving the Port from the Applications Properties
   *
   * @private
   * @return {number} the port
   * @memberof Application
   */
  private getPortFromProperties(): number | undefined {
    const port = this.properties.get('port');
    return port ? parseInt(port, 10) : undefined;
  }
}
