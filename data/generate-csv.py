from bs4 import BeautifulSoup # html parsingßß
import os # file handling
import re # regex

speaker_indicator = "\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0"
csv_file_path = "./data/demon-slayer-transcript.csv"

# Check if the file exists
if os.path.exists(csv_file_path):
    # Delete the file so new data can be written
    os.remove(csv_file_path)


# Load the HTML file
with open("./data/Demon Slayer (ENG sub).html", "r", encoding="utf-8") as file:
    soup = BeautifulSoup(file, "html.parser")

scene_id = 0;
action_id = 0;

class Scene:
    def __init__(self, description):
        self.scene_id = scene_id + 1
        self.description = description

class Action:
    def __init__(self, description):
        self.action_id = action_id + 1
        self.description = description

# Parse the html file to make an array of dialogues, then export to a CSV file
class Dialogue:
    def __init__(self, text, speaker, scene, episode, season, preface=None, action=None):
        self.text = text
        self.speaker = speaker
        self.scene = scene
        self.episode = episode
        self.season = season
        self.preface = preface
        self.action = action

dialouges = []

#### Extract info for each episode
# Header Format :
# <h1>Demon<span style='letter-spacing:-.15pt'> </span>Slayer<span
# style='letter-spacing:-.3pt'> </span>S.1<span style='letter-spacing:-.4pt'> </span><span
# style='letter-spacing:-.2pt'>E.01</span><span style='text-decoration:none;
# text-underline:none'><o:p></o:p></span></h1>
#### Desired Data from this: S.1, E.01, &
#### all html between the current <h1> and the next <h1> tag (this will be the dialouge for the episode)
#### Should return a two key dict in the format {[Season, Episode]: [html]}


#### Extract description from scenes and dialouge between it and the next scene
# <p class=MsoNormal style='margin-top:.05pt;margin-right:40.95pt;margin-bottom:
# 0in;margin-left:.95pt;margin-bottom:.0001pt;line-height:115%'><i
# style='mso-bidi-font-style:normal'>[Scene:<span style='letter-spacing:-.15pt'> </span>A<span
# style='letter-spacing:-.1pt'> </span>young<span style='letter-spacing:-.2pt'> </span>boy,
# Tanjirou, carries<span style='letter-spacing:-.1pt'> </span>his<span
# style='letter-spacing:-.2pt'> </span>sister,<span style='letter-spacing:-.25pt'>
# </span>Nezuko,<span style='letter-spacing:-.05pt'> </span>on<span
# style='letter-spacing:-.2pt'> </span>his<span style='letter-spacing:-.05pt'> </span>back<span
# style='letter-spacing:-.3pt'> </span>through<span style='letter-spacing:-.1pt'>
# </span>the<span style='letter-spacing:-.2pt'> </span>snow.<span
# style='letter-spacing:-.15pt'> </span>Nezuko<span style='letter-spacing:-.1pt'>
# </span>is bleeding from a wound on her head.]<o:p></o:p></i></p>
#### Desired Data from this: "At a small cabin in the mountains, during the morning. Tanjirou takes up a basket of charcoal on his back and is preparing to leave the hous"
#### & all html between the current <p> with brackets [Scene:...] and the next <p> tag with [Scene:...](this will be the dialouge for the scene)

#### Extract dialouge from scenes and dialouge between it and the next scene
# <p class=MsoNormal style='margin-top:10.7pt;margin-right:0in;margin-bottom:
# 0in;margin-left:.95pt;margin-bottom:.0001pt;tab-stops:76.8pt'><b
# style='mso-bidi-font-weight:normal'><span style='letter-spacing:-.1pt'>Tanjirou</span><span
# style='mso-tab-count:1'>           </span></b>(Thoughts)<span style='letter-spacing:
# -.4pt'> </span><span style='letter-spacing:-.2pt'>How…?</span></p>
#### Desired Data from this: speaker (Tanjirou), text (How...?), & all html between the current <p> with a tab span and the next <p> tag (this will be the dialouge for the speaker)
# Speakers have the following always after they speak:
# <span style='letter-spacing:-.25pt'>Kie</span><span
# style='mso-tab-count:1'>

