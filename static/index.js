const modal = document.getElementById("myModal");
const videoPlayer = document.getElementById("input_video");
var videoSourcesSelect = document.getElementById("VideoSelect");
const root = document.getElementById("root");
const usernameInput = document.getElementById("username");
const button = document.getElementById("join");
const leave = document.getElementById("leave");
const shareScreen = document.getElementById("share_screen");
const AudioControler = document.getElementById("AudioControl");
const container = document.getElementById("container");
const count = document.getElementById("count");
const toggleChat = document.getElementById("toggle_chat");
const MainScreen = document.getElementById("MainScreen");
const chatScroll = document.getElementById("chat");
const chatContent = document.getElementById("chat-content");
const OnOff = document.getElementById("OnOff");
const chatInput = document.getElementById("chat-input");
const canvasElement = document.getElementsByClassName("canvas1")[0];
const canvasDraw = document.getElementsByClassName("canvas2")[0];
const canvasCtx = canvasElement.getContext("2d");
const draw = canvasDraw.getContext("2d");
const toggle_participants = document.getElementById("toggle_participants");
const shareScreenDiv = document.getElementById("shareScreenDiv");
const bottomMenu = document.getElementsByClassName("BottomMenu");
const topMenu = document.getElementsByClassName("TopMenu");

let participant_status = true;

var isPlaying;

const tipIds = [4, 8, 12, 16, 20];
let lmList = [];
let lmList_past = [];
let fingers = [];
let x1, x2, y1, y2;
let colorPaint = "#000000";
let Paint = true;
let connected = false;
let room;
let chat;
let conv;
let screenTrack;
let video;
let audioControl = true;
let chatBoxStatus = false;
modal.style.display = "block";
let plain = true;
let username;
let connectedStatus = false;
let viewCurrent = null;
let PaintSizeNum = 5;

if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    console.log("enumerateDevices() not supported.");
}

let MediaStreamHelper = {
    // Property of the object to store the current stream
    _stream: null,
    // This method will return the promise to list the real devices
    getDevices: function() {
        return navigator.mediaDevices.enumerateDevices();
    },
    // Request user permissions to access the camera and video
    requestStream: function() {
        if (this._stream) {
            this._stream.getTracks().forEach((track) => {
                track.stop();
            });
        }

        const videoSource = videoSourcesSelect.value;
        const constraints = {
            video: {
                deviceId: videoSource ? { exact: videoSource } : undefined,
            },
            audio: false,
        };

        return navigator.mediaDevices.getUserMedia(constraints);
    },
};

MediaStreamHelper.requestStream()
    .then(function(stream) {
        // Store Current Stream
        MediaStreamHelper._stream = stream;

        videoSourcesSelect.selectedIndex = [
            ...videoSourcesSelect.options,
        ].findIndex((option) => option.text === stream.getVideoTracks()[0].label);

        // Play the current stream in the Video element
        videoPlayer.srcObject = stream;

        // You can now list the devices using the Helper
        MediaStreamHelper.getDevices()
            .then((devices) => {
                // Iterate over all the list of devices (InputDeviceInfo and MediaDeviceInfo)
                devices.forEach((device) => {
                    let option = new Option();
                    option.value = device.deviceId;

                    // According to the type of media device
                    switch (device.kind) {
                        // Append device to list of Cameras
                        case "videoinput":
                            option.text =
                                device.label || `Camera ${videoSourcesSelect.length + 1}`;
                            videoSourcesSelect.appendChild(option);
                            break;
                            // Append device to list of Microphone
                    }
                });
            })
            .catch(function(e) {
                console.log(e.name + ": " + e.message);
            });
    })
    .catch(function(err) {
        alert("No Media Device Available");
    });

videoSourcesSelect.onchange = function() {
    MediaStreamHelper.requestStream().then(function(stream) {
        MediaStreamHelper._stream = stream;
        videoPlayer.srcObject = stream;
    });
};

OnOff.addEventListener("click", cameraonoff);

