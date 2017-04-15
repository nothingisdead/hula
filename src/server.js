import serveStatic from 'serve-static';
import socket from 'socket.io';
import { createServer } from 'http';
import { parse } from 'url';
import { resolve } from 'path';
import { stat, readFileSync } from 'fs';
import { render } from './render.js';

const defaults = {
	HOST        : 'localhost',
	PORT        : 3000,
	ENVIRONMENT : 'dev',
	WEBROOT     : resolve('./'),
};

/**
 * Represents a combined HTTP/WebSocket server
 */
export class Server {
	/**
	 * Create a Server instance
	 * @param  {Object} settings Environment settings
	 */
	constructor(settings) {
		this.settings = Object.assign({}, defaults, settings || {});
		this.static   = serveStatic(this.settings.WEBROOT);
		this.server   = createServer(this.http.bind(this));
		this.io       = socket(this.server);

		this.io.on('connection', (socket) => {
			// Handle WebSocket requests
			socket.on('request', (...args) => this.stream(socket, ...args));

			// If we're in the 'dev' environment, reload clients on reconnect
			if(this.settings.ENVIRONMENT === 'dev') {
				socket.on('hello', (n) => n && socket.emit('reload'));
			}
		});
	}

	/**
	 * Get the URL of this Server instance
	 * @return {String} The URL
	 */
	get url() {
		return `http://${this.settings.HOST}:${this.settings.PORT}`;
	}

	/**
	 * Handle a request from a WebSocket client
	 * @param  {Object} socket  The socket object from socket.io
	 * @param  {Object} request The request (contains 'id', 'path', and 'query')
	 * @return {Promise}        The response
	 */
	stream(socket, request) {
		const { id, path, query } = request;

		// Create the response object
		const response = this.request(path, query)
			.then((result) => Object.assign({ result }, request))
			.catch((error) => Object.assign({ error }, request));

		// Send the response to the client
		response.then((response) => socket.emit('response', response));

		return response;
	}

	/**
	 * Handle a request from an HTTP client
	 * @param  {Object} request  The request object from the HTTP server
	 * @param  {Object} response The response object from the HTTP server
	 * @return {Promise}         The response
	 */
	http(request, response) {
		// Get the url pathname and query
		const { pathname : path, query } = parse(request.url, true);

		// Create the response object
		const promise = new Promise((resolve, reject) => {
			// Check if a static file exists
			const file = `${this.settings.WEBROOT}/${path}`;

			stat(file, (error) => {
				if(!error) {
					// If it does, serve it
					this.static(request, response);

					// The result is an object with a '_file' property
					const result = { _file : file };

					// Resolve the response promise
					resolve({ path, query, result });
				}
				else {
					// Otherwise, route this request as a method call
					return this.request(path, query)
						.then((result) => {
							if(typeof result === 'object') {
								// JSON response
								response.setHeader('Content-Type', 'application/json');

								result = JSON.stringify(result);
							}
							else {
								// HTML response
								response.setHeader('Content-Type', 'text/html');
							}

							response.end(result);

							// Resolve with a result
							resolve({ path, query, result });
						})
						.catch((error) => {
							console.warn(error);

							response.statusCode = error.code || 500;
							response.end(error.message || error);

							// Resolve with an error
							resolve({ path, query, error });
						});
				}
			});
		});

		return promise;
	}

	/**
	 * Handle a request
	 * @param  {String} path  The path
	 * @param  {Object} query The query
	 * @return {Promise}      A Promise that resolves with a JSON-serializable object
	 */
	request(path, query) {
		// Create a new context
		const context = {
			state      : query,
			components : {},
		};

		// Get the index page
		const file = `${this.settings.WEBROOT}/index.html`;
		const html = readFileSync(file) + '';

		// Render the index page with the component
		return render(path, context, true).then((content) =>  eval(`\`${html}\``));
	}

	/**
	 * Start the server
	 * @return {Promise} A Promise that resolves when the server has been started
	 */
	start() {
		if(this.server.listening) {
			return Promise.resolve(false);
		}

		return new Promise((resolve, reject) => {
			this.server.listen(
				this.settings.PORT,
				(error) => error ? reject(error) : resolve(true)
			);
		});
	}

	/**
	 * Stop the server
	 * @return {Promise} A Promise that resolves when the server has been stopped
	 */
	stop() {
		if(!this.server.listening) {
			return Promise.resolve(false);
		}

		return new Promise((resolve, reject) => {
			this.server.close(
				(error) => error ? reject(error) : resolve(true)
			);
		});
	}
};
