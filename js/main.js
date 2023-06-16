// API
const API_KEY = "";
const URL = "https://api.openai.com/v1/chat/completions";

const face = {};
let intervalId = null;
let happyCounter = 0;

const cameraArea = document.getElementById("cameraArea");
const camera = document.getElementById("camera");
const canvas = document.getElementById("canvas");
const emotion = document.getElementById("emotion");
const ctx = canvas.getContext("2d");
const canvas_W = 640;
const canvas_H = 480;
const intervalTime = 500;
const emotionText = [":)", ":|"];

setCanvas = () => {
  canvas.width = canvas_W;
  canvas.height = canvas_H;
};

const setCamera = async () => {
  let constraints = {
    audio: false,
    video: {
      width: canvas_W,
      height: canvas_H,
      facingMode: "user",
    },
  };
  return navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
      // ビデオ要素がストリームを再生できるようになる
      camera.srcObject = stream;
      // メタデータ（ストリームの基本的な情報、例えば持続時間や寸法など）
      // が読み込まれた後、ビデオの再生が開始
      camera.onloadedmetadata = (e) => {
        camera.play();
      };
    })
    .catch((err) => {
      console.log(err + "エラーです");
    });
};

// スタートボタンを押したときの処理
const start_btn = () => {
  happyCounter = 0;
  // intervalTimeごとにcheckFaceを繰り返し実行する
  intervalId = setInterval(async () => {
    // キャンバスの描画をクリア
    canvas.getContext("2d").clearRect(0, 0, canvas_W, canvas_H);
    await checkFace();
  }, intervalTime);
};

// ストップボタンを押したときの処理
const stop_btn = () => {
  console.log(intervalId);
  if (intervalId !== null) {
    // setIntervalの停止
    clearInterval(intervalId);
    // キャンバスの描画をクリア
    canvas.getContext("2d").clearRect(0, 0, canvas_W, canvas_H); // Clear the canvas
    intervalId = null;
  }
};

// 顔の位置を検出し、緑線を描画
const setDetection = (faceData) => {
  console.log(faceData);
  let box = faceData[0].detection.box;
  console.log(box);
  let x = box.x;
  let y = box.y;
  let w = box.width;
  let h = box.height;

  console.log(x, y, w, h);
  // 顔に緑線を描画
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.strokeStyle = "#76FF03";
  ctx.lineWidth = 2;
  ctx.stroke();
};

const setExpressions = (faceData) => {
  let happy = faceData[0].expressions.happy;
  let color = happy * 150 + 100;
  emotion.style.bottom = (canvas_H - 40) * happy + "px";
  emotion.style.backgroundColor = `rgb(${color}, ${color}, 100)`;

  if (happy >= 0.85) {
    emotion.innerHTML = emotionText[0];
    happyCounter++;

    let target_View = document.getElementsByClassName("targetView")[0];
    target_View.innerHTML = happyCounter;
    $(".targetView").text(happyCounter);
    if (happyCounter >= 5) {
      console.log("おめでとう");
      $("#request_text").val("笑顔を5回作れました");
    }

    // キャンバスをクリアし、0.5秒後にsetDetection関数を実行
    ctx.clearRect(0, 0, canvas_W, canvas_H);
    setTimeout(() => {
      setDetection();
    }, 500);

    // happyが0.85以下の場合は ":|" を表示
  } else {
    emotion.innerHTML = emotionText[1];
  }
};

const checkFace = async () => {
  // カメラ映像から顔を検出
  let faceData = await faceapi
    .detectAllFaces(camera, new faceapi.TinyFaceDetectorOptions())
    .withFaceExpressions();

  // 顔が1つ以上検出された場合
  if (faceData.length) {
    console.log("ここまで");
    setDetection(faceData);
    setExpressions(faceData);
  }
};

// キャンバスの設定、カメラのセットアップ、
// AIモデルの非同期ロードを順に実行する
async function init() {
  setCanvas();
  await setCamera();
  await faceapi.nets.tinyFaceDetector.load("js/weights/");
  await faceapi.nets.faceExpressionNet.load("js/weights/");

  return {
    startExpression: start_btn,
    stopExpression: stop_btn,
  };
}

async function btnControl() {
  let initialize = await init();

  $(".start").on("click", function () {
    initialize.startExpression();
    $(".status").removeClass("disable");
  });

  $(".stop").on("click", function () {
    initialize.stopExpression();
    $(".status").addClass("disable");
  });
}

btnControl();

function reply1() {
  $("#response_text").val("");
  var text = document.getElementById("request_text").value;
  async function getResponse() {
    try {
      const response = await axios.post(
        URL,
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "関西弁で話して" },
            { role: "system", content: "発言の最後に「知らんけど。」をつけて" },
            { role: "user", content: text },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      var chatgpt_response = response.data.choices[0].message.content;
      $("#response_text").val(chatgpt_response);
    } catch (error) {
      console.log(error);
    }
  }
  getResponse();
}

function reply2() {
  $("#response_text").val("");
  var text = document.getElementById("request_text").value;
  async function getResponse() {
    try {
      const response = await axios.post(
        URL,
        {
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: "お姉さん口調で話して" },
            {
              role: "system",
              content: "発言の最後に「今日もかわいいよ！」をつけて",
            },
            { role: "user", content: text },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
          },
        }
      );
      var chatgpt_response = response.data.choices[0].message.content;
      $("#response_text").val(chatgpt_response);
    } catch (error) {
      console.log(error);
    }
  }
  getResponse();
}
