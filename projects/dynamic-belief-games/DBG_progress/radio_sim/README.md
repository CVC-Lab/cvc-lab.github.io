# Radio Sim

Interactive, browser-based demo that shows everything that happens when voice travels from a microphone, through packetization and simulated RF, and back out of a receiver. The goal is to make the entire “voice → packets → RF → packets → voice” chain explorable with live visuals, stats, and failure injection controls.

## Highlights

- **Live audio capture** – uses Web Audio to sample the mic, slice frames, and feed either µ-law or PCM16 payloads.
- **Packet inspector** – every frame is wrapped in a header (version, flags, sequence, timestamp, payload length, CRC-16) and the raw bytes are displayed.
- **Channel simulator** – configurable delay, jitter, loss, and bit-flip probability so you can watch drops, corruption, and recovery.
- **Visualization panels** – TX/RX waveforms + spectra, RF preview (AM/FM/BPSK), packet grid, animated signal pipeline, waveform snapshots, and session statistics.
- **Top-down overview** – `overview.html` explains the radio “innards”, packet math, and the exact steps a frame goes through so you can narrate the demo professionally.

## Quick start

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` (or serve over HTTPS). Browsers only allow microphone capture from secure origins or localhost. Click **Start**, grant mic access, talk, and watch every panel react. Hit **Stop** to capture waveform snapshots and freeze the session stats.

## Controls & panels

- **Run controls** – start/stop buttons plus live readouts of audio sample rate, frame size, and packets-per-second.
- **Packetization** – set frame duration and codec (`G.711 µ-law` or raw `PCM16`).
- **RF visualization** – choose AM, FM, or BPSK preview and adjust the “carrier” frequency used for visualization.
- **Channel** – delay, jitter, packet loss %, and per-byte bit-flip % (simulates corruption that triggers CRC failures).
- **Receiver** – jitter-buffer depth and RX volume slider, plus counters for TX, RX, and dropped/corrupt packets.

Main panels:

| Panel | What it shows |
| --- | --- |
| TX waveform / spectrum | Raw mic waveform and FFT magnitude so you can see capture quality and bandwidth. |
| Packet grid | Recent packets (orange in-flight, green played, red dropped/corrupt). |
| RF preview | A kHz-scale carrier modulated by AM/FM or BPSK to visualize “voice riding on RF”. |
| RX waveform / spectrum | Output of the jitter buffer / decoder, proving reconstruction (or silence when frames are missing). |
| Signal pipeline | Animated stages from Mic → Frame → Codec → Packet → RF/Air → Sync/CRC → Jitter buffer → Decode/Speaker. Each packet gets its own color while in flight, turns green when played, or red when lost. |
| Session statistics | Runtime, frame/codec info, packets sent/played/dropped, loss %, average/max latency, and the current channel/jitter-buffer settings. |
| Waveform snapshots | PNG captures of the final TX and RX waveforms (auto-scaled with peak annotations) taken when you press Stop. |
| Packet details | Live header/payload hex dump of the most recent packet. |

## Packet format (demo)

```
| PREAMBLE (64 bits) | SYNC (32 bits) | HEADER (12 bytes) | PAYLOAD (voice bytes) | CRC-16 (2 bytes) |
```

Header fields (big-endian):

| Offset | Size | Field | Notes |
| --- | --- | --- | --- |
| 0 | 1 | version | currently `1` |
| 1 | 1 | flags | bit0 = codec, room for more |
| 2 | 2 | sequence | wraps at 65535 |
| 4 | 4 | timestamp | running sample counter |
| 8 | 2 | payload length | bytes |
| 10 | 2 | CRC-16 | CCITT, computed over header (except CRC) + payload |

Payload is either:

- `G.711 µ-law` – 1 byte per sample
- `PCM16` – 2 bytes per sample

Frame size defaults to 20 ms (960 samples at 48 kHz), so you see ~50 packets/s. Each packet contains one frame, but you can change frame duration in the UI to demonstrate how packet rate and latency trade off.

## Signal flow (mirrors the animated pipeline)

1. **Mic / ADC** – samples pulled from the mic worklet.
2. **Frame slicer** – 20 ms windows constructed in an AudioWorklet and transferred to the main thread.
3. **Codec** – µ-law companding (default) or raw PCM16 payloads.
4. **Packetizer** – header + payload + CRC-16; hex dump shown in the “Last packet” panel.
5. **RF preview** – AM/FM/BPSK baseband preview rendered for the selected carrier value.
6. **Channel** – delay + jitter + loss + byte-flip corruption. Dropped/corrupt packets are tracked in the grid, stats, and pipeline animation.
7. **Sync/CRC** – channelDeliver parses, checks CRC, and queues frames into the jitter buffer map.
8. **Jitter buffer & decoder** – periodic playout reorders by sequence, tracks latency per packet, applies simple PLC (silence) when missing, and sends audio to the RX AudioWorklet for playback.

The pipeline animation consumes these events so each packet token visibly steps through the blocks. Played packets turn green; corrupted/dropped packets go red; in-flight ones keep their unique color until they finish (or timeout).

## Stats, latency, and snapshots

- **Latency** – measured from packet creation to playback; average and max latency are displayed live.
- **Loss %** – computed from dropped/corrupt counts divided by TX packets.
- **Waveform capture** – when Stop is pressed, the most recent TX and RX waveforms are rendered into PNG snapshots with automatic peak scaling (so they’re never “flatlined” even if the signal was quiet).

## Top-down overview page


---

