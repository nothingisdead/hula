# hula
A simple, modern web app framework

## Basic Setup
The following commands will create a `hula` app and start the development server. Your app will be served at http://localhost:3000.
```sh
$ git clone https://github.com/nothingisdead/hula.git new_app
$ cd new_app
$ npm install
$ node .
```
In development mode (default), the server will restart and any open pages will be refreshed after any code changes.

## Components
- Components should be created under `src/components`.
- Routes matching the component path will automatically be created for any components.
- Child routes will automatically be passed to any matching parent routes for inclusion.

## Example:
`hula` comes with an example todo app, which is reproduced below.

### src/components/todo.js
```js
if(typeof document !== 'undefined') {
	document.title = 'Todo Example';
}

export default class {
	constructor(app) {
		this.app = app;
	}

	static get forward() {
		return '/list';
	}

	// Return an html string (or a Promise)
	render(child) {
		// Use the this.app template tag to include components
		return this.app`
			<style>
				.container {
					display         : flex;
					align-items     : center;
					justify-content : center;
					position        : absolute;
					top             : 0;
					right           : 0;
					bottom          : 0;
					left            : 0;
				}

				.app {
					box-shadow : 0 0 1px 0 black;
					padding    : 1rem;
					width      : 600px;
					height     : 400px;
					text-align : center;
				}
			</style>

			<div class="container">
				<div class="app">
					<h1>Todos:</h1>
					<!-- Include the child component -->
					${child || ''}
				</div>
			</div>
		`;
	}
};
```

## src/components/todo/list.js
```js
const items = [
	{
		title : 'Create sample hula app',
		done  : true,
	},
	{
		title : 'Add some todos',
		done  : false,
	}
];

export default class {
	constructor(app) {
		this.app = app;
	}

	// Register event listeners for this component
	register(component) {
		// Handle deleting an item
		component.addEventListener('change', (e) => {
			if(e.target.type === 'checkbox') {
				// Set the 'done' property
				items[e.target.dataset.item].done = e.target.checked;

				// Update the component
				component.update();
			}
		});

		// Handle creating an item
		component.addEventListener('submit', (e) => {
			// Prevent navigation
			e.preventDefault();

			// Add the item
			items.push({
				title : component.querySelector('input').value,
				done  : false,
			});

			// "Add some todos" is complete
			items[1].done = true;

			// Reset the form
			e.target.reset();

			// Upate the component
			component.update();
		});
	}

	render() {
		return this.app`
			<style>
				.list {
					display         : inline-block;
					padding         : 0;
					text-align      : left;
					list-style-type : none;
				}

				.list label {
					cursor : pointer;
				}

				.list .done span {
					text-decoration : line-through;
				}
			</style>

			<form>
				<input type="text" placeholder="Enter an item">
			</form>
			<ul class="list">
				${items.map(({ title, done }, i) => `
					<li${done ? ' class="done"' : ''}>
						<label>
							<input data-item="${i}" type="checkbox"${done ? ' checked' : ''}>
							<span>${title}</span>
						</label>
					</li>
				`)}
			</ul>
		`;
	}
};
```