function cameraonoff() {
    event.preventDefault();
    if (!isPlaying) {
        cameraon();
        document.getElementById("OnOff").disabled = true;
        setTimeout(function() {
            document.getElementById("OnOff").disabled = false;
        }, 7000);
        $("#hide_show").css("display", "block");
    } else {
        cameraoff();
        $("#hide_show").css("display", "none");
    }
}
const start_Draw = document.getElementById("agree");

function popUpWindow() {
    $(".hover_bkgr_fricc").show();
}

start_Draw.addEventListener("click", popUpWindow);

const terms = document.getElementById("terms");

function checkboxCheck() {
    if (terms.checked) {
        usernameInput.disabled = false;
        button.disabled = false;
    } else {
        usernameInput.disabled = true;
        usernameInput.value = "";
        button.disabled = true;
    }
}

terms.addEventListener("click", checkboxCheck);

function cameraon() {
    event.preventDefault();
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices
            .getUserMedia({
                video: true,
            })
            .then(function(stream) {
                shareScreenDiv.style.display = "none";
                canvasElement.style.display = "inline";
                canvasDraw.style.display = "inline";
                videoPlayer.srcObject = stream;

                videoPlayer.play();
                try {
                    const hands = new Hands({
                        locateFile: (file) => {
                            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
                        },
                    });
                    hands.setOptions({
                        selfieMode: true,
                        maxNumHands: 2,
                        minDetectionConfidence: 0.5,
                        minTrackingConfidence: 0.5,
                    });
                    hands.onResults(onResults);
                    const camera = new Camera(videoPlayer, {
                        onFrame: async() => {
                            await hands.send({ image: videoPlayer });
                        },
                    });
                    camera.start();
                } catch (error) {
                    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
                    draw.clearRect(0, 0, canvasElement.width, canvasElement.height);
                }
            })
            .then(() => {
                isPlaying = true;
                OnOff.src = "/static/icons/camera.png";
                $(OnOff).attr("title", "turn off camera");
            });
    }
}

function cameraoff() {
    event.preventDefault();
    const stream = videoPlayer.srcObject;
    shareScreenDiv.style.display = "inline";
    canvasElement.style.display = "none";
    canvasDraw.style.display = "none";
    if (stream) {
        const tracks = stream.getTracks();

        tracks.forEach(function(track) {
            track.stop();
        });
        canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
        draw.clearRect(0, 0, canvasElement.width, canvasElement.height);

        videoPlayer.srcObject = null;
        isPlaying = false;
        OnOff.src = "/static/icons/x_camera.png";
        $(OnOff).attr("title", "turn on camera");
    }
}

function connectButtonHandler(event) {
    event.preventDefault();
    if (!connected) {
        username = usernameInput.value;
        if (!username) {
            alert("Enter your name before connecting");
            return;
        }
        button.disabled = true;
        button.innerHTML = "Connecting...";
        connect(username)
            .then(() => {
                shareScreen.disabled = false;
                AudioControler.disabled = false;
                modal.style.display = "none";
                toggle_participants.disabled = false;
                $(".hover_bkgr_fricc").hide();
                connectedStatus = true;
                cameraoff();
                room.localParticipant.audioTracks.forEach((publication) => {
                    publication.track.disable();
                });
                AudioControler.src = "/static/icons/x_mic.png";
                audioControl = false;
            })
            .catch(() => {
                alert("Unable to join the room.");
                button.innerHTML = "Join call";
                button.disabled = false;
            });
    }
}

function LeaveButtonfunction() {
    event.preventDefault();
    if (connectedStatus) {
        disconnect();
        room.localParticipant.audioTracks.forEach((publication) => {
            publication.track.disable();
        });
        AudioControler.src = "/static/icons/x_mic.png";
        audioControl = false;
        cameraoff();
        $("#hide_show").css("display", "none");
        connected = false;
        //shareScreen.innerHTML = "Share screen";
        //shareScreen.disabled = true;
        connectedStatus = false;
        //room.localParticipant.unpublishTrack(screenTrack);
        //screenTrack.stop();
        //screenTrack = null;
        ///shareScreen.src = "/static/x_sharescreen.png";
        // $(shareScreen).attr('title', 'screen share');
        leave.innerHTML = "Join Call";
        $(leave).css("background-color", "#98FB98");
    } else {
        leave.disabled = true;
        connect(username).then(() => {
            connectedStatus = true;
            leave.disabled = false;
            cameraoff();
            room.localParticipant.audioTracks.forEach((publication) => {
                publication.track.disable();
            });
            AudioControler.src = "/static/icons/x_mic.png";
            audioControl = false;
            shareScreen.disabled = false;
            leave.innerHTML = "Leave Call";
            leave.style.backgroundColor = "#DE1738";
        });
    }
}

