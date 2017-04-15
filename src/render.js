import { dirname, resolve } from 'path';
import { Router } from './router.js';

// Register existing components
export function register(context) {
	for(let id in context.components) {
		const route     = context.components[id];
		const component = document.querySelector(`[data-component="${id}"]`);

		if(component) {
			Router.get(route, context).register(component);
		}
		else {
			delete context.components[id];
		}
	}
}

// Render a component
export async function render(route, context, parents) {
	// Resolve any relative components of the path
	route = resolve(route);

	// If the route is not defined, return a 404 error
	if(!Router.exists(route)) {
		const error = new Error("Path not found");

		return Promise.reject(
			Object.assign(error, { code : 404 })
		);
	}

	let current = route;
	let result  = '';

	do {
		if(Router.exists(current)) {
			// Get the component instance
			const instance = Router.get(current, context);

			// Render the component
			result = await instance.render(result);
		}

		// Move up to the parent route
		current = dirname(current);
	} while(parents && current !== '/');

	// Render the root document
	return result.html;
};
