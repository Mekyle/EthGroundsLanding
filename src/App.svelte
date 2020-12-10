
<style>
	* {
		box-sizing: border-box;
	}
	.container {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100vh;
		background-color: black;
		color: #fff;
		padding: 20px;
	}
	.sentence {
			font-size: 100px;
			filter: grayscale(0.3);
			user-select: none;

			
		}
	.first {
		color: #db2431;
		word-break: break-all
	}
	 
	.slider {
		font-family: sans-serif;
		scroll-snap-type: x mandatory;	
		display: flex;
		-webkit-overflow-scrolling: touch;
		overflow-x: scroll;
		
	}


	section {
		min-width: 100vw;
		height: 100vh;
		scroll-snap-align: center;
		text-align: center;
		position: relative;
	}



header {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding-right: 60vw;
}


main {
  display: flex;
}

section {
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  flex-direction: column;
  padding: 0 var(--padding);
}

section:nth-child(1) {
  background: rgba(80, 80, 80, 0.1);
  margin: 0;
  padding: var(--padding);
}



@media (prefers-color-scheme: light) {
  :root {
    --black: #101820;
    --white: #ffffff;
  }
}

@media (prefers-color-scheme: dark) {
  :root {
    --black: #ffffff;
    --white: #101820;
  }
}

@media (max-width: 1200px) {
  :root {
    font-size: 13px;
    --padding: 4rem;
  }
}

@media (max-width: 700px) {
  :root {
    font-size: 10px;
    --padding: 1.75rem;
  }
}

@media (max-height: 800px) {
  :root {
    font-size: 10px;
  }
}

@media (max-height: 400px) {
  :root {
    font-size: 7px;
  }
}
</style>

<div style="overflow: hidden; height: 100%;">
	<div class="slider">
		<!--Page one, landing page. Needs to have -->
		<section>
			<div class="container">
				<h1 class="sentence"> 
					<span class="first"></span>
					<span class="template">is better than</span>
					<span class="second"></span>
				</h1>
			</div>
			<div class="actions">
				<div class="random btn">
					Random
				</div>
				<div class="edit btn">
					Edit
				</div>
			</div>
		</section>
		<section>
			<div class="text">
				<h1>
				<strong>Horizontal Resume</strong>
				</h1>
				<nav role="navigation">
					<ul>
						<li>
						<a href="#" target="_blank">Lorem</a>
						</li>
						<li>
						<a href="#" target="_blank">Ipsum</a>
						</li>
						<li>
						<a href="#">Dolor</a>
						</li>
					</ul>
				</nav>
			</div>
		</section>
	</div>
</div>