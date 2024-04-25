from youtube_transcript_api import YouTubeTranscriptApi
from pytube import YouTube 
import csv

def get_youtube_transcript(video_id):
	transcript =  YouTubeTranscriptApi.get_transcript(video_id)
	transcipt_json = []

	#  convert trascript to json
	for i in transcript:
		text, start, duration = i.values()
		transcipt_json.append({"text": text, "duration": duration, "start": start})

	# join 10 transcipt into one
	transcipt_json_10 = []
	for i in range(0, len(transcipt_json), 10):
		text = ""
		start = transcipt_json[i]["start"]
		for j in range(i, i+10):
			if j < len(transcipt_json):
				text += transcipt_json[j]["text"] + " "
				end = transcipt_json[j]["start"] + transcipt_json[j]["duration"]
		transcipt_json_10.append({"text": text, "end": end, "start": start})

	yt_link = f"https://www.youtube.com/watch?v={video_id}"
	yt = YouTube(yt_link)
	yt_title = yt.title

	#  save transcript to csv file
	with open("transcript.csv", "w", newline="") as file:
		writer = csv.writer(file)
		writer.writerow(["title","text","start", "end"])
		for row in transcipt_json_10:
			writer.writerow([yt_title, row["text"], row["start"], row["end"]])
		
video_id = "D4XjcAyCcnQ"
get_youtube_transcript(video_id)