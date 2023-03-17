#!/usr/bin/env python3

import sys, subprocess, base64, mimetypes
from pathlib import Path
import urllib.parse

meta_file = Path("/tmp/metadata.txt").resolve()

def optimiseSVG(filename):
	try:
		process = subprocess.run([
			"scour",
			filename,
			"--enable-viewboxing",
			"--enable-id-stripping",
			"--enable-comment-stripping",
			"--shorten-ids",
			"--indent=none",
			"--no-line-breaks",
			"--strip-xml-prolog",
			"-q"
		], check=True, stdout=subprocess.PIPE)

	except FileNotFoundError:
		print("To optimise SVGs, you must install \"scour\": sudo apt install scour", file=sys.stderr)
		sys.exit(1)

	stdout = process.stdout.decode("utf8").strip().replace("\"", "'")
	return urllib.parse.quote(stdout, safe="/ =:'")

def getTagContents(filename):
	mime = mimetypes.guess_type(filename)[0]
	if not mime:
		print(f"Can't get mimetype for \"{filename}\"", file=sys.stderr)
		sys.exit(1)

	if mime == "image/svg+xml":
		return f"data:{mime};utf8,{optimiseSVG(filename)}"

	with open(filename, "rb") as f:
		encoded_bytes = base64.b64encode(f.read()).decode("utf8")
		return f"data:{mime};base64,{encoded_bytes}"

if __name__ == "__main__":
	import argparse

	parser = argparse.ArgumentParser()
	parser.add_argument("ogg_file", type=Path)
	parser.add_argument("bg_image", type=Path)
	parser.add_argument("label_image", type=Path)
	arguments = parser.parse_args()

	with open(meta_file, "w") as f:
		f.write(f"CASSETTE_BG={getTagContents(arguments.bg_image.resolve())}\n")
		f.write(f"CASSETTE_LABEL={getTagContents(arguments.label_image.resolve())}\n")

	out_filename = Path(arguments.ogg_file.parent.resolve(), f"{arguments.ogg_file.stem}_cassette.ogg")

	try:
		subprocess.run([
			"vorbiscomment",
			"-a",
			"-R",
			"-c", meta_file,
			arguments.ogg_file.resolve(),
			out_filename
		], check=True)

	except FileNotFoundError:
		print("To write ogg file metadata, you must install \"vorbiscomment\": sudo apt install vorbis-tools", file=sys.stderr)
		sys.exit(1)

	print(f"Written audio file to \"{out_filename}\"")
