---
title: "How macOS High Performance Screen Sharing Works"
seoTitle: "macOS High Performance Screen Sharing Protocol: VNC, SRTP, and HEVC 4:4:4"
description: "How is macOS High Performance screen sharing different from regular VNC? A walk through its authentication, encryption, video transport, and loss recovery."
keywords: ["macOS High Performance screen sharing", "High Performance screen sharing protocol", "macOS Screen Sharing protocol", "Apple VNC protocol", "RFB protocol", "SRTP video streaming", "HEVC 4:4:4", "macOS screen sharing vs VNC"]
sourceHash: "ba353b5a77f8b789497b44e1023c90d9e649508ce26ff6c8fd62766574b0cf02"
translationStatus: machine
---

## What Is macOS High Performance Screen Sharing?

macOS High Performance screen sharing is a screen sharing mode Apple introduced in 2023 with macOS Sonoma 14. According to [Apple's macOS Sonoma announcement](https://www.apple.com/newsroom/2023/06/macos-sonoma-brings-new-capabilities-for-elevating-productivity-and-creativity/), it uses the media engine in Apple silicon to support low-latency audio, high frame rates, and virtual displays.

I wrote this post to share how Apple's unpublished High Performance screen sharing protocol works. By the end, you will know how it differs from regular VNC and what path a Mac's screen takes before it is drawn on another device.

I built a client that speaks this protocol myself, and this post is based on the behavior I saw on October 15, 2026. At the time, the Mac was running macOS 27.0.1, and the client device, an iPad Pro 13-inch (M4), was running iPadOS 27.0.1. Only horizontal scrolling was checked on October 26, on a single Mac running macOS 27.0.1 that ran both the client and the server.

The protocol differs slightly between macOS builds, so the details here may change as macOS changes.

## VNC and RFB

VNC is a way to view and control another computer's screen remotely, and the rules the two sides follow are the RFB protocol, standardized in [RFC 6143](https://www.rfc-editor.org/rfc/rfc6143). macOS Screen Sharing is also a VNC server, so you can connect to a Mac with third-party VNC apps too.

RFB carries everything over a single TCP connection.

- **Server → client**: When the client asks, the server compresses and sends the pixels of the rectangles that changed on screen.
- **Client → server**: The client sends keyboard and mouse input.

This works well for still screens like documents and menus, but two things get in the way on screens that keep changing, like video.

- **Volume**: A video codec finds what moved since the previous frame and sends only the difference, while RFB compresses and sends the changed pixels themselves.
- **Waiting**: TCP makes sure data arrives complete and in order, but when one packet is lost, everything behind it waits until that packet arrives again.

As soon as you connect, the Mac's Screen Sharing server introduces itself as version `RFB 003.889`. The last standard RFB version is 3.8 (`003.008`), so when the client sees the nonstandard `003.889`, it knows the other side is a Mac with Apple's own additions. High Performance screen sharing also starts on this TCP connection.

## Splitting the Connection in Two

High Performance screen sharing doesn't throw away the RFB connection; it shrinks its role. The TCP connection stays on as a control channel for authentication, input, and other control, while video and audio arrive separately over UDP, which doesn't wait for lost packets.

![Diagram showing what each of the TCP 5900, UDP 5901, and UDP 5900 connections between the Mac and the client carries](./connection.en.svg?w=720 "TCP 5900 carries control, UDP 5901 carries video, and UDP 5900 carries audio and the client's requests")

|  | Regular VNC (RFB) | High Performance screen sharing |
|---|---|---|
| Connections | One TCP | One TCP and two UDP |
| Screen | Pixels of changed rectangles | Video compressed with a video codec (HEVC) |
| When packets are lost | TCP resends them | Recovers by receiving a complete picture again |
| Audio | Not in the standard | AAC-ELD stereo |
| Screen size | The Mac's actual display | The actual display, or a virtual display fitted to the client |

The connection opens in this order, and the sections below explain the names in the diagram and table in the same order.

1. Connect over TCP and authenticate with a macOS account.
2. Encrypt the TCP control channel.
3. Agree on how video and audio will be sent and which keys will encrypt them.
4. Video and audio start arriving over UDP.

## Authenticating with an Account

The Mac offers four authentication methods, each identified by a number (its security type), and the client I built uses type 30, ARD authentication (Apple Remote Desktop authentication). Instead of a VNC-only password, it logs in with the Mac's user name and password.

ARD authentication starts with a :term[Diffie-Hellman key exchange]{key="diffie-hellman"}. It lets the server and client arrive at the same secret value, known only to the two of them, while exchanging only values that are safe to make public. The client uses the MD5 :term[hash]{key="hash"} of this secret as an AES key and sends the user name and password encrypted with it.

This hides the password from anyone who only eavesdrops. However, because the client doesn't verify that it is really talking to that Mac, this method can't stop a man-in-the-middle attack, where an attacker poses as the Mac. That attacker ends up sharing a key with the Mac and another with the client, so it can also unwrap the keys exchanged later under these keys and see the screen and input.

The Mac also offers types 33 and 36, which use a method called SRP to have both sides confirm to each other that they know the same password.

## Encrypting the Control Channel

Once authentication is done, the client introduces itself as if it were Apple's Screen Sharing app and asks to start encryption. The introduction includes the app version, the OS version, and a list of supported features.

The server answers with a new AES key and an initialization vector (IV), the starting value mixed in when the first block is encrypted. Both values are encrypted with the key made during authentication, so an eavesdropper can't read them. From then on, every message, from input and cursor shapes to screen size changes and the clipboard, is encrypted with the new key.

Each encrypted message is called a record, and a record is built in this order.

1. Append to the message a SHA-1 hash computed from the record sequence number and the message contents.
2. Encrypt the result with AES-128-CBC. CBC mixes the previous block's ciphertext into each block, and on this channel the chain carries across records, continuing from the previous record's ciphertext.

Because the hash with the sequence number in it is encrypted as well, if someone without the key drops or reorders records in transit, it is detected right away.

## Agreeing on Video and Audio

Once the control channel is encrypted, the client proposes how it wants to receive video and audio. A proposal contains the following.

- **Four encryption keys**: One key each for the server → client and client → server directions, for both video and audio. The client generates new random keys on every connection.
- **Video settings**: Candidate codecs, plus the number of bands and whether to use long-term reference frames, both covered later
- **Audio settings**: The desired audio bitrate (the amount of data sent per second)
- **Client information**: Device model, OS build, and client name

The server answers with the video size and the number of bands, carried in the standard RFB framebuffer update message.

Because the keys were already handed over on the encrypted control channel, no keys are exchanged on the UDP side. As soon as the server sends its answer, it starts sending video encrypted with those keys over UDP.

The client information changes the frame rate. If the client reports an iPad model (`iPad16,6`) and an iPadOS build, the server caps it at 30fps; if it reports a Mac model (`Mac16,5`) and a macOS build, the server sends 60fps. I don't know yet whether the model or the build is what decides it.

## Receiving Video and Audio over UDP

### UDP and SRTP

Unlike TCP, UDP doesn't resend lost packets or guarantee arrival order. In exchange, losing one packet doesn't make the video and audio behind it stop and wait, and the client and server decide when and how to recover.

Video arrives on UDP port 5901 and audio on UDP port 5900. The [Apple Remote Desktop User Guide](https://support.apple.com/guide/remote-desktop/apdf8e09f5a9/mac) says UDP ports 5900 through 5902 must be reachable. However, if the client doesn't request a second video stream, ports 5900 and 5901 are enough.

On top of UDP, the standard :term[RTP]{key="rtp"} ([RFC 3550](https://www.rfc-editor.org/rfc/rfc3550)) tags each packet with a sequence number, a timestamp, and a stream ID (SSRC). The receiver uses sequence numbers to notice missing packets and SSRCs to tell which stream a packet belongs to.

High Performance screen sharing wraps this in SRTP ([RFC 3711](https://www.rfc-editor.org/rfc/rfc3711)), the standard encryption scheme for RTP.

- **Encryption**: The RTP header is left as is, and only the content after it is encrypted with AES-256 ([RFC 6188](https://www.rfc-editor.org/rfc/rfc6188)).
- **Tamper protection**: An HMAC-SHA1 value is attached so that packets made without the key are rejected.

### HEVC 4:4:4

The default video codec is HEVC (H.265), and specifically its 4:4:4 format, which keeps color at full resolution.

Video usually stores brightness and color separately and uses 4:2:0, which stores color at only half the resolution horizontally and vertically. Human eyes are less sensitive to changes in color than in brightness, so this is hard to notice in movies, but in screen sharing the edges of colored text and thin lines look smeared. 4:4:4 stores color at the same resolution as brightness, so even small text stays sharp.

However, on PCs, depending on the GPU and the decoding API, HEVC 4:4:4 often can't be decoded in hardware. Such clients can change the candidate codecs in the proposal and receive H.264 4:2:0 video instead.

The way HEVC video is split across RTP packets is a slightly modified version of the standard ([RFC 7798](https://www.rfc-editor.org/rfc/rfc7798)), so a receiver that follows the standard as written gets broken video.

### The Screen in Four Bands

The server splits the screen into four horizontal bands and creates a separate RTP stream for each. The four streams get consecutive SSRCs, with the lowest number for the top band. The number of bands usually follows the value the client put in its proposal.

![Diagram showing the four bands of the Mac screen sent as separate SSRC streams into one decoder, then stacked again on the client screen](./tiles.en.svg?w=720 "The bands arrive as four streams, but only one decoder is used")

A :term[keyframe]{key="keyframe"}, a frame that doesn't reference any other frame, arrives only in the top band, and the other bands are built by referencing frames in other bands. Because the four bands can't be decoded separately, the client feeds all four streams into a single decoder. The decoded bands are stacked from the top to form one screen.

### Audio

Audio arrives as 48kHz stereo AAC-ELD, a codec used where latency must be low, such as calls. Each packet holds 10ms of audio, 100 packets arrive per second, and silent packets keep coming even when there is no sound.

## Recovering Lost Packets

To get lost packets back, the client has to ask the server. Requests are sent as RTCP, RTP's companion protocol, to UDP port 5900, and RTCP is encrypted the same way as SRTP (SRTCP).

The client mainly sends three kinds of RTCP to the server.

- **Receiver reports**: Tell the server how much was lost and how much the arrival intervals jitter.
- **Loss notifications**: Report the sequence numbers of lost packets so the server can resend them.
- **Keyframe requests**: Ask for a new keyframe.

A video codec builds most frames from the difference with the previous frame, so losing one frame means later frames can't be decoded properly until the next keyframe arrives. Apple's video decoding framework (VideoToolbox) also rejects every frame until the next keyframe when a reference frame is missing.

In HEVC video, the server doesn't resend packets even after a loss notification, so the client requests a keyframe as soon as it sees a gap in the sequence numbers.

Each keyframe request bundles the older format that Apple's Screen Sharing app uses ([RFC 2032](https://www.rfc-editor.org/rfc/rfc2032)) with the newer one, because it isn't certain that the server always responds to the newer format too.

Over a VPN link carrying about 2,600 packets per second, losses were frequent. Here is how long keyframe recovery took.

- Keyframes arrived within 25–35ms of the request.
- Recovering from a loss took a median of 0.07 seconds and at most 0.6 seconds.

The proposal also includes a recovery method other than keyframes, called long-term reference frames (LTR). Once the client has told the server "this frame arrived intact," the server can, after a loss, build the next frame by referencing that frame instead of sending a keyframe.

However, with HEVC video, the server did not use a long-term reference frame to recover even when the client waited 300ms after a loss. Among the candidate codecs in the proposal, only H.264 is flagged for long-term reference frames, so HEVC may simply not use this method.

## Input and Cursor

### Keyboard and Mouse

All input is sent over the TCP control channel.

- **Keyboard**: Uses the standard RFB key event as is. Pressed keys are sent as key numbers defined by X11 (keysyms), and Unicode characters such as Korean are typed by sending `0x01000000` plus the character's Unicode code point.
- **Mouse**: Uses a separate message Apple designed, and the part holding the coordinates and buttons is encrypted once more before it goes into a record. The right and middle button numbers are also swapped relative to the RFB standard.
- **Scroll**: Vertical scrolling is sent as presses and releases of virtual buttons 4 and 5, as in the RFB standard. One scroll event moves the Mac screen by only 1 pixel, so about 12 events are bundled per wheel notch.

Horizontal scrolling is sent as buttons 6 and 7, the slots right after buttons 4 and 5, in Apple's mouse message, and each event scrolls by the same amount as a vertical one. However, if you send the same buttons in the standard RFB mouse message during High Performance screen sharing, the Mac takes them as extra button clicks. I have not yet checked on screen which of the two buttons scrolls left.

A Mac with a Retina display lays out the screen at a logical size and actually draws it with twice as many pixels horizontally and vertically (for example, a screen that looks like 1512×982 is drawn at 3024×1964 pixels). Mouse coordinates are based on the actual pixels, not this logical size.

### Cursor

The server sends the cursor shape over TCP separately from the video, and the client draws that shape at its own pointer position. Even when video arrives late, the cursor moves right away. The proposal also includes a flag asking the server not to draw the cursor into the video.

Each cursor shape is sent once with a number, and when the same shape is needed again, only the number is sent.

## Virtual Displays Fitted to the Client

If the client reports the logical size and pixel size of the screen it wants when it connects, the Mac creates a virtual display of that size and sends it as video. If not, the Mac sends its actual display as is. According to Apple's documentation, when you connect as the user who is logged in on the Mac, the displays connected to the Mac are blanked.

Changing the size after connecting works like this.

1. The client sends the new size.
2. The server reports the changed display layout.
3. The client sends the video and audio proposal again. If this step is skipped, the server stops encoding, and the screen goes black and stays that way.
4. The server starts sending video again with new SSRCs and a new keyframe.

The scale and frame rate of the display depend on the requested size.

- The display becomes a Retina display only when the pixel size is twice the logical size; anything other than 2×, such as 1.72×, becomes a 1× display at the logical size.
- Apple's documentation lists the maximum virtual display size as 4K (3840×2160). However, if the client sends a maximum size of 5120×2880, the Mac also accepts larger sizes such as 3840×2880.
- The catch is that even when the client reports a Mac model to get 60fps, large sizes drop to 30fps. 3200×2400, with fewer pixels than 4K, runs at 60fps, while 3840×2880, with more pixels than 4K, runs at 30fps.
- Even if the client requests 120Hz, the frame rate doesn't go above 60fps.

## Disconnecting

There is no goodbye message when a connection ends, so the client ends the session by closing the TCP connection. A TCP connection can be closed by announcing "I'm done sending" (FIN) or cut off immediately (RST), and with High Performance screen sharing the two lead to different results.

Closing with FIN keeps the finished session's video coming, while closing with RST stops it immediately. That's because the server takes about 75 seconds after receiving FIN to clean up its encoder.

## Closing Thoughts

macOS High Performance screen sharing splits into two paths. The TCP side is a control channel that adds Apple's own authentication, encryption, and messages to RFB. Video and audio arrive over UDP on standards such as RTP, SRTP, and RTCP.

The video is HEVC packed into packets Apple's way, and it arrives in four bands. The client decodes the four bands with a single decoder and recovers from packet loss with keyframes instead of retransmission.

What has bothered you most when using a Mac remotely?

:::see-also
- [docs] [Apple Remote Desktop User Guide: Use High Performance screen sharing](https://support.apple.com/guide/remote-desktop/apdf8e09f5a9/mac)
- [article] [macOS Sonoma brings new capabilities for elevating productivity and creativity](https://www.apple.com/newsroom/2023/06/macos-sonoma-brings-new-capabilities-for-elevating-productivity-and-creativity/)
- [repo] [iShareScreen](https://github.com/renegadelink/iShareScreen)
- [docs] [iShareScreen: Apple VNC extension specification](https://github.com/renegadelink/iShareScreen/blob/main/docs/apple_vnc_rfc.md)
- [docs] [RFC 6143: The Remote Framebuffer Protocol](https://www.rfc-editor.org/rfc/rfc6143)
- [docs] [RFC 3550: RTP](https://www.rfc-editor.org/rfc/rfc3550)
- [docs] [RFC 3711: SRTP](https://www.rfc-editor.org/rfc/rfc3711)
- [docs] [RFC 6188: The Use of AES-192 and AES-256 in SRTP](https://www.rfc-editor.org/rfc/rfc6188)
- [docs] [RFC 2032: RTP Payload Format for H.261](https://www.rfc-editor.org/rfc/rfc2032)
- [docs] [RFC 7798: RTP Payload Format for HEVC](https://www.rfc-editor.org/rfc/rfc7798)
:::
