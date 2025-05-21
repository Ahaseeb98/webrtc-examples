# 📞 React Native WebRTC Video Call App

A real-time video calling app built with **React Native**, **TypeScript**, **Socket.IO**, and **WebRTC**, featuring Android call UI via **React Native CallKeep**.

## 🚀 Features

- 📹 One-on-one video calling  
- 🎙️ Mute/unmute microphone  
- 🔄 Switch front/back camera  
- ⚡ Real-time signaling via Socket.IO  
- 🔌 Peer-to-peer media connection using WebRTC  
- ☎️ Native Android call UI with CallKeep  
- 💡 Fully typed with TypeScript  

## 🛠️ Tech Stack

- React Native (CLI)
- TypeScript
- WebRTC (`react-native-webrtc`)
- Socket.IO (Client + Server)
- React Native CallKeep (Android only)

## 📦 Installation

Clone the repository:

```bash
git clone https://github.com/Ahaseeb98/webrtc-examples.git
cd webrtc-examples
```

Install dependencies:

```bash
yarn install
```

(Optional) Install iOS pods:

```bash
cd ios && pod install && cd ..
```

Run the app:

```bash
npx react-native run-android
```

## 🔌 Backend

This app uses a **Socket.IO signaling server** to exchange call data (offer, answer, ICE candidates) between peers. A simple Node.js server is sufficient.

## 📲 Platform Support

| Feature               | Android | iOS    |
|-----------------------|---------|--------|
| WebRTC Video Calls    | ✅      | ✅     |
| Socket.IO Signaling   | ✅      | ✅     |
| CallKeep Integration  | ✅      | ❌     |
| Mute / Switch Camera  | ✅      | ✅     |

## ✅ Completed

- ✅ One-on-one video calling  
- ✅ Mute/unmute microphone  
- ✅ Switch front/rear camera  
- ✅ CallKeep on Android  

## 🚧 TODO

- [ ] iOS support for CallKeep  
- [ ] Push notification integration  
- [ ] Call logs and history UI  
- [ ] Group calls  

## 📄 License

This project is open-source and available under the MIT License.

---

## 👨‍💻 Author

Made with ❤️ by [Abdul Haseeb](https://github.com/Ahaseeb98)
