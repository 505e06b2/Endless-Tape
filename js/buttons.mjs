import CassetteAudio from "./cassette_audio.mjs";
import Noise from "./noise.mjs";
import MediaSessionHandler from "./media_session_handler.mjs";

let speedup_interval = null;

function _increaseRate(current_rate, end_rate) {
	const step = 0.01 * ((current_rate > end_rate) ? -1 : 1);

	const cleanUp = () => {
		CassetteAudio.rate.set(end_rate);
		clearInterval(speedup_interval);
		speedup_interval = null;
	}

	const rateChange = () => {
		CassetteAudio.rate.set(current_rate);

		current_rate += step;
		if(step > 0 && current_rate >= end_rate) cleanUp();
		else if(step < 0 && current_rate <= end_rate) cleanUp();
	}

	rateChange(); //do it before resume at least once
	speedup_interval = setInterval(rateChange, 1);
}

window.buttonPlay = async function() {
	const button_classes = document.getElementById("button_play").classList;
	if(button_classes.contains("pressed")) return;

	button_classes.add("pressed");
	cassette.style.animationPlayState = "running";

	_increaseRate(0.0, 1.0);
	await Noise.play();
	await CassetteAudio.resume();
}

window.buttonStop = async function() {
	await CassetteAudio.suspend();
	Noise.pause();
	cassette.style.animationPlayState = "paused";

	if(speedup_interval) {
		clearInterval(speedup_interval);
		speedup_interval = null;
	}

	document.getElementById("button_play").classList.remove("pressed");
	CassetteAudio.rate.set(1.0);
}

window.buttonPlaySpeed = async function(amount) {
	if(CassetteAudio.state() !== "running" || speedup_interval) return;

	let requested = (CassetteAudio.rate.get() + amount).toFixed(1);
	if(requested < 0.5) requested = 0.5;
	else if(requested > 1.5) requested = 1.5;

	_increaseRate(CassetteAudio.rate.get(), requested);
	//cassette.style.animationDuration = `${default_animation_time/requested}s`; //Jutters really bad - not used anymore at all
}

window.buttonVolume = async function(value) {
	const vol = value / 100;
	CassetteAudio.gain.set(vol);
	Noise.volume.set(vol);
}

window.buttonEject = async function() {
	await buttonStop();
	MediaSessionHandler.remove();
	closeCassette();
}
