import { routes } from 'Routes';

// Unique ID generator
const uid = (components) => {
	let id;

	do {
		id = Math.random().toString(36).substr(2, 6);
	} while(id in components);

	return id;
};

// Template tag that allows returning Promise objects
const interpolate = async (strings, ...vars) => {
	// Make sure each variable is a Promise
	vars = vars.map((result) => {
		if(result instanceof Router) {
			result = result.render(null, true);
		}

		if(!(result instanceof Promise)) {
			result = Promise.resolve(result);
		}

		return result;
	});

	// Router.render returns an object with id and html
	vars = vars.map(async function format(value) {
		// Wait for promises
		if(value instanceof Promise) {
			value = await value;
		}

		// Format and join arrays
		if(value instanceof Array) {
			value = await Promise.all(value.map(format));
			value = value.join('');
		}

		// Format { id, html } objects (child routes)
		if(typeof value === 'object' && value.html) {
			value = value.html;
		}

		return value;
	});

	// Wait for the results of any Promises
	vars = await Promise.all(vars);

	// Interpolate the variables
	return strings.reduce(
		(p, c, i) => `${p}${vars[i - 1]}${c}`
	);
};

// Subroutes of a given route
const subroutes = (context, route) => {
	const tmp_routes = {};

	for(let tmp_route in routes) {
		if(tmp_route !== route && tmp_route.startsWith(route)) {
			// Get the remaining part of the route
			let rel_route = tmp_route.substr(route.length);

			// Add the route to the subroutes
			tmp_routes[rel_route] = Router.get(tmp_route, context);
		}
	}

	return tmp_routes;
};

// For now, component updates just re-render the whole app
const update = (component) => {
	const root   = component.closest('[data-components]');
	const id     = component.dataset.component;
	const client = root.client;
	const route  = client.context.components[id];

	client.render(route, component);
};

// Store static references to Router objects
const routers = {};

/**
 * Represents an instance of a route and a context
 */
export class Router {
	constructor(route, context) {
		const func   = interpolate.bind(null);
		const sub    = subroutes(context, route);
		const app    = Object.assign(func, sub);
		const router = routes[route];

		this.instance = new router(app, context.state);
		this.route    = route;
		this.context  = context;
	}

	/**
	 * Returns whether or not a route exists
	 * @param  {String}  route The route
	 * @return {Boolean}       Whether or not the route exists
	 */
	static exists(route) {
		return !!routes[route];
	}

	/**
	 * Get a static instance of a Router object for a given route and context
	 * @param  {String} route   The route
	 * @param  {Object} context The context
	 * @return {Router}         A static Router instance
	 */
	static get(route, context) {
		if(!routers[route] || routers[route].context !== context) {
			routers[route] = new Router(route, context);
		}

		return routers[route];
	}

	/**
	 * Register a component for the current route
	 * @param {HTMLElement} component The component
	 */
	register(component) {
		const id     = component.dataset.component;
		const parent = component.parentNode;
		const nodes  = [];

		let current = component;
		let end     = false;

		do {
			// Get the next sibling
			current = current.nextElementSibling;

			// Check if this is the last component
			end = end || ((current || {}).dataset || {}).componentEnd === id;

			// Append the node
			if(!end) {
				nodes.push(current);
			}
		} while(!end);

		if(this.instance.register) {
			this.instance.register(nodes, () => update(component));
		}
	}

	/**
	 * Render this route for the current state
	 * @param  {String|Promise} child The child route
	 * @param  {Boolean}        wrap  Whether to wrap components for client-side use
	 * @return {Promise}              A Promise that resolves with the current route
	 */
	async render(child, wrap) {
		if(child instanceof Promise) {
			child = await child;
		}

		// Render the component
		let html = this.instance.render(child && child.html);

		if(html instanceof Promise) {
			html = await html;
		}

		// Set up data attributes for the component
		const components = this.context.components;
		const id         = uid(components);

		// Add the component to the global context
		components[id] = this.route;

		// Wrap the component
		if(wrap) {
			const set = {
				start : [ [ 'data-component', id ] ],
				end   : [ [ 'data-component-end', id ] ],
			};

			if(child) {
				set.start.push([ 'data-child', child.id ]);
			}

			// Map the attributes to HTML
			const attrs = {
				start : set.start.map(([ k, v ]) => v ? `${k}="${v}"` : k).join(' '),
				end   : set.end.map(([ k, v ]) => v ? `${k}="${v}"` : k).join(' '),
			};

			const start = `<span ${attrs.start}></span>`;
			const end   = `<span ${attrs.end}></span>`;

			html = `${start}${html}${end}`;
		}

		return { id, html };
	}
};
