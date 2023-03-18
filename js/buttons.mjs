import CassetteAudio from "./cassette_audio.mjs";
import Noise from "./noise.mjs";
import MediaSessionHandler from "./media_session_handler.mjs";

function _Buttons() {
	let _speedup_interval = null;

	const _increaseRate = (current_rate, end_rate) => {
		const step = 0.01 * ((current_rate > end_rate) ? -1 : 1);

		const cleanUp = () => {
			CassetteAudio.rate.set(end_rate);
			clearInterval(_speedup_interval);
			_speedup_interval = null;
		}

		const rateChange = () => {
			CassetteAudio.rate.set(current_rate);

			current_rate += step;
			if(step > 0 && current_rate >= end_rate) cleanUp();
			else if(step < 0 && current_rate <= end_rate) cleanUp();
		}

		rateChange(); //do it before resume at least once
		_speedup_interval = setInterval(rateChange, 1);
	};

	this.Play = async function() {
		const button_classes = document.getElementById("button_play").classList;
		if(button_classes.contains("pressed")) return;

		button_classes.add("pressed");
		cassette.style.animationPlayState = "running";

		_increaseRate(0.0, 1.0);
		await Noise.play();
		await CassetteAudio.resume();
	}

	this.Stop = async function() {
		await CassetteAudio.suspend();
		Noise.pause();
		cassette.style.animationPlayState = "paused";

		if(_speedup_interval) {
			clearInterval(_speedup_interval);
			_speedup_interval = null;
		}

		document.getElementById("button_play").classList.remove("pressed");
		CassetteAudio.rate.set(1.0);
	}

	this.PlaySpeed = async function(amount) {
		if(CassetteAudio.state() !== "running" || _speedup_interval) return;

		let requested = (CassetteAudio.rate.get() + amount).toFixed(1);
		if(requested < 0.5) requested = 0.5;
		else if(requested > 1.5) requested = 1.5;

		_increaseRate(CassetteAudio.rate.get(), requested);
		//cassette.style.animationDuration = `${default_animation_time/requested}s`; //Jutters really bad - not used anymore at all
	}

	this.Volume = async function(value) {
		const vol = value / 100;
		CassetteAudio.gain.set(vol);
		Noise.volume.set(vol);
	}

	this.Eject = async function() {
		await this.Stop();
		MediaSessionHandler.remove();
		closeCassette();
	}
}

export default new _Buttons();