function connect(username) {
    event.preventDefault();
    isPlaying = videoPlayer.srcObject;
    console.log(isPlaying);
    let promise = new Promise((resolve, reject) => {
        // get a token from the back end
        let data;
        fetch("/login", {
                method: "POST",
                body: JSON.stringify({ username: username }),
            })
            .then((res) => res.json())
            .then((_data) => {
                // join video call
                data = _data;
                return Twilio.Video.connect(data.token, {
                    audio: true,
                    video: false,
                });
            })
            .then((_room) => {
                room = _room;
                room.participants.forEach(participantConnected);
                room.on("participantConnected", participantConnected);
                room.on("participantDisconnected", participantDisconnected);
                connected = true;
                updateParticipantCount();
                connectChat(data.token, data.conversation_sid);
                resolve();
            })
            .catch((e) => {
                console.log(e);
                reject();
            });
    });
    return promise;
}

function updateParticipantCount() {
    if (!connected) count.innerHTML = "Disconnected.";
    else count.innerHTML = room.participants.size + 1 + " participants online.";
}

function participantConnected(participant) {
    let participantDiv = document.createElement("div");
    participantDiv.setAttribute("id", participant.sid);
    participantDiv.setAttribute("class", "participant");
    $(participantDiv).css({
        "background-color": "#3A3D47",
        "border-radius": "10px",
        border: "5px solid white",
    });

    let tracksDiv = document.createElement("div");
    $(tracksDiv).css({
        display: "flex",
        "justify-content": "center",
        "padding-top": "5px",
    });
    participantDiv.appendChild(tracksDiv);

    let labelDiv = document.createElement("div");
    labelDiv.setAttribute("class", "label");
    $(labelDiv).css({ color: "white", "text-align": "center" });
    labelDiv.innerHTML = participant.identity;
    participantDiv.appendChild(labelDiv);

    container.appendChild(participantDiv);

    participant.tracks.forEach((publication) => {
        if (publication.isSubscribed) trackSubscribed(tracksDiv, publication.track);
    });
    participant.on("trackSubscribed", (track) =>
        trackSubscribed(tracksDiv, track)
    );
    participant.on("trackUnsubscribed", trackUnsubscribed);

    updateParticipantCount();
}

function participantDisconnected(participant) {
    document.getElementById(participant.sid).remove();
    updateParticipantCount();
}

function trackSubscribed(div, track) {
    let trackElement = track.attach();
    let mainView = track.attach();
    trackElement.addEventListener("click", () => {
        console.log();
        if (viewCurrent == mainView) {
            shareScreenDiv.style.display = "none";
            viewCurrent = null;
        } else {
            shareScreenDiv.style.display = "inline";

            try {
                shareScreenDiv.removeChild(shareScreenDiv.childNodes[0]);
            } catch (err) {
                null;
            }
            let videoDiv = document.createElement("div");
            videoDiv.appendChild(mainView);
            shareScreenDiv.appendChild(videoDiv);
            viewCurrent = mainView;
        }
    });
    div.appendChild(trackElement);
}

function trackUnsubscribed(track) {
    track.detach().forEach((element) => {
        element.remove();
    });
}

function disconnect() {
    room.disconnect();
    if (chat) {
        chat.shutdown().then(() => {
            conv = null;
            chat = null;
        });
    }
    while (container.lastChild.id != "local")
        container.removeChild(container.lastChild);
    button.innerHTML = "Join call";
    if (root.classList.contains("withChat")) {
        root.classList.remove("withChat");
    }
    toggleChat.disabled = true;
    connected = false;
    updateParticipantCount();
}

