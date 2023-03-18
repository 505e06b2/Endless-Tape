import Buttons from "./buttons.mjs";

function _MediaSessionHandler() {
	const _mediaSession = navigator.mediaSession;

	this.add = (title, metadata) => {
		if(_mediaSession) {
			const media_metadata = {
				title: title,
				artist: metadata["ARTIST"],
				album: metadata["ALBUM"],
				artwork: [
					//{src: `url('${metadata["CASSETTE_BG"]}')`}, //Doen't seem to work with base64
					{src: "assets/icon.svg"},
					{src: "assets/icon.png"},
				]
			};

			_mediaSession.metadata = new MediaMetadata(media_metadata);
			_mediaSession.setPositionState({duration: 0});

			_mediaSession.setActionHandler("play",         () => { if(cassetteVisible()) Buttons.Play() });
			_mediaSession.setActionHandler("pause",        () => { if(cassetteVisible()) Buttons.Stop() });
			_mediaSession.setActionHandler("stop",         () => { if(cassetteVisible()) Buttons.Stop() });
			_mediaSession.setActionHandler("seekforward",  () => { if(cassetteVisible()) Buttons.PlaySpeed(+0.1) });
			_mediaSession.setActionHandler("seekbackward", () => { if(cassetteVisible()) Buttons.PlaySpeed(-0.1) });
		}
	}

	this.remove = () => {
		if(_mediaSession) {
			_mediaSession.metadata = null;
		}
	}
}

export default new _MediaSessionHandler();
