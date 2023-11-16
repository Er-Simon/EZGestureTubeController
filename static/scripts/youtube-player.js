const PAUSE_BETWEEN_COMMANDS_IN_MILLIS = 1800

var isReady = false
var timestampLastCommand = Date.now()

function handleYouTubeURL() {
  let url = document.getElementById('youtube-url').value

  var myregexp = /(youtu.*be.*)\/(watch\?v=|embed\/|v|shorts|)(.*?((?=[&#?])|$))/gi
  let matches = url.matchAll(myregexp)

  if (matches) {
    let video_id = null

    for (const match of matches) {
      video_id = match[3]
    }

    if (video_id && !(video_id.length == 0)) {
      if (isReady) {
        player.loadVideoByUrl(url)
      } else {
        swGetYoutubeVids('player', video_id)
      }
    } else {
      let alert = document.getElementById('alert-message')
      alert.classList.remove('d-none')
    }
  }
}

function onYouTubeIframeAPIReady() {
  let playButton = document.getElementById('play-button')
  playButton.disabled = false
}

function onPlayerReady() {
  isReady = true      
  var playerDiv = document.getElementById('player')
  playerDiv.classList.remove('d-none')
}

function swGetYoutubeVids(playerById, videoId) {
  player = new YT.Player(playerById, {
    width: "100%",
    height: "480",
    videoId: videoId,
    events: {
      onReady: onPlayerReady
    },
    playerVars: {
      enablejsapi: 1,
      modestbranding: 1,
      showinfo: 0
    }
  })
}

function parseToAction(value) {
  var newAction = null 
  
  if (value == 2) {
    newAction = "TwoFingers"
  } else if (value == 3) {
    newAction = "ThreeFingers"
  } else if (value == 4) {
    newAction = "FourFingers"
  }

  return newAction
}

function YTPlayerController(action) {
  if (player == null || isReady == false) {
    return
  }

  if (controlsToAction) {
    var currentTime = Date.now()

    if (currentTime - timestampLastCommand > PAUSE_BETWEEN_COMMANDS_IN_MILLIS) {

      if (Number.isInteger(action))
        action = parseToAction(action)
      
      if (action in controlsToAction) {

        timestampLastCommand = Date.now()

        if (controlsToAction[action] == "playVideoControl") {
          player.playVideo()
        } else if (controlsToAction[action] == "pauseVideoControl") {
          player.pauseVideo()
        } else if (controlsToAction[action] == "volumeUpVideoControl") {
          var volumeLevel = player.getVolume()

          volumeLevel = volumeLevel + 10
          volumeLevel = Math.min(100, volumeLevel)

          player.setVolume(volumeLevel)

          timestampLastCommand -= PAUSE_BETWEEN_COMMANDS_IN_MILLIS * 0.75

        } else if (controlsToAction[action] == "volumeDownVideoControl") {
          var volumeLevel = player.getVolume()

          volumeLevel = volumeLevel - 10
          volumeLevel = Math.max(0, volumeLevel)

          player.setVolume(volumeLevel)

          timestampLastCommand -= PAUSE_BETWEEN_COMMANDS_IN_MILLIS * 0.75

        } else if (controlsToAction[action] == "muteVideoControl") {
          player.mute()
        } else if (controlsToAction[action] == "unmuteVideoControl") {
          player.unMute()
        }
      }
    }
  }
}
