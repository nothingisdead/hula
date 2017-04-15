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
					overflow   : auto;
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
