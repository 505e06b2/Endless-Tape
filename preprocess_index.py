#!/usr/bin/env python3

audio_folder = "audio/"
cassette_line = """<div class="case" title="%s" onclick="loadCassette(this.title, '%s')"></div>\n"""

import os
import urllib.parse
from tinytag import TinyTag #pythno3 -m pip install tinytag
current_path = os.path.dirname(os.path.realpath(__file__))

out = ""

for x in sorted(os.listdir( os.path.join(current_path, audio_folder) ), key=lambda v: v.upper()):
	if not x.endswith(".ogg"):
		continue

	file_path = os.path.join(current_path, audio_folder, x)
	url = urllib.parse.urljoin(audio_folder, x)

	song_title = TinyTag.get(os.path.join(audio_folder, x)).title
	if not song_title:
		song_title = os.path.splitext(x)[0]

	out += cassette_line % (song_title, url)

with open(os.path.join(current_path, "index.html"), "w") as o:
	with open(os.path.join(current_path, "template.html"), "r") as i:
		o.write( i.read().replace("${CASSETTES}", out) )


