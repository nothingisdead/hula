import { Client } from './client.js';

// Create a rendering context
const context = {
	state      : {},
	components : {},
};

// Restore the global rendering context if available
if(typeof __context !== 'undefined') {
	Object.assign(context, __context);
}

const element = document.querySelector('main');
const client  = new Client(element, context);
