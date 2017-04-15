import { Client } from './client.js';

// Create a rendering context
const context = {
	state      : {},
	components : {},
};

// Restore the global rendering context if available
if(__context) {
	Object.assign(context, __context);
}

const element = document.querySelector('main');
const client  = new Client(element, context);