# Setup csv file
with open(csv_file_path, "w", encoding="utf-8") as csv_file:
    # Write the header row
    csv_file.write("text,speaker,episode,season,preface,scene,scene_id,action,action_id\n")
    # Write the data rows
    h1_tags = soup.find_all("h1")
    for i, episode in enumerate(h1_tags):
        # Get the episode number and season
        episode_number = episode.text.split("E.")[1].split("<")[0]
        season_number = re.search(r"S\.(\d+)", episode.text).group(1)
        scene = None
        action = None
        dialouge = None

        # Get all HTML between the current <h1> and the next <h1>
        # this issue with this is the h1 is in a div, there is a div for each page, i need it to get 
        # all the html between the current h1 and the next h1, despite being in different div parents, and several divs being between them
        # Get all HTML between the current <h1> and the next <h1>, spanning multiple divs
        html_between = []
        current_element = episode.find_next()

        while current_element:
            # Stop if we reach the next <h1>
            if current_element.name == "h1" and current_element != episode:
                break
            # Add the current element to the list if it's not empty
            if current_element.name and current_element.text.strip():
                html_between.append(current_element)
            # Move to the next element in the document
            current_element = current_element.find_next()

        # Process the HTML between the <h1> tags
        for line in html_between:
            if line.name == "p" and line.text != "\xa0" and line.text != "":
                # Check if the line is a scene
                if "[Scene:" in line.text:
                    scene_description = line.text.split("[Scene:")[1].split("]")[0]
                    scene = Scene(scene_description)
                # Check if the line is an action
                elif "[Action:" in line.text:
                    action_description = line.text.split("[Action:")[1].split("]")[0]
                    action = Action(action_description)
                # Check if the line contains a speaker and text
                elif speaker_indicator in line.text:
                    # Split the line by the speaker indicator to handle multiple speakers
                    parts = line.text.split(speaker_indicator)
                    for i in range(0, len(parts) - 1, 2):  # Iterate in pairs (speaker, dialogue)
                        speaker = parts[i].strip()
                        text = parts[i + 1].strip()
                        if speaker and text:
                            preface = None
                            # Check if the text starts with '(' indicating a preface
                            if text.startswith("(") and ")" in text:
                                preface = text[1:text.index(")")]  # Extract content inside parentheses
                                text = text[text.index(")") + 1:].strip()  # Remove the preface from the text
                            dialouge = Dialogue(text, speaker, scene, episode_number, season_number, preface=preface)
                            dialouges.append(dialouge)
                elif dialouge is not None:
                    # Subsequent lines without speakers are assumed to be the same person
                    text = line.text.strip()
                    preface = None
                    if text.startswith("(") and ")" in text:
                        preface = text[1:text.index(")")]
                        text = text[text.index(")") + 1:].strip()
                    dialouge = Dialogue(text, dialouge.speaker, scene, episode_number, season_number, preface=preface)
                    dialouges.append(dialouge)

# Turn Dialouge array into a CSV file
for dialouge in dialouges:
    # Get the text, speaker, scene, episode, season, preface, and action
    text = dialouge.text
    speaker = dialouge.speaker
    episode = dialouge.episode
    season = dialouge.season
    preface = dialouge.preface
    scene_id = dialouge.scene.scene_id if dialouge.scene else None
    scene = dialouge.scene.description if dialouge.scene else None
    action = dialouge.action.description if dialouge.action else None
    action_id = dialouge.action.action_id if dialouge.action else None

    # Create a new row in the CSV file with the extracted data
    with open(csv_file_path, "a", encoding="utf-8") as csv_file:
        csv_file.write(f'"{text.replace("\"", "\"\"")}",'
                       f'"{speaker.replace("\"", "\"\"")}",'
                       f'"{episode}",'
                       f'"{season}",'
                       f'"{preface.replace("\"", "\"\"") if preface else ""}",'
                       f'"{scene.replace("\"", "\"\"") if scene else ""}",'
                       f'"{scene_id if scene_id else ""}",'
                       f'"{action.replace("\"", "\"\"") if action else ""}",'
                       f'"{action_id if action_id else ""}"\n')