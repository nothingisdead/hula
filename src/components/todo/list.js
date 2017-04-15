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
