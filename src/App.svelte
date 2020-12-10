<div class="horizontal-scroll">
  <div class="horizontal-scroll__block ">
    <h1>Hi</h1>
  </div>
  <div class="horizontal-scroll__block">
    <div class="background" style="background-image: url(https://source.unsplash.com/category/technology/1024x758)"></div>
    <span class="letter">E</span>
  </div>
  <div class="horizontal-scroll__block">
    <div class="background" style="background-image: url(https://source.unsplash.com/category/buildings/1024x758)"></div>
    <span class="letter">I</span>
  </div>
  <div class="horizontal-scroll__block">
    <div class="background" style="background-image: url(https://source.unsplash.com/category/food/1024x758)"></div>
    <span class="letter">O</span>
  </div>
  <div class="horizontal-scroll__block">
    <div class="background" style="background-image: url(https://source.unsplash.com/category/people/1024x758)"></div>
    <span class="letter">U</span>
  </div>
  <div class="horizontal-scroll__block">
    <div class="background" style="background-image: url(https://source.unsplash.com/category/objects/1024x758)"></div>
    <span class="letter">!</span>
  </div>
</div>

<style>


*,
*::after,
*::before {
  box-sizing: border-box;
}

html {
  font-size: 16px;
}

body {
  overflow: hidden;
  font-size: 1em;
}

.horizontal-scroll {
 margin-top: 0%;
  width: 100vh;
  height: 100vw;
  overflow-y: auto;
  overflow-x: hidden;
  background: #2e2e2e;
  -webkit-transform-origin: right top;
          transform-origin: right top;
  -webkit-transform: rotate(-90deg) translate3d(0, -70vh, 0);
          transform: rotate(-90deg) translate3d(0, -100vh, 0);
}
.horizontal-scroll > * {
  -webkit-transform-origin: left top;
          transform-origin: left top;
  -webkit-transform: rotate(90deg) translate3d(0, calc(-100vh + 60px), 0);
          transform: rotate(90deg) translate3d(0, -100vh, 0);
}
.horizontal-scroll__block {
  width: 100vh;
  height: 100vh;
  background: #fdfffc;
  position: relative;
}
.horizontal-scroll__block:not(:first-child) {

}
.horizontal-scroll__block .background {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: no-repeat center center / cover;
  opacity: 0.8;
  background-blend-mode: luminosity;
}
.horizontal-scroll__block .letter {
  display: inline-block;
  position: absolute;
  top: 50%;
  right: auto;
  bottom: auto;
  left: 50%;
  -webkit-transform: translate3d(-50%, -50%, 0);
          transform: translate3d(-50%, -50%, 0);
  font-weight: normal;
  font-size: 12em;
  font-family: "Playfair Display", serif;
  color: white;
}
.horizontal-scroll__block--purple .background {
  background-color: #52489c;
}
.horizontal-scroll__block--yellow .background {
  background-color: #ecc30b;
}
.horizontal-scroll__block--orange .background {
  background-color: #f37748;
}
.horizontal-scroll__block--blue .background {
  background-color: #4d9de0;
}
.horizontal-scroll__block--green .background {
  background-color: #00bd9d;
}
.horizontal-scroll__block--pink .background {
  background-color: #fb9f89;
}

</style>