import AgoraRTC, { IAgoraRTCClient, SDK_MODE } from "agora-rtc-sdk-ng";

class AgoraManager {
    client : IAgoraRTCClient;
    screenClient: any;
    constructor(mode: SDK_MODE){
        this.client = AgoraRTC.createClient({ mode, codec: "vp8" }); //rtc client
    }
}

export default AgoraManager;
