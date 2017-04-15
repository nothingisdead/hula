import io from 'socket.io-client';
import morphdom from 'morphdom';
import { register, render } from './render.js';
import { resolve } from 'path';

const defaults = {
	HOST : 'localhost',
	PORT : 3000,
};

// Request counter
let ctr = 0;

// Request callbacks
const callbacks = {};

/**
 * Represents a WebSocket Client
 */
export class Client {
	/**
	 * Create a Client instance
	 * @param  {HTMLElement} root     The root node for rendering
	 * @param  {Object}      settings Environment settings
	 */
	constructor(root, context, settings) {
		root.dataset.components = true;
		root.client             = this;

		// Register existing components
		register(context);

		this.settings = Object.assign({}, defaults, settings || {});
		this.socket   = io(this.url);
		this.context  = context;
		this.root     = root;

		// Keep track of reconnections
		let connections = 0;

		this.socket.on('connect', () => {
			this.socket.emit('hello', connections++);
		});

		// Handle "reload" messages
		this.socket.on('reload', () => document.location.reload());

		// Handle "response" messages
		this.socket.on('response', ({ id, error, result }) => {
			if(callbacks[id]) {
				const func = error ? callbacks[id].reject : callbacks[id].resolve;
				const data = error || result;

				return func(data);
			}

			// Log unhandled responses
			console.warn(
				`Unhandled response: ${JSON.stringify({ error, result })}`
			);
		});
	}

	/**
	 * Get the URL of this Client instance
	 * @return {String} The URL
	 */
	get url() {
		return `http://${this.settings.HOST}:${this.settings.PORT}`;
	}

	render(route, element) {
		render(route, this.context).then((html) => {
			morphdom(element, html, {
				childrenOnly : true,

				onBeforeElUpdated : (a, b) => {
					if(typeof a.value === 'string' && typeof b.value === 'string') {
						b.value = a.value;
					}
				},
			});

			// Register new components and remove old components
			register(this.context);
		});
	}

	/**
	 * Send a request to the Server
	 * @param  {String} path  The path
	 * @param  {Object} query The query
	 * @return {Promise}      A Promise that resolves with a JSON-serializable object
	 */
	request(path, query) {
		// Default query to {} to be consistent with HTTP
		if(typeof query !== 'object' || query === null) {
			query = {};
		}

		const request = { path, query };

		request.id = ++ctr;

		return new Promise((resolve, reject) => {
			// Store the callbacks
			callbacks[request.id] = { resolve, reject };

			// Send the request
			this.socket.emit('request', request);
		});
	}
};
