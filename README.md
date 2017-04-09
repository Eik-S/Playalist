# Version 1.2 (In Developement)
## Updates:
* Drag and Drop for Play(ed)list elements
* Hint bubbles for first time visitors
## Bugfixes:
* Fixing autoplay to not play a frequence of songs over and over again
    * (because of the relatedVideo search of the youtube api there is always the same song related to one specific, has to be more random)

# Version 1.1
## Updates:
* Autoplay: If the playlist is empty, the app will continue with related songs
* Session Handling: Client Sessions will be safed in localStorage to restore play(ed)list and actually playing videos
* Light Off: A button to change the background color for a dark ambient
* Donations: With a little donation you can now give a free drink to me
* Title & Meta Tags for SEO

# Version 1.0
* Searchbox: The submit initiates a google api search and gives up to 10 results to the slider underneath
* Player: The Player plays the selected Video and continues with the playlist ones
* Playlist: If a Search-Result is clicked and there is still a video playing, the next is automatically added to the playlist on the left side of the window
* Playedlist: The Videos already played are stacked to the right side of the window
* Crossfade: Its possible to set a crossfade value so that the audio of 2 videos is slightly crossing at the end
   * Logically there are 2 players on top of each other to preload the next video and crossfade them, the z-index switches the currently playing one to the foreground
* Force-Play: To force a playlist or playedlist video to play just click it

