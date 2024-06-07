import AgoraRTC, { AudienceLatencyLevelType, IAgoraRTCRemoteUser, ICameraVideoTrack, ILocalAudioTrack, ILocalDataChannel, ILocalVideoTrack, IMicrophoneAudioTrack } from 'agora-rtc-sdk-ng';
import React, { useEffect, useState } from 'react'
import AgoraManager from '../utils/Agora';
import axios from 'axios';
import { useLocation } from 'react-router-dom';


const client = AgoraRTC.createClient({
    mode: "live",
    codec: "vp8",
    clientRoleOptions: {
      level: AudienceLatencyLevelType.AUDIENCE_LEVEL_ULTRA_LOW_LATENCY
    }
  });
const screenClient = new AgoraManager("rtc").client;

const { VITE_AGORA_APP_ID, VITE_AGORA_TOKEN, VITE_SERVER_URL } = import.meta.env;

function LiveStreaming() {
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
  const [userId, setUserId] = useState<number | null>(null);
  const [isRecord, setIsRecord] = useState(false);
  const [recordData, setRecordData] = useState<{sid: string | null, resourceId: string | null}>({sid: null, resourceId:null});
  const router = useLocation();
  
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

  useEffect(() => {
    console.log(router.search.slice(1),"**************dddd")

    if (router.search && router.search.slice(1)){
      axios.post(`${VITE_SERVER_URL}/verify/rec-auth`, null, {
        headers: {
          Authorization: `Bearer ${router.search.slice(1)}` 
        }
      })
    }
  },[])

  const token = VITE_AGORA_TOKEN;
  const agoraInit = async () => {
    // JOIN CHANNEL
    await client.join(VITE_AGORA_APP_ID, "newchannel", token, null);
    setUserId(client.uid as number)

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

  const joinAsHost = () => {
    client.setClientRole("host");
    agoraInit()
  }

  const joinAsAudience = async () => {
    client.setClientRole("audience");
    await client.join(VITE_AGORA_APP_ID, "newchannel", token, null);
    setUserId(client.uid as number)
  }

  const handleExit = () => {
    if (client.role === "host"){
        client.unpublish([localAudioTrack, localVideoTrack] as unknown as ILocalDataChannel);
        localAudioTrack?.close()
        localVideoTrack?.close()
    }
    client.leave()
    setUserId(null)
    setRemoteUsers([])
    setLocalVideoTrack(null)
  }

  const handleRecording = async (uid: number | null) => {
    // Acquire resource
    if (!isRecord){
      const res = await axios.post(`${VITE_SERVER_URL}/record/${uid}`,null, {headers: {
        "allow-origin":"*"
      }})
      console.log(res,"**********************resssssssss start")
      setIsRecord(res.data.success)
      setRecordData({sid: res.data.data.sid, resourceId: res.data.data.resourceId})
      
    }else{
      const res = await axios.post(`${VITE_SERVER_URL}/stop-record/${uid}/${recordData.resourceId}/${recordData.sid}`,null, {headers: {
        "allow-origin":"*"
      }})
      console.log(res,"**********************resssssssss stop")
      setIsRecord(!res.data.success)
    }
  }

  return (
    <>
      <div>Live streaming</div>
      {userId ? <>{client.role === "host" ? <><i
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
      <button onClick={() => handleRecording(userId)}>{isRecord ? 'Stop' : 'Start'} Recording</button>
      </> : null}
      {console.log(client.role,"****************roleeeeeeeeeeeeeeeeee", remoteUsers)}
      <div className="participants-parent">
        {client.role === "host" ? <div
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
        </div> : null}
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
      ) : null}</> : null}
      {
        !userId ? <><button onClick={joinAsHost}>join as host</button>
        <button onClick={joinAsAudience}>join as audience</button>
        </>
        : null
      }
      
      {userId ? <button onClick={handleExit}>leave</button> : null}

    </>
  );
}

export default LiveStreaming