function shareScreenHandler() {
    event.preventDefault();
    if (!screenTrack) {
        navigator.mediaDevices
            .getDisplayMedia()
            .then((stream) => {
                screenTrack = new Twilio.Video.LocalVideoTrack(stream.getTracks()[0]);
                room.localParticipant.publishTrack(screenTrack);
                screenTrack.mediaStreamTrack.onended = () => {
                    shareScreenHandler();
                };
                console.log(screenTrack);

                shareScreen.src = "/static/icons/sharescreen.png";
                $(shareScreen).attr("title", "stop screen sharing");
            })
            .catch(() => {
                alert("Could not share the screen.");
            });
    } else {
        room.localParticipant.unpublishTrack(screenTrack);
        screenTrack.stop();
        screenTrack = null;
        shareScreen.src = "/static/icons/x_sharescreen.png";
        $(shareScreen).attr("title", "screen share");
    }
}

function muteUnmute() {
    event.preventDefault();
    if (audioControl) {
        room.localParticipant.audioTracks.forEach((publication) => {
            publication.track.disable();
        });
        AudioControler.src = "/static/icons/x_mic.png";
        $(AudioControler).attr("title", "unmute");
        audioControl = false;
    } else {
        room.localParticipant.audioTracks.forEach((publication) => {
            publication.track.enable();
        });
        AudioControler.src = "/static/icons/mic.png";
        $(AudioControler).attr("title", "mute");
        audioControl = true;
    }
}

function connectChat(token, conversationSid) {
    return Twilio.Conversations.Client.create(token)
        .then((_chat) => {
            chat = _chat;
            return chat.getConversationBySid(conversationSid).then((_conv) => {
                conv = _conv;
                conv.on("messageAdded", (message) => {
                    addMessageToChat(message.author, message.body);
                });
                return conv.getMessages().then((messages) => {
                    chatContent.innerHTML = "";
                    for (let i = 0; i < messages.items.length; i++) {
                        addMessageToChat(messages.items[i].author, messages.items[i].body);
                    }
                    toggleChat.disabled = false;
                });
            });
        })
        .catch((e) => {
            console.log(e);
        });
}

function addMessageToChat(user, message) {
    chatContent.innerHTML += `<p><b>${user}</b>: ${message}`;
    chatScroll.scrollTop = chatScroll.scrollHeight;
}

function toggleChatHandler() {
    event.preventDefault();
    if (root.classList.contains("withChat")) {
        root.classList.remove("withChat");
    } else {
        root.classList.add("withChat");
        chatScroll.scrollTop = chatScroll.scrollHeight;
    }
}

function onChatInputKey(ev) {
    if (ev.keyCode == 13) {
        conv.sendMessage(chatInput.value);
        chatInput.value = "";
    }
}

const w = parseInt(canvasElement.width);
const h = parseInt(canvasElement.height);

function onResults(results) {
    canvasCtx.save();

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (plain) {
        canvasCtx.drawImage(
            results.image,
            0,
            0,
            canvasElement.width,
            canvasElement.height
        );
    } else {
        null;
    }

    if (results.multiHandLandmarks) {
        lmList_past = lmList;
        lmList = [];
        fingers = [];
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 1,
            });
            /*drawLandmarks(canvasCtx, landmarks, { color: "#FF0000", lineWidth: 1 });*/
            lmList = landmarks;
        }
        try {
            if (lmList[4].x < lmList[3].x) {
                fingers.push(1);
            } else {
                fingers.push(0);
            }
            for (let i = 1; i < 5; i++) {
                if (lmList[tipIds[i]].y < lmList[tipIds[i] - 2].y) {
                    fingers.push(1);
                } else {
                    fingers.push(0);
                }
            }
            if (lmList_past.length == 0) {
                x1 = w * lmList[8].x;
                y1 = h * lmList[8].y;
                x2 = w * lmList[8].x;
                y2 = h * lmList[8].y;
            } else {
                x1 = w * lmList_past[8].x;
                y1 = h * lmList_past[8].y;
                x2 = w * lmList[8].x;
                y2 = h * lmList[8].y;
            }
            if (
                fingers[0] == 1 &&
                fingers[1] == 1 &&
                fingers[2] == 1 &&
                fingers[3] == 1 &&
                fingers[4] == 1
            ) {
                erasex = w * lmList_past[20].x - x1;
                erasey = h * lmList_past[0].y - y1;
                draw.clearRect(x1, y1, erasex, erasey);
            } else if (fingers[1] == 1 && fingers[2] == 0) {
                if (Paint == true) {
                    LineDraw(draw, x1, y1, x2, y2);
                    LineDraw(canvasCtx, x1, y1, x2, y2);
                }
            }
        } catch (err) {
            null;
        }
    }
}

