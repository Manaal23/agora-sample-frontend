import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  ILocalAudioTrack,
  ILocalVideoTrack,
  IMicrophoneAudioTrack,
} from "agora-rtc-sdk-ng";
import { useEffect, useState } from "react";
import AgoraManager from "../utils/Agora";

// const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" }); //rtc client
// const screenClient = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });
const client = new AgoraManager("rtc").client;
const screenClient = new AgoraManager("rtc").client;

const { VITE_AGORA_APP_ID, VITE_AGORA_TOKEN } = import.meta.env;

function Home() {
  const [localVideoTrack, setLocalVideoTrack] =
    useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] =
    useState<IMicrophoneAudioTrack | null>(null);
  const [screenLocalStream, setScreenLocalStream] = useState<
    ILocalVideoTrack | [ILocalVideoTrack, ILocalAudioTrack] | null
  >(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [audioStatus, setAudioStatus] = useState(true);
  const [videoStatus, setVideoStatus] = useState(true);
  const [screenShare, setScreenShare] = useState(false);

  client.on("user-published", async (user, mediaType) => {
    console.log(user, "***************azazazaz");
    await client.subscribe(user, mediaType);
    setRemoteUsers([...client.remoteUsers]);
  });

  client.on("user-joined", (usr) => {
    setRemoteUsers([...client.remoteUsers]);
    console.log(usr, "&&&&&&&&&&&&&7 5tttt");
  });
  client.on("user-left", () => {
    setRemoteUsers([...client.remoteUsers]);
  });

  const token = VITE_AGORA_TOKEN;
  const agoraInit = async () => {
    // JOIN CHANNEL
    await client.join(VITE_AGORA_APP_ID, "newchannel", token, null);

    const [localAudioTrack, localVideoTrack] =
      await AgoraRTC.createMicrophoneAndCameraTracks();

    setLocalVideoTrack(localVideoTrack);
    setVideoStatus(localVideoTrack.enabled);
    setLocalAudioTrack(localAudioTrack);
    setAudioStatus(localAudioTrack.enabled);

    client.publish([localAudioTrack, localVideoTrack]);
  };

  const toggleVideo = () => {
    if (localVideoTrack) {
      localVideoTrack.setEnabled(!localVideoTrack.enabled);
      setVideoStatus(() => !localVideoTrack.enabled);
    }
  };

  const toggleAudio = () => {
    if (localAudioTrack) {
      localAudioTrack.setEnabled(!localAudioTrack.enabled);
      setAudioStatus(() => !localAudioTrack.enabled);
    }
  };

  const shareScreen = async () => {
    if (screenShare) {
      await screenClient.unpublish(screenLocalStream as ILocalVideoTrack);
      (screenLocalStream as ILocalVideoTrack).stop();
      (screenLocalStream as ILocalVideoTrack).close();
      screenClient.leave();
      setScreenShare(false);
    } else {
      const screen = (await AgoraRTC.createScreenVideoTrack(
        {}
      )) as ILocalVideoTrack & { isScreenShared: boolean };
      setScreenShare(true);

      // screen.isScreenShared=true
      console.log(screen, "************Ererererere");

      await screenClient.join(VITE_AGORA_APP_ID, "newchannel", token, null);
      screenClient.publish(screen);
      setScreenLocalStream(screen);

      screen.on("track-ended", async () => {
        await screenClient.unpublish(screen);
        screen.stop();
        screen.close();
        screenClient.leave();
        setScreenShare(false);
        setScreenLocalStream(null);
      });
    }
  };

  useEffect(() => {
    agoraInit();
  }, []);

  return (
    <>
      <div>video - audio</div>
      <i
        className={`fa-solid fa-video${videoStatus ? "" : "-slash"}`}
        onClick={toggleVideo}
      ></i>
      <i
        className={`fa-solid fa-microphone${audioStatus ? "" : "-slash"}`}
        onClick={toggleAudio}
      ></i>
      <button onClick={shareScreen}>
        {screenShare ? "stop screen" : "share screen"}
      </button>

      <div className="participants-parent">
        <div
          id="local"
          style={{ width: "10em", height: "10em", background: "#000" }}
        >
          {localVideoTrack && (
            <div
              id={`stream_local`}
              ref={(node) => {
                if (node) {
                  localVideoTrack.play(node);
                }
              }}
              style={{ width: "100%", height: "100%" }}
            ></div>
          )}
        </div>
        {remoteUsers.map((i) => {
          return (
            <div
              id={`${i.uid}`}
              style={{ width: "10em", height: "10em", background: "#000" }}
            >
              <div
                id={`stream_${i.uid}`}
                ref={(node) => {
                  if (node) {
                    i["videoTrack"]?.play(node);
                    i["audioTrack"]?.play();
                  }
                }}
                style={{ width: "100%", height: "100%" }}
              />
            </div>
          );
        })}
      </div>
      {screenShare ? (
        <div
          className="screen-share-main"
          ref={(node) => {
            if (node) {
              (screenLocalStream as ILocalVideoTrack)?.play(node as any);
              console.log(screenLocalStream, "&&&&&&&&&&&&gggg");
            }
          }}
        ></div>
      ) : null}
    </>
  );
}
export default Home;
