var getUserMedia = require('getusermedia')

getUserMedia({
  video: true,
  audio: false
}, function (err, stream) {
  if (err) return console.error(err)
  var Peer = require('simple-peer')
  var peer = new Peer({
    initiator: location.hash === '#init',
    trickle: false,
    stream: stream
  })

  console.log("Check>>", peer.initiator)
  peer.on('signal', function (data) {
    document.getElementById('yourId').value = JSON.stringify(data)
  })

  document.getElementById('connect').addEventListener('click', function () {
    var otherId = JSON.parse(document.getElementById('otherId').value)
    peer.signal(otherId)
  })

  peer.on('stream', function (stream) {
    var video = document.createElement('video')
    document.getElementById("videoFrame").appendChild(video);
    video.src = window.URL.createObjectURL(stream)
    video.play()
  })

  function pad(num) {
    return ("0" + num).slice(-2);
  }

  function getTimeFromDate(timestamp) {
    var date = new Date(timestamp)
    var hours = date.getHours()
    var minutes = date.getMinutes()
    var seconds = date.getSeconds()
    var milliseconds = date.getMilliseconds()
    return pad(hours) + ":" + pad(minutes) + ":" + pad(seconds) + ":" + milliseconds
  }

  // start stop watch
  var timeBegan = null,
    timeStopped = null,
    stoppedDuration = 0,
    started = null,
    stopHour = 0,
    stopMin = 0,
    stopSec = 30,
    ifStartStop = null

  function start() {
    ifStartStop = "start"
    if (timeBegan === null) {
      timeBegan = new Date()
    }

    if (timeStopped !== null) {
      stoppedDuration += (new Date() - timeStopped)
    }
    started = setInterval(clockRunning, 10)
  }

  function stop() {
    timeStopped = new Date()
    clearInterval(started)
    ifStartStop = "stop"
  }

  function clockRunning() {
    var currentTime = new Date(),
      timeElapsed = new Date(currentTime - timeBegan - stoppedDuration),
      hour = timeElapsed.getUTCHours(),
      min = timeElapsed.getUTCMinutes(),
      sec = timeElapsed.getUTCSeconds(),
      ms = timeElapsed.getUTCMilliseconds()
    document.getElementById("videoStrimTime").innerHTML =
      (hour > 9 ? hour : "0" + hour) + ":" +
      (min > 9 ? min : "0" + min) + ":" +
      (sec > 9 ? sec : "0" + sec) + "." +
      (ms > 99 ? ms : ms > 9 ? "0" + ms : "00" + ms)

    if ((hour == stopHour) && (min == stopMin) && (sec == stopSec)) {
      stop()
    }
  };

  // Display Frame Section value
  var firstVal = 0,
    firstTimingFrameVal = 0,
    videoStrimTimeAdd = 0,
    timeStampVal = 0

  function printStat(items) {
    if (peer.initiator) {
      var currentVal

      // ssrc frameEncode Value
      items.forEach(function (stat, index) {
        if (firstVal == 0) {
          if (stat.type == "ssrc" && stat.framesEncoded && stat.mediaType == "video")
            firstVal = stat.framesEncoded
        } else {
          if (stat.type == "ssrc" && stat.framesEncoded && stat.mediaType == "video") {
            currentVal = stat.framesEncoded
            if (firstVal != currentVal) {
              firstVal = currentVal
              var now = new Date();
              document.getElementById("timeStamp1").innerHTML = getTimeFromDate(now.getTime())
              document.getElementById("framesEncoded").innerHTML = stat.framesEncoded
            }
          }
        }
      });
      document.getElementById("frameInfoReceiver").style.display = "none"
    } else {
      var currentVal, videoStrimTime = 0

      // ssrc frameDecode Value
      items.forEach(function (stat, index) {
        if (firstVal == 0) {
          if (stat.type == "ssrc" && stat.framesDecoded && stat.mediaType == "video")
            firstVal = stat.framesDecoded
        } else {
          if (stat.type == "ssrc" && stat.framesDecoded && stat.mediaType == "video") {
            console.log("statRecevier>>>", stat)
            var codelines = stat.googTimingFrameInfo
            var timingFrameVal = codelines.split(",")
            console.log("====================================")
            console.log("Encoder Timestamp>>>>>", timingFrameVal[0])

            var NetworkDelayVal = timingFrameVal[7] - timingFrameVal[6]
            console.log("Networ Delay Time>>>>>", NetworkDelayVal)

            var end2endDelay = timingFrameVal[11] - timingFrameVal[1]
            console.log("End to end delay time >>>>>", end2endDelay)
            if (firstTimingFrameVal != 0) {
              videoStrimTime = (timingFrameVal[0] - firstTimingFrameVal) / 90
              videoStrimTimeAdd = (videoStrimTimeAdd * 1) + videoStrimTime
              var stopDate = new Date(videoStrimTimeAdd);
              stopHour = stopDate.getHours()
              stopMin = stopDate.getMinutes()
              stopSec = stopDate.getSeconds() 
            } else {
              start()
            }
            firstTimingFrameVal = timingFrameVal[0]
            currentVal = stat.framesDecoded
            if (firstVal != currentVal) {
              firstVal = currentVal
              var now = new Date();
              document.getElementById("timeStamp1").innerHTML = getTimeFromDate(now.getTime())
              document.getElementById("framesDecodeds").innerHTML = stat.framesDecoded
              document.getElementById("timingFrameVal").innerHTML = timingFrameVal[0]
              document.getElementById("NetworkDelayVal").innerHTML = NetworkDelayVal
              document.getElementById("end2endDelay").innerHTML = end2endDelay
            }
          }
        }
      });
      document.getElementById("frameInfoSender").style.display = "none"
    }
  }

  setInterval(function () {
    peer.getStats(printStat)
  }, 10);
})