function LineDraw(draw, x1, y1, x2, y2) {
    draw.strokeStyle = colorPaint;
    draw.lineWidth = PaintSizeNum;
    draw.beginPath();
    draw.moveTo(x1, y1);
    draw.lineTo(x2, y2);
    draw.stroke();
}

AudioControler.addEventListener("click", muteUnmute);
button.addEventListener("click", connectButtonHandler);
shareScreen.addEventListener("click", shareScreenHandler);
leave.addEventListener("click", LeaveButtonfunction);

toggleChat.addEventListener("click", toggleChatHandler);
chatInput.addEventListener("keyup", onChatInputKey);

let shouldStop = false;
let stopped = false;
//const videoElement = document.getElementsByTagName("video")[0];
const downloadLink = document.getElementById("download");
const stopButton = document.getElementById("stop");
////////////////////////
function startRecord() {
    $(".btn-info").prop("disabled", true);
    $("#stop").prop("disabled", false);
    $("#download").css("display", "none");

    $("#record").text("Recording...");
}
//////////////////////////
function stopRecord() {
    $(".btn-info").prop("disabled", false);
    $("#stop").prop("disabled", true);
    $("#download").css("display", "block");
    $("#record").text("Record Screen");
    downloadLink.addEventListener("click", function() {
        $("#download").css("display", "none");
    });
}
const audioRecordConstraints = {
    echoCancellation: true,
};

stopButton.addEventListener("click", function() {
    shouldStop = true;
});

const handleRecord = function({ stream, mimeType }) {
    startRecord();
    let recordedChunks = [];
    stopped = false;
    const mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = function(e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
        }

        if (shouldStop === true && stopped === false) {
            mediaRecorder.stop();
            stopped = true;
        }
    };

    mediaRecorder.onstop = function() {
        const blob = new Blob(recordedChunks, {
            type: mimeType,
        });
        recordedChunks = [];
        const filename = window.prompt("Enter file name");
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = `${filename || "recording"}.webm`;

        stopRecord();
        //videoElement.srcObject = null;
    };

    mediaRecorder.start(200);
};

async function recordScreen() {
    const mimeType = "video/webm";
    shouldStop = false;
    const constraints = {
        video: {
            cursor: "motion",
        },
    };
    if (!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia)) {
        return window.alert("Screen Record not supported!");
    }
    let stream = null;
    const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
            cursor: "motion",
        },
        audio: {
            echoCancellation: true,
        },
    });
    if (window.confirm("Record audio with screen?")) {
        const audioContext = new AudioContext();

        const voiceStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
            },
            video: false,
        });
        const userAudio = audioContext.createMediaStreamSource(voiceStream);

        const audioDestination = audioContext.createMediaStreamDestination();
        userAudio.connect(audioDestination);

        if (displayStream.getAudioTracks().length > 0) {
            const displayAudio = audioContext.createMediaStreamSource(displayStream);
            displayAudio.connect(audioDestination);
        }

        const tracks = [
            ...displayStream.getVideoTracks(),
            ...audioDestination.stream.getTracks(),
        ];
        stream = new MediaStream(tracks);
        handleRecord({
            stream,
            mimeType,
        });
    } else {
        stream = displayStream;
        handleRecord({
            stream,
            mimeType,
        });
    }
    //videoElement.srcObject = stream;
}

