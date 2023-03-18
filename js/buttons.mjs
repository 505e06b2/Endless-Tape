import CassetteAudio from "./cassette_audio.mjs";
import Noise from "./noise.mjs";
import MediaSessionHandler from "./media_session_handler.mjs";

function _Buttons() {
	let _speedup_in_progress = false;

	const _increaseRate = async (current_rate, end_rate) => {
		_speedup_in_progress = true;

		const step = 0.01 * ((current_rate > end_rate) ? -1 : 1);

		do {
			CassetteAudio.rate.set(current_rate);

			current_rate += step;
			await new Promise(x => setTimeout(x, 1));

		} while(_speedup_in_progress && ((step > 0 && current_rate < end_rate) || (step < 0 && current_rate > end_rate)));


		CassetteAudio.rate.set(end_rate);
		_speedup_in_progress = false;
	};

	this.Play = async () => {
		const button_classes = document.getElementById("button_play").classList;
		if(button_classes.contains("pressed")) return;

		button_classes.add("pressed");
		cassette.style.animationPlayState = "running";

		_increaseRate(0.0, 1.0);
		await Noise.play();
		await CassetteAudio.resume();
	}

	this.Stop = async () => {
		await CassetteAudio.suspend();
		Noise.pause();
		cassette.style.animationPlayState = "paused";

		if(_speedup_in_progress) _speedup_in_progress = false;

		document.getElementById("button_play").classList.remove("pressed");
		CassetteAudio.rate.set(1.0);
	}

	this.PlaySpeed = (amount) => {
		if(CassetteAudio.state() !== "running" || _speedup_in_progress) return;

		const requested = (CassetteAudio.rate.get() + amount).toFixed(1);

		_increaseRate(CassetteAudio.rate.get(), Math.min(Math.max(requested, 0.5), 1.5));
		//cassette.style.animationDuration = `${default_animation_time/requested}s`; //Jutters really bad - not used anymore at all
	}

	this.Volume = (value) => {
		const vol = value / 100;
		CassetteAudio.gain.set(vol);
		Noise.volume.set(vol);
	}

	this.Eject = async () => {
		await this.Stop();
		MediaSessionHandler.remove();
		closeCassette();
	}
}

export default new _Buttons();
