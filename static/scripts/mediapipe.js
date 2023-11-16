// Copyright 2023 The MediaPipe Authors.
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//      http://www.apache.org/licenses/LICENSE-2.0
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
import {
  GestureRecognizer,
  FilesetResolver,
  DrawingUtils,
} from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3";

const loadingElement = document.getElementById("loading");
const demosSection = document.getElementById("demos");

let gestureRecognizer;
let runningMode = "IMAGE";
let enableWebcamButton;
let webcamRunning = false;

// Before we can use HandLandmarker class we must wait for it to finish
// loading. Machine Learning models can be large and take a moment to
// get everything needed to run.
const createGestureRecognizer = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
  );
  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
      delegate: "GPU",
    },
    runningMode: runningMode,
  });

  loadingElement.classList.add("d-none");
  demosSection.classList.remove("d-none");
};

createGestureRecognizer();

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/
const video = document.getElementById("webcam");
const canvasElement = document.getElementById("output_canvas");
const canvasCtx = canvasElement.getContext("2d");
//const gestureOutput = document.getElementById("gesture_output");

// Check if webcam access is supported.
function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

// If webcam supported, add event listener to button for when user
// wants to activate it.
if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById("webcamButton");
  enableWebcamButton.addEventListener("click", enableCam);
} else {
  console.warn("getUserMedia() is not supported by your browser");
}

// Enable the live webcam view and start detection.
function enableCam(event) {
  if (!gestureRecognizer) {
    alert("Please wait for gestureRecognizer to load");
    return;
  }

  if (webcamRunning === true) {
    webcamRunning = false;
    enableWebcamButton.innerText = "Enable Gesture Control";

    video.classList.add("d-none");
    canvasElement.classList.add("d-none");
    //gestureOutput.classList.add("d-none");
  } else {
    webcamRunning = true;
    enableWebcamButton.innerText = "Disable Gesture Control";

    video.classList.remove("d-none");
    canvasElement.classList.remove("d-none");
    //gestureOutput.classList.remove("d-none");
  }

  // getUsermedia parameters.
  const constraints = {
    video: true,
  };

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
    video.srcObject = stream;
    video.addEventListener("loadeddata", predictWebcam);
  });
}

let lastVideoTime = -1;
let results = undefined;

async function predictWebcam() {
  const webcamElement = document.getElementById("webcam");

  // Now let's start detecting the stream.
  if (runningMode === "IMAGE") {
    runningMode = "VIDEO";
    await gestureRecognizer.setOptions({ runningMode: "VIDEO" });
  }

  let nowInMs = Date.now();
  if (video.currentTime !== lastVideoTime) {
    lastVideoTime = video.currentTime;
    results = gestureRecognizer.recognizeForVideo(video, nowInMs);
  }

  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  const drawingUtils = new DrawingUtils(canvasCtx);
  canvasElement.style.height = `${webcamElement.offsetHeight}px`;
  canvasElement.style.width = `${webcamElement.offsetWidth}px`;

  canvasElement.style.left = `${webcamElement.offsetLeft}px`;

  //console.log(results)

  if (results.landmarks) {

    for (const landmarks of results.landmarks) {
      drawingUtils.drawConnectors(
        landmarks,
        GestureRecognizer.HAND_CONNECTIONS,
        {
          color: "#00FF00",
          lineWidth: 5,
        }
      );
      drawingUtils.drawLandmarks(landmarks, {
        color: "#FF0000",
        lineWidth: 2,
      });
    }
  }

  canvasCtx.restore();

  if (results.gestures.length > 0) {
    if (webcamRunning) {
      //gestureOutput.style.width = videoWidth
      const categoryName = results.gestures[0][0].categoryName;
      const categoryScore = parseFloat(
        results.gestures[0][0].score * 100
      ).toFixed(2);

      const handLabel = results.handednesses[0][0].displayName;

      var fingerCount = 0
      var landmarks = []

      for (const landmark of results.landmarks[0]) {
        landmarks.push([landmark.x, landmark.y])
      }

      if (handLabel == "Left" && landmarks[4][0] > landmarks[3][0]) {
        fingerCount = fingerCount+1
      } else if (handLabel == "Right" && landmarks[4][0] < landmarks[3][0]) {
        fingerCount = fingerCount+1
      }

      if (landmarks[8][1] < landmarks[6][1])  
        fingerCount = fingerCount+1
      if (landmarks[12][1] < landmarks[10][1])
        fingerCount = fingerCount+1
      if (landmarks[16][1] < landmarks[14][1])
         fingerCount = fingerCount+1
      if (landmarks[20][1] < landmarks[18][1])
        fingerCount = fingerCount+1

      var gestureOutput = `GestureRecognizer: ${categoryName}\nConfidence: ${categoryScore} %\nHandedness: ${handLabel}\nFingerCount: ${fingerCount}`;

      var offset = 10
      var lineheight = 38

      var lines = gestureOutput.split('\n')

      canvasCtx.font = "38px Arial";

      var textMaxWidth = lines.map(
        (text) => canvasCtx.measureText(text).width
      )

      textMaxWidth = Math.max.apply(Math, textMaxWidth);

      canvasCtx.textAlign='start';
      canvasCtx.textBaseline='top';

      canvasCtx.fillStyle = 'rgba(0, 0, 0, .6)';
      canvasCtx.fillRect(0, 0, textMaxWidth + (offset * 2), (lines.length * lineheight) + (offset * 2));

      canvasCtx.fillStyle = 'white';

      for (var i = 0; i < lines.length; i++) 
        canvasCtx.fillText(lines[i], offset, offset + (i * lineheight))

      if (categoryName !== 'None') {
        YTPlayerController(categoryName)
      } else if (fingerCount) {
        YTPlayerController(fingerCount)
      }
      
      //gestureOutput.classList.remove("d-none");
    }
  } //else {
    //gestureOutput.classList.add("d-none");
  //}

  // Call this function again to keep predicting when the browser is ready.
  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam);
  }
}
