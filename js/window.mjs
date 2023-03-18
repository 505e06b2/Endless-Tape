import CassetteAudio from "./cassette_audio.mjs";
import MediaSessionHandler from "./media_session_handler.mjs";
import OggParser from "./parse_ogg.mjs";

import Buttons from "./buttons.mjs"

const default_volume = 30; //percent

const elements = {
	shelf: null,
	container: null,
	playing_container: null,
	cassette: null,
	messages: {}
};

function getAbsoluteURL(url) {
	const a = document.createElement("a");
	a.href = url; //for some reason this turns absolute lol
	return a.href;
}

window.cassetteVisible = function() {
	return (elements.container.style.display !== "none" && elements.playing_container.style.opacity === "1");
}

window.setCassetteAssets = async function(metadata) {
	function checkTag(tag_contents) {
		return (tag_contents && typeof(tag_contents) === "string" && tag_contents.length > 16);
	}

	let style = "";
	if(checkTag(metadata.CASSETTE_BG))    style += `--tiled-bg:url("${metadata.CASSETTE_BG}");`;
	if(checkTag(metadata.CASSETTE_LABEL)) style += `--label-bg:url("${metadata.CASSETTE_LABEL}");`;
	cassette.style = style;

	return metadata;
}

window.preloadCassette = async function(text) {
	elements.playing_container.style.opacity = "0.0";
	elements.shelf.style.opacity = "0.0";
	elements.shelf.style.display = "none";
	elements.container.style.display = "";

	elements.messages.percent.innerText = "0%";
	elements.messages.description.innerText = text;
	elements.messages.parent.style.display = "flex";
}

window.loadCustomCassette = async function() {
	const input_elem = document.createElement("input");
	input_elem.type = "file";
	input_elem.accept = ".wav,.mp3,.ogg,.webm,.flac,.opus,.vorbis";
	input_elem.onchange = async () => {
		await preloadCassette("Loading");

		if(input_elem.files[0].size > 5 * 1024*1024) { //to mb
			console.warn("Given big file, getting URL instead of decoding");
			try {
				await loadCassetteFinish(input_elem.files[0].name, URL.createObjectURL(input_elem.files[0]));
			} catch(e) {
				console.error(e);
				Buttons.Eject();
			}
		} else {
			const reader = new FileReader();
			reader.addEventListener("progress", async (event) => {
				elements.messages.percent.innerText = `${Math.trunc(event.loaded/event.total*95)}%`;
			});
			reader.addEventListener("load", async (event) => {
				try {
					await loadCassetteFinish(input_elem.files[0].name, "[CUSTOM]", event.target.result);
				} catch(e) {
					console.error(e);
					Buttons.Eject();
				}
			});
			reader.readAsArrayBuffer(input_elem.files[0]);
		}
	};
	input_elem.click();
}

window.loadCassette = async function(title, url) {
	await preloadCassette("Downloading");

	const file_contents = await (async () => {
		const r = await fetch(url);
		const content_length = r.headers.get("Content-Length");

		if(content_length) {
			const chunks = [];
			const reader = r.body.getReader();
			let received_bytes = 0;

			while(true) {
				const {done, value} = await reader.read();
				if(done) break;

				chunks.push(value);
				received_bytes += value.length;
				elements.messages.percent.innerText = `${Math.trunc(received_bytes/content_length*95)}%`;
			}

			const buffer_array = new Uint8Array(received_bytes);
			let position = 0;
			for(const i in chunks) {
				buffer_array.set(chunks[i], position);
				position += chunks[i].length;
			}

			return buffer_array.buffer;
		} else {
			progress(-1, "Downloading");
			return await r.arrayBuffer();
		}
	})();

	try {
		await loadCassetteFinish(title, url, file_contents);
	} catch(e) {
		console.error(e);
		Buttons.Eject();
	}
}

window.loadCassetteFinish = async function(title, url, file_contents) {
	let metadata = {};

	if(file_contents) {
		const decodes = {
			"metadata": setCassetteAssets( (new OggParser(file_contents)).getMetadata() ),
			"audio": CassetteAudio.decodeFile(file_contents)
		};

		elements.messages.description.innerText = "Parsing Metadata";
		metadata = await decodes["metadata"];
		elements.messages.percent.innerText = "98%";

		if(Object.keys(metadata).length) {
			(async () => {
				let info = `==== Metadata ====\n${getAbsoluteURL(url)}\n`;
				if(metadata.TITLE) info +=  `- Title:  ${metadata.TITLE}\n`;
				if(metadata.ARTIST) info += `- Artist: ${metadata.ARTIST}\n`;
				if(metadata.ALBUM) info +=  `- Album:  ${metadata.ALBUM}\n`;
				if(metadata.SOURCE) info += `- Source: ${metadata.SOURCE}\n`;
				console.log(info);
			})();
		}

		elements.messages.description.innerText = "Parsing Audiobuffer";
		const audio_buffer = await decodes["audio"];
		CassetteAudio.changeTrack(audio_buffer);

	} else {
		setCassetteAssets({});
		CassetteAudio.changeTrack(url);
	}

	elements.messages.parent.style.display = "";
	elements.playing_container.style.opacity = "1.0"; //opacity and not display, so that the images can preload a bit

	await Buttons.Volume(default_volume);
	document.getElementById("volume").value = default_volume;
	await Buttons.Play();

	MediaSessionHandler.add(title, metadata);
}

window.closeCassette = function() {
	elements.container.style.display = "none";
	elements.shelf.style.display = "";
	elements.shelf.style.opacity = "0.0";
	setTimeout(() => {elements.shelf.style.opacity = "1.0";}, 20);
}

window.onload = async () => {
	elements.shelf = document.getElementById("shelf");
	elements.container = document.getElementById("container");
	elements.playing_container = document.getElementById("playing-container");
	elements.cassette = document.getElementById("cassette");

	elements.messages = {
		"parent": document.getElementById("messages"),
		"percent": document.getElementById("percent"),
		"description": document.getElementById("description")
	};

	shelf.style.opacity = "1.0";

	if("serviceWorker" in navigator) {
		try {
			await navigator.serviceWorker.register("service_worker.js");
		} catch {
			console.warn("Service worker was not loaded");
		}
	}

	window.Buttons = Buttons;
};
