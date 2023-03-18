"use strict";

let speedup_interval = null;

function _increaseRate(current_rate, end_rate) {
	const step = 0.01 * ((current_rate > end_rate) ? -1 : 1);

	const cleanUp = () => {
		audio.rate.set(end_rate);
		clearInterval(speedup_interval);
		speedup_interval = null;
	}

	const rateChange = () => {
		audio.rate.set(current_rate);

		current_rate += step;
		if(step > 0 && current_rate >= end_rate) cleanUp();
		else if(step < 0 && current_rate <= end_rate) cleanUp();
	}

	rateChange(); //do it before resume at least once
	speedup_interval = setInterval(rateChange, 1);
}

async function buttonPlay() {
	const button_classes = document.getElementById("button_play").classList;
	if(button_classes.contains("pressed")) return;

	button_classes.add("pressed");
	cassette.style.animationPlayState = "running";

	_increaseRate(0.0, 1.0);
	if(noise) await noise.play();
	await audio.resume();
}

async function buttonStop() {
	await audio.suspend();
	if(noise) noise.pause();
	cassette.style.animationPlayState = "paused";

	if(speedup_interval) {
		clearInterval(speedup_interval);
		speedup_interval = null;
	}

	document.getElementById("button_play").classList.remove("pressed");
	audio.rate.set(1.0);
}

async function buttonPlaySpeed(amount) {
	if(audio.state() !== "running" || speedup_interval) return;

	let requested = (audio.rate.get() + amount).toFixed(1);
	if(requested < 0.5) requested = 0.5;
	else if(requested > 1.5) requested = 1.5;

	_increaseRate(audio.rate.get(), requested);
	//cassette.style.animationDuration = `${default_animation_time/requested}s`; //Jutters really bad - not used anymore at all
}

async function buttonVolume(value) {
	const vol = value / 100;
	audio.gain.set(vol);
	if(noise) noise.volume = Math.min(vol, 1.0);
}

async function buttonEject() {
	await buttonStop();
	media_session.remove();
	elements.container.style.display = "none";
	elements.shelf.style.display = "";
	setTimeout(() => {elements.shelf.style.opacity = "1.0";}, 0); //so the opacity transitions
}