////////////////////////////////////
function togglep() {
    event.preventDefault();
    if (participant_status) {
        toggle_participants.src = "/static/icons/x_participants.png";
        $(toggle_participants).attr("title", "show participants");
        MainScreen.style.left = "1%";
        participant_status = false;
        if (chatBoxStatus) {
            MainScreen.style.width = "79%";
        } else {
            MainScreen.style.width = "98%";
            MainScreen.style.right = "1%";
        }
    } else {
        toggle_participants.src = "/static/icons/participants.png";
        $(toggle_participants).attr("title", "hide participants");
        MainScreen.style.left = "20%";
        participant_status = true;
        if (chatBoxStatus) {
            MainScreen.style.width = "60%";
        } else {
            MainScreen.style.width = "79%";
        }
    }
}

function chatBox() {
    event.preventDefault();
    if (chatBoxStatus) {
        toggleChat.src = "/static/icons/x_chat.png";
        $(toggleChat).attr("title", "show chat");
        chatScroll.style.display = "none";
        if (participant_status) {
            MainScreen.style.width = "79%";
        } else {
            MainScreen.style.width = "98%";
            MainScreen.style.right = "1%";
        }
        chatBoxStatus = false;
    } else {
        toggleChat.src = "/static/icons/chat.png";
        $(toggleChat).attr("title", "hide chat");
        chatScroll.style.display = "inline";
        if (participant_status) {
            MainScreen.style.width = "60%";
        } else {
            MainScreen.style.width = "79%";
        }
        chatBoxStatus = true;
    }
}

toggle_participants.addEventListener("click", togglep);
toggleChat.addEventListener("click", chatBox);

const select_color = document.getElementById("colors");

function mycolor() {
    var x = document.getElementById("colors").value;
    if (x == "black") {
        colorPaint = "#000000";
        $("#current_color").css({ "background-color": "#000000" });
    } else if (x == "red") {
        colorPaint = "#FF0000";
        $("#current_color").css({ "background-color": "#FF0000" });
    } else if (x == "yellow") {
        colorPaint = "#FFFF00";
        $("#current_color").css({ "background-color": "#FFFF00" });
    } else if (x == "blue") {
        colorPaint = "#0000FF";
        $("#current_color").css({ "background-color": "#0000FF" });
    } else if (x == "green") {
        colorPaint = "#008000";
        $("#current_color").css({ "background-color": "#008000" });
    }
}
select_color.addEventListener("change", mycolor);
select_color.addEventListener("change", mycolor);

const select_bg = document.getElementById("bg");

function choose_bg() {
    event.preventDefault();
    if (plain) {
        plain = false;
        select_bg.innerHTML = "white";
    } else {
        plain = true;
        select_bg.innerHTML = "default";
    }
}
select_bg.addEventListener("click", choose_bg);

const attendance = document.getElementById("attendance");

function attendanceCheck() {
    event.preventDefault();
    let students = [
        ["Number", "Student Name"]
    ];
    let stundent_num = 1;
    let student_data;
    room.participants.forEach((participant) => {
        student_data = [stundent_num, participant.identity];
        students.push(student_data);
        stundent_num = stundent_num + 1;
    });
    console.log(students);

    let csvContent = "data:text/csv;charset=utf-8,";

    students.forEach(function(rowArray) {
        let row = rowArray.join(",");
        csvContent += row + "\r\n";
    });
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "attendance.csv");
    document.body.appendChild(link);
    link.click();
}
attendance.addEventListener("click", attendanceCheck);

const PaintSize = document.getElementById("PaintSizze");

function change_penSize() {
    event.preventDefault();
    PaintSizeNum = PaintSize.value;
}

PaintSize.addEventListener("change", change_penSize);

const clearScreen = document.getElementById("clear");

function clearAll() {
    event.preventDefault();
    draw.clearRect(0, 0, canvasDraw.width, canvasDraw.height);
}

clearScreen.addEventListener("click", clearAll);

const popupCloseButton = document.getElementById("popupCloseButton");

function closeDisplay() {
    $(".hover_bkgr_fricc").hide();
}

popupCloseButton.addEventListener("click", closeDisplay);