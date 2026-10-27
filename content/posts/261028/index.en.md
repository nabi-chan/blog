---
title: "Can Call Transcription Move to Local STT?"
seoTitle: "Local Speech-to-Text for Korean Phone Calls: Whisper vs Qwen3-ASR, pyannote, CLOVA Speech"
description: "Can local STT on a Mac Studio replace CLOVA Speech for Korean calls? Whisper vs Qwen3-ASR, judged by the to-dos, promises, and names my AI assistant extracts."
keywords: ["local speech to text", "Korean speech recognition", "Whisper Korean accuracy", "Qwen3-ASR Korean", "WhisperKit vs Whisper", "pyannote speaker diarization", "CLOVA Speech alternative", "phone call transcription", "Whisper initial_prompt", "Qwen3-ASR vs Whisper"]
sourceHash: "b50de6a0881cff5784cb696d80b760fa91997f7c49a5ddf9858e6e44d530e9b4"
translationStatus: machine
---

## What Is Local STT?

Local STT is speech recognition that runs on my own computer instead of an outside service. I wanted to move :term[transcription]{key="transcription"} of my call recordings from CLOVA Speech to local STT on a Mac Studio, so I tested it over two days, October 26 and 27, 2026.

To give the conclusion first: to-dos and appointments came out almost the same from the start after switching to local, and promises got close to CLOVA Speech once I fixed :term[speaker diarization]{key="speaker-diarization"}.

Names of people, however, did not keep up with CLOVA Speech even when I changed engines. After settling on Qwen3-ASR as the engine and also fixing the rules for linking names and the yardstick for comparison, the gap shrank to 0.8 percentage points on the answer key I corrected by listening myself. Still, 25 calls cannot separate even a gap of about 10 percentage points, and the local setup was still lower on the other answer keys and on long calls.

I wrote this post to share what stayed the same and what else I had to fix when moving call transcription to local. By the end, you will know which local engine did better on Korean calls, what to measure the gap against, and how the same name hints behave differently from one engine to another.

There are three reasons I want to move away from CLOVA Speech.

- **Cost**: Speech recognition plus speaker diarization costs 28 KRW per minute, and the bill grows with the number of calls.
- **Sending data out**: I wanted to cut a step where call recordings go to an outside service. Even with local STT, the transcripts are still read by Codex, as they are today.
- **Outside dependence**: I wanted call processing to rely less on how an outside service is doing.

## How Calls Are Processed Today

Iroha is a personal assistant I built with Hermes Agent. I described the full setup in [Hermes Agent: Building a Personal AI Assistant](/261021-hermes-agent-personal-assistant); here I summarize only the part that handles calls.

1. When the phone records a call, an upload app I built puts the recording file on Google Drive.
2. call-ingest, a program I built, downloads the recording and transcribes it with [CLOVA Speech](https://api.ncloud-docs.com/docs/ai-application-service-clovaspeech). CLOVA Speech also does speaker diarization, which splits out who spoke when.
3. Iroha reads the transcript and handles it along two branches.

- **The immediate branch**: Summarizes the call, pulls out facts, promises, and appointments, registers to-dos and appointments, and posts to Slack.
- **The context branch**: Links the people, companies, and projects in the call to existing entries in the context records, and stores promises and facts.

The context records keep, for each person and company, the various spellings that have appeared in transcripts as aliases. To make linking names easier for Iroha, the program that manages the context records picks up to 15 existing people and companies whose aliases appear verbatim in the transcript and hands them over as candidates.

What I changed in the test is step 2, the transcription. Locally, a speech recognition model writes down what was said, and [pyannote](https://huggingface.co/pyannote/speaker-diarization-community-1) handles speaker diarization separately. Every transcribed word needs a timestamp so it can be matched with the diarization result to show who said what.

![Flow diagram of call recordings going through the upload app, call-ingest, and CLOVA Speech to Iroha, then splitting into the immediate branch and the context branch](./call-flow.en.svg?w=720 "Thick borders mark Iroha; gray boxes are programs I built. In the test, I replaced CLOVA Speech inside the dashed box with local STT")

## How I Compared

### Success Criteria and Baseline

The transcript is only an intermediate result that Iroha reads, so I defined success as whether what Iroha pulled out looked like what it pulled out with CLOVA Speech.

- **The immediate branch**: The number and content of to-dos and appointments to register. I had Iroha answer with "what Iroha would have registered" instead of actually registering anything, and an AI compared the two results side by side for content.
- **The context branch**: The names of people, companies, and projects it linked, and the number of promises. A promise is something someone in the call said they would do; the ones I said I would do were counted separately as "my own promises."

Even with the same transcript, the language model (LLM) Iroha uses gives slightly different results each time, so I ran extraction once more on the same CLOVA Speech transcripts and used that as a baseline. "CLOVA rerun" in the table below is that baseline. Because it is a single extra run, it only roughly shows how much the results wobble.

### The Answer Key for Linked Names

For the names of people and companies, I built a separate answer key and scored against it.

1. I ran extraction three times on the CLOVA Speech transcripts and took the people and companies picked by at least two of the three runs as the answer key. In this post I call this answer key the "CLOVA Speech consensus."
2. For names where the local setup with all fixes applied (in this post, the "final local setup") and the CLOVA Speech side disagreed, I cut a few seconds around where the name came up and transcribed them again without hints using three engine families (Qwen3-ASR, Whisper, and Cohere Transcribe). If two or more wrote the name with the same spelling, I treated it as actually said (the vote).
3. Names the vote could not settle, I decided by listening myself.

When I listened, I put the 6 seconds where the name came up, the 16 seconds around it, both sides' transcripts, and the vote result on one screen. I was the only listener, and the screen also showed which transcript came from which side.

When scoring against the CLOVA Speech consensus, I kept the run being scored out of building the answer key: each CLOVA Speech run was scored against the names picked together by the other two runs. For the local side, I built an answer key from each of the three pairs of CLOVA Speech runs, scored against each, and averaged.

The corrected answer key starts from names picked by at least two of the three CLOVA Speech runs, and only the disputed names were fixed through the vote and listening. CLOVA Speech runs were therefore scored against an answer key they helped build, and measuring any setup other than the final local setup against this answer key puts it at a disadvantage.

- **Recall**: The share of people and companies in the answer key that a run picked
- **Extras**: The number of names (projects included) a run picked across the 25 calls that appear in neither of the CLOVA Speech runs used to build the answer key

The CLOVA Speech consensus counts only people and companies already in the context records, while the answer key corrected by the vote and listening also includes newly appearing people. Projects were left out of recall because each run names them differently.

I changed this yardstick three times during the test. At first I used a single CLOVA Speech extraction as the answer key, then added the consensus, the vote, and listening in turn.

Every change came after I had seen the local setup fall short, and the reason for each change was that CLOVA Speech extraction also wobbles from run to run and can put wrong names into the answer key. In "Results After the Fixes" below, I lined up all four values, from the consensus answer key to the answer key corrected by listening.

### Transcript Metrics

I compared the transcripts themselves in three ways.

- **Character difference**: The number of characters that differ from the CLOVA Speech transcript (edit distance), ignoring spaces and punctuation, divided by the number of characters in the CLOVA Speech transcript. Differences in how numbers and English words were written were also counted as differences.
- **Repeats**: The number of stretches where the same words were repeated
- **Name hits**: The number of person and company names that Iroha linked from the CLOVA Speech transcripts and that appear verbatim in the local transcript

Counted per call, the names add up to 77 across the 25 calls. I counted only names that were hit and did not count names that were wrongly inserted. Even the CLOVA Speech transcripts contained only 33 of these 77 verbatim. Iroha linked the rest from context and candidates.

### Sample and Environment

The sample is 10 calls of 15 minutes or longer (221 minutes in total) and 15 calls shorter than 15 minutes. Of the 5,387 calls collected from July 11, 2025 to October 26, 2026, 96% are shorter than 15 minutes and 36% are shorter than one minute. The long calls were picked at random (22 minutes on average, the longest 42.7 minutes), and the short calls were picked three each from five length bands.

Twenty-five calls is a small sample. The thresholds and rules that come later were also chosen by looking at these 25 calls and measured on the same 25 calls, and every number below was measured on these 25 calls.

The test only read production records and ran separately from production. For the context records, I used a copy with the traces left by the tested calls removed.

- **Machine**: Mac Studio (Apple M1 Max, 64GB memory), macOS 27.0.1
- **Speech recognition server**: [oMLX](https://github.com/jundot/omlx) 0.7.2 (bundled [mlx-audio](https://github.com/Blaizzy/mlx-audio) 0.4.3)
- **Speaker diarization**: pyannote.audio 4.0.7, speaker-diarization-community-1
- **Extraction**: Hermes Agent v0.22.2, with the same Codex as production

## Results by Model

### Whisper large-v3 and turbo

First, I transcribed the 10 long calls with OpenAI's Whisper large-v3 and large-v3-turbo on oMLX. Turbo is large-v3 with the part that generates text (the decoder) cut from 32 layers to 4. This table compares against a single CLOVA Speech extraction, before the answer key was corrected.

|  | large-v3 | turbo | CLOVA rerun |
|---|---|---|---|
| Transcription time (221 min of audio) | 26.1 min | 11.7 min | - |
| Name overlap ratio | 0.59 | 0.66 | 0.93 |
| Promises (CLOVA Speech 44) | 31 | 37 | 43 |
| Items to register (CLOVA Speech 45) | 45 | 43 | 50 |

The numbers in parentheses were extracted in the test environment from the CLOVA Speech transcripts, and their gap from the CLOVA rerun column is the size of the wobble. The name overlap ratio is the share of person, company, and project names found in both that CLOVA Speech result and the column's result, out of all names found in either; 1 means identical. Transcription times were measured one after another so they did not overlap with other test jobs.

The immediate branch was **nearly even**. Because Iroha reads the whole transcript to pull out to-dos, to-dos and appointments survived even when names were slightly wrong. Turbo was more than twice as fast as large-v3 and closer to CLOVA Speech on most measures, so I used turbo for the rest of the tests.

The trouble was **the context branch**. Speakers were split too finely, so promises went missing, and turbo wrote people's names with one final consonant off, so Iroha created new person entries that should not have existed or linked the name to a different person with a similar spelling. I fixed the speaker problem with small-speaker merging, introduced later, and tried other engines for the name problem.

### Transcripts by Engine

[STT model performance compared: a 35-minute Korean meeting recording, 7 models tested](https://blog.dongjun.win/posts/korean-stt-7-model-comparison/) (in Korean) reports that even with the same turbo model, WhisperKit caught terms better than faster-whisper. I learned about Qwen3-ASR and Cohere Transcribe from [Analysis of Korean YouTube STT (ASR) models and runtimes, 2026](https://wikidocs.net/343561) (in Korean).

- **WhisperKit**: A Whisper runner for Apple devices made by Argmax. It runs the same turbo model on the Neural Engine, the dedicated AI unit in Apple chips, so it does not compete with other work that uses the GPU. I used whisperkit-cli 1.1.1.
- **Qwen3-ASR 1.7B**: A speech recognition model released by the Qwen team in January 2026. It attaches an audio encoder to the Qwen3 language model, transcribes 30 languages including Korean, and is licensed under Apache 2.0.
- **Cohere Transcribe 03-2026**: A 2B (about 2 billion parameters) model released by Cohere in March 2026. It supports 14 languages including Korean and is licensed under Apache 2.0.

On oMLX, Qwen3-ASR and Cohere Transcribe do not return per-word timestamps. Alongside transcribing each call in one pass ("whole call" below), I also tested transcribing each diarized segment separately and attaching that segment's speaker.

This section compared transcripts only, without speakers, and I did not compare speed because the engines ran at the same time.

Name hints in the table mean telling the engine in advance which names are likely to come up in the call. I put into the prompt the names of the other party, people who appeared with them in past records, and frequently mentioned people, and in this post I call this list "contact-based hints."

| Transcript | Character difference (long/short calls) | Repeats | Name hits |
|---|---|---|---|
| CLOVA Speech | - | 2 | 33 |
| Whisper turbo (oMLX) | 17.2% / 18.5% | 20 | 21 |
| Whisper turbo (WhisperKit) | 17.4% / 16.2% | 6 | 23 |
| WhisperKit, name hints | 33.1% / 30.4% | 11 | 27 |
| Qwen3-ASR, per diarized segment | 18.3% / 18.1% | 1 | 22 |
| Qwen3-ASR, whole call | 15.9% / 15.6% | 3 | 22 |
| Qwen3-ASR, whole call, name hints | 16.6% / 15.7% | 2 | 28 |
| Cohere, per diarized segment | 28.9% / 26.7% | 36 | 24 |

The character difference does not measure accuracy. Qwen3-ASR writes down more backchannels like "ne" and "eung" than CLOVA Speech, which can push this ratio up. In the final local setup as well, insertions (text not in the CLOVA Speech transcript) made up more of the difference (6.6 percentage points) than deletions (2.2 percentage points).

WhisperKit runs the same turbo model as oMLX, yet repeats fell from 20 to 6 while name hits stayed about the same. With hints, WhisperKit's name hits rose to 27, but it dropped speech and the character difference nearly doubled.

Running Qwen3-ASR on whole calls with name hints raised name hits to 28 without adding repeats. The hint list was written into the transcript once, in 1 of the 25 calls, and name hits were counted with that part excluded.

Cohere Transcribe was the least stable, with 36 repeats, and whole-call transcription could not be finished because of a memory problem described later.

### Name Hints Work Differently by Engine

The side effects of the same hints varied widely by engine, and the two models differ in where they take a prompt in the first place.

Whisper in mlx-audio, which oMLX uses, transcribes audio in 30-second windows one after another and feeds the text already transcribed into each window as the prompt (`condition_on_previous_text`). The name hint (`initial_prompt`) goes in once at the very start of that text, and the prompt only holds the last 223 tokens (the units a model splits text into). As transcribed text piles up, the hint gets pushed out, so in a 20-minute call the hint reaches only the first few windows.

I cut calls into chunks of 28 seconds or less and attached the hint to each chunk, but the results got worse.

- With hints on short chunks, Whisper fell into loops repeating the same words. In one call, the same English syllable was repeated 218 times.
- Names not in the CLOVA Speech transcripts slipped in 13 times, compared with 3 times without hints.
- Of the 329 hint names chosen for the 10 long calls, only 20 actually came up in the calls.

Whisper was trained so that the prompt slot holds the transcript of the preceding segment ([the Whisper paper](https://arxiv.org/abs/2212.04356)). With hints, both oMLX and WhisperKit repeated the same words or dropped speech.

Qwen3-ASR was trained to use context in the system prompt as background knowledge ([Qwen3-ASR Technical Report](https://arxiv.org/abs/2601.21337)). When transcribing whole calls, hints raised name hits with almost no side effects.

With hints attached to each short segment, it hit 68 of the 77 names, more than twice CLOVA Speech. On a second look, 340 of the 3,015 speaker segments in the long calls (11%) contained three or more hint names: it had written down the hint list itself.

On short segments, hints threw off both engines, and only Qwen3-ASR gained from them in transcription with long context, such as whole calls or 4-minute chunks. I did not give hints to Cohere Transcribe.

## Why I Chose Qwen3-ASR

Based on the transcription results, I chose Qwen3-ASR as the engine.

- **Names**: When transcribing whole calls, Qwen3-ASR was the engine whose name hits rose with name hints while causing few side effects. Whisper repeated or dropped speech with the same hints.
- **Stability**: It had few repeats and did not swing widely the way Cohere Transcribe did.

The extraction comparisons up to that point used a single CLOVA Speech extraction as the answer key, so the gap from Whisper turbo was within the rerun's wobble. I put the extraction gap between engines in the candidate chart later on.

WhisperKit had the advantage of running on the Neural Engine and not competing for the GPU, but its name hits were about the same as Whisper turbo's. Qwen3-ASR, on the other hand, has no per-word timestamps, so it needs an alignment model and 4-minute chunking on top, and the alignment model uses another 3.7GB of memory.

Linking names also needed stronger candidate rules regardless of engine. Below, I also write up small-speaker merging, which I built during the Whisper tests, and the attempts I tried and dropped.

## What I Added

### Merging Small Speakers

This is a diarization-stage problem, not an engine one: I found it while testing Whisper turbo and used the same fix unchanged in the Qwen3-ASR setup.

pyannote split calls between two or three people into four to six speakers. With one person's speech scattered across several speakers, Iroha could not tell which one was me, and dropped promises or attributed them to the other party. Every call that lost promises was one where speakers had been split too finely.

At first I tried capping speakers at four, but fragment speakers with only 4–5% of the talk time remained. All recordings are single-channel (mono), so speakers could not be separated by channel, and in production the number of speakers in a call is not known in advance, so I did not set it.

Instead of a cap, I used small-speaker merging, which hands any speaker with less than 10% of the call's talk time to the nearest main speaker in time. Of the 10 long calls measured with Whisper turbo, 7 ended up with the same number of speakers as CLOVA Speech, and in 2 calls that CLOVA Speech split into three people, the quieter third speaker was merged too, leaving two. The remaining one still had five speakers after merging.

Promises came to 42 (27 of them my own), close to CLOVA Speech's 44 (25). Before merging, it was 37 (17).

However, a third person who really spoke only briefly is merged into a main speaker too, and that person's words become the main speaker's. If my backchannels or short replies are split off as a small speaker, they go to the other party nearest in time.

I also compared the 15 calls shorter than 15 minutes with turbo plus small-speaker merging. Items to register and promises were at CLOVA Speech's level on short calls too, and Whisper hallucinating text in silent stretches did not show up even in calls under one minute.

### Attaching Speakers with an Alignment Model

Speakers cannot be attached without per-word timestamps, so I added :term[forced alignment]{key="forced-alignment"}, which lines up the transcribed text with the audio to find a timestamp for each word. For alignment I used [Qwen3-ForcedAligner](https://huggingface.co/Qwen/Qwen3-ForcedAligner-0.6B) from the same team.

1. Split the call into chunks of 4 minutes or less at silent points. This keeps each chunk shorter than what the alignment model handles at once.
2. Transcribe each chunk with Qwen3-ASR using contact-based hints, and delete any hint text that leaked in.
3. Align the same chunk with Qwen3-ForcedAligner to get a timestamp for each word.
4. Attach a speaker to each word, going through small-speaker merging.

With 4-minute chunks, the hint text never leaked in any of the 25 calls, and name hits were 29 (24 without hints, 33 for CLOVA Speech). With this setup, items to register came to 75, between CLOVA Speech (74) and the rerun (82), and promises came to 74, fewer than CLOVA Speech (79).

### Choosing Name Hints

Most of the names in contact-based hints had nothing to do with what the call was about. On October 27, I transcribed once without hints, picked only the names and aliases from the context records that appeared, or appeared with a similar spelling, in that transcript, and transcribed again with them as hints.

Hint names dropped from 809 to 191 across the 25 calls, and name hits rose to 32, nearly matching CLOVA Speech (33). However, as the candidate chart and table below show, Iroha linked fewer names than with contact-based hints (77% and 80% vs 83% and 83%) and picked more extras (17–20 vs 12). I settled on contact-based hints.

At first I thought hints containing similarly spelled names made the engine write the wrong name. But removing similar names from the hints did not help, and on a second look, transcription without hints made the same misrecognitions. I got the cause wrong because I had not looked at a control alongside.

That said, there were cases where a newly appearing person's name turned into the name of an existing person in the hints and was linked wrongly.

### Strengthening Name Candidates

During the Whisper tests, I first added existing names whose spelling differs by a single jamo to the candidates the context branch hands over (in this post, "near-spelling candidates"). Wrong links and fake people went down, but correct links did not go up, because many misrecognitions changed the final and initial consonants together and differed by three or more jamo.

For a stricter check than the CLOVA Speech consensus, I took the 64 names all three CLOVA Speech runs picked and went through the 10 the local setup missed one by one.

- **Never became candidates (6)**: 2 English acronyms transcribed as their Korean readings, 3 heard differently, and 1 pushed outside the 8,000 characters Iroha reads at once because the transcript was long
- **Were candidates but not picked (4)**: All came from one call. It was a call where the words referring to that person were transcribed wrong.

The aliases used to pick candidates built up from CLOVA Speech transcripts, so the current candidate rule favors CLOVA Speech's spellings. I left the transcripts as they were and strengthened only the candidates in three ways.

1. Aliases that are English acronyms are also looked up by their Korean reading. This applied in only 2 of the 25 calls, and both were exactly the names that had been missed.
2. Add the 5 people and companies most often mentioned alongside the other party as candidates, even if their names are not in the transcript. The aim is to let Iroha link them from context even when the transcript garbles the name.
3. Raise the cap on added candidates from 15 to 25. In 8 of the 10 long calls, candidates caught by spelling alone filled the cap, so almost all of the candidates from fix 2 were cut.

The three fixes are rules that do not depend on the engine, but I did not try them on Whisper turbo.

The chart and table below were measured against the CLOVA Speech consensus. All local setups used small-speaker merging and near-spelling candidates, and each line starting with "+" adds one fix to the line above it. CLOVA Speech used the production rules as they are, and like production, it got no name hints (keyword boosting).

![Chart plotting, for each setup, recall measured against the CLOVA Speech consensus as a dot, with the 94–98% range of three CLOVA Speech runs as a gray band](./candidates.en.svg?w=720 "Recall climbs from 83% to 89% as each fix is added, moving closer to the gray band")

:::details
The numbers: recall and extras by setup

| Setup | Recall | Extras |
|---|---|---|
| CLOVA Speech runs 1–3 | 94–98% | 2–7 |
| Whisper turbo | 77% | 14 |
| Qwen3-ASR, contact-based hints | 83% / 83% | 12 |
| + acronym readings | 84% / 84% | 13 |
| + 5 co-mentioned people and companies | 87% | 13 |
| + candidate cap of 25 | 89% / 89% | 12–13 |
| Qwen3-ASR, no hints, acronym readings | 81% | 12 |
| Qwen3-ASR, first-pass hints | 77% / 80% | 17–20 |
:::

For setups run twice, both values are listed. Of the four setups run twice, three gave the same recall both times, and first-pass hints swung by 3 points.

Comparing Qwen3-ASR without hints (81%, with acronym readings) against contact-based hints plus acronym readings (84%), the hints added about 3 points, and the rest of the gap from Whisper turbo (77%) belongs to the engine and alignment.

The three fixes raised recall from 83% to 89% while barely increasing extras. Promises in the final local setup came to 73–77, similar to CLOVA Speech (76–79).

I also tried adding another transcript of the same call to the candidate search, but two runs swung widely at 93% and 84%, so I dropped this approach. In this setup, if a name was misspelled in the transcript Iroha reads, Iroha did not link it even when it was among the candidates.

The remaining gap in the final local setup is 6 missed names out of the 64 that all three runs picked, plus 4 spellings of new people that the consensus answer key does not include. Of the 6, 3 never became candidates because they were misheard or the transcript was cut off, and 3 were concentrated in one call.

## Results After the Fixes

### Settling Disputed Names

The CLOVA Speech consensus alone cannot catch cases where CLOVA Speech is wrong. There were 27 person and company names where the final local setup and the CLOVA Speech side disagreed: 11 picked only by the local setup and 16 picked only by CLOVA Speech.

- Of the 11 picked only by the local setup, all three families wrote 5 of them. They were actually said, and the CLOVA Speech side either missed them or wrote them as a different name.
- Of the 16 picked only by CLOVA Speech, the other families also heard 8. These were real misses by the local setup.
- For the remaining 13 (8 picked only by CLOVA Speech and 5 picked only by the local setup), the other families did not write the name. The vote could not tell whether the name was wrong or the engines simply failed to catch it.

The voting engines include Qwen3-ASR, the local side's engine. Even counting only names that both of the other two families wrote, without Qwen3-ASR, the verdicts on names picked only by the local setup stayed the same, and the names picked only by CLOVA Speech that were said dropped from 8 to 4. Qwen3-ASR did not bias the vote toward the local side.

The one remaining name picked only by the local setup was dropped because I could not find where it came up. The 13 names the vote could not settle became 11 questions, because two pairs came up at the same moment, and listening to them myself took a little over 5 minutes.

CLOVA Speech was right on 3 questions and the local setup on 4. Both were wrong on 2, and 2 were dropped from scoring because the pronunciation was too slurred to tell.

### Results by Answer Key

I lined up the final local setup and CLOVA Speech on the four answer keys.

![Chart showing, for each of four answer keys, the recall of the final local setup as a dot and the range of three CLOVA Speech runs as a bar](./criteria.en.svg?w=720 "The local dot falls inside the CLOVA Speech bar only on the bottom two answer keys")

:::details
The numbers: recall by answer key

| Answer key | Final local setup | CLOVA Speech runs 1–3 |
|---|---|---|
| CLOVA Speech consensus (existing people and companies) | 89% | 94–98% |
| Corrected by vote, including the 8 unsettled names picked only by CLOVA Speech | 80% | 86–92% |
| Corrected by vote, excluding the 8 unsettled names picked only by CLOVA Speech | 88% | 87–91% |
| Corrected by listening | 84% | 82–87% |
:::

As noted earlier, the corrected answer keys include newly appearing people, so they cannot be compared directly with the first row. The answer key corrected by listening has 83 people and companies, so one name is worth about 1.2 points.

The final local setup fell within the CLOVA Speech range on two of the four answer keys. In 95% intervals computed by resampling the 25 calls at random and recalculating the gap 4,000 times, the local setup was 7.6 percentage points lower on the consensus answer key, and even the upper end of the interval was slightly below zero (−16.1 to −0.0 points). On the answer key corrected by listening it was 0.8 points lower, but the interval spans zero widely (−10.4 to +7.7 points), so 25 calls cannot say whether the two are the same or different.

The local setup was weakest on long calls. On the answer key corrected by listening, the 10 long calls scored 81% locally against 84–88% for CLOVA Speech, and the 15 short calls scored 88% locally against 78–90% for CLOVA Speech. On the consensus answer key, too, the local setup scored 82% on long calls and 97% on short calls.

Extras against the corrected answer key came to 3–7 per run for CLOVA Speech and 3–4 for the local setup. Of these, the ones I confirmed wrong by listening were 2–3 on the CLOVA Speech side, wrongly created as new people, and 1 on the local side, wrongly linked to an existing person. As noted earlier, the CLOVA Speech values were scored against an answer key the CLOVA Speech runs helped build.

## Processing Time and Memory

On this Mac Studio, the final local setup processed audio at 8–9 times real time (9.0x for long calls, 8.0x for short calls). That covers transcription, alignment, and speaker diarization together, which means a 22-minute call finishes in about 2 minutes 30 seconds.

| Call length (average of 3) | Transcription and alignment | Speaker diarization |
|---|---|---|
| Under 1 min (20 sec on average) | 2.1 sec | 0.8 sec |
| 1–2 min (85 sec on average) | 7.4 sec | 2.5 sec |
| 2–5 min | 12.5 sec | 4.2 sec |
| 10–15 min | 75 sec | 24 sec |

About 80% of the transcription and alignment time went to Qwen3-ASR transcription, and denser speech made chunks slower. Very short calls run at a lower multiple because of fixed overhead, so a 20-second call took about 3 seconds.

The diarization service took 6.3 seconds for its first request after starting, and 0.7 seconds after that. At my call volume of 41 minutes a day on average, processing takes about 5 minutes a day.

With only this setup loaded, memory comes to about 11–12GB in total: 5–6GB for oMLX, 3.7GB for the alignment service, and about 2GB for the diarization service. These figures are process memory (RSS).

Transcription and alignment were measured while oMLX was not shared with other transcription jobs, and the diarization time is a single measurement from an earlier test. The CLOVA Speech path does not record when a transcription finishes, so I listed processing times for the local setup only.

When I put several jobs on at once during the test, problems that would need solving before moving to production also showed up.

- **Memory**: Putting three transcription jobs on oMLX at once (Qwen3-ASR whole-call and segment transcription, and Cohere whole-call transcription) made a single oMLX process hold 57GB of GPU memory and pushed swap, which uses the disk as memory, past 20GB. Even after stopping the jobs, 37GB stayed held, and unloading the models brought it down to 7GB.
- **Queue**: oMLX handles transcription requests one at a time, so short segment requests waited in line for more than 30 minutes behind whole-call requests that each took several minutes.
- **Restarts**: Restarting oMLX or upgrading it to a new version made requests in flight fail, so production needs a way to resend failed requests.

## Decision and Open Issues

I chose Qwen3-ASR as the engine, but I did not switch call transcription away from CLOVA Speech right away. Switching would mean putting the alignment model, small-speaker merging, and four candidate rules for linking names into production along with the transcription engine, and I have not done that yet. The four candidate rules are near-spelling candidates, acronym readings, 5 co-mentioned people and companies, and a candidate cap of 25.

Looking back at the three reasons I started with:

- **Cost**: Instead of 28 KRW per minute, it would take about 5 minutes a day on a Mac Studio that is always on.
- **Sending data out**: Recordings would no longer go to CLOVA Speech, but the transcripts would still be read by Codex, as they are today.
- **Outside dependence**: Instead of CLOVA Speech, call processing would rely on oMLX and a single Mac Studio.

Four issues remain.

- The name gap that remains on long calls
- Unequal comparison conditions: CLOVA Speech got neither name hints nor the candidate fixes.
- The CLOVA Speech bias left in the answer keys, and the fact that the rules were measured on the same 25 calls they were built from
- Operational problems such as memory, queuing, and a way to resend failed requests

I also learned something about the testing method.

- LLM extraction wobbles even on the same input, so the answer had to be what several runs picked together, and the same setup had to be measured twice.
- When the yardstick came from one side of the comparison, improvements on the other side did not show up in the score.
- Listening only to the disputed names, I needed just a little over 5 minutes to settle them.
- When the numbers looked too good, the first thing to check was leaked hints; when I thought I had found the cause, the first thing to check was a control.

:::see-also
- [paper] [Qwen3-ASR Technical Report](https://arxiv.org/abs/2601.21337)
- [repo] [Qwen3-ASR](https://github.com/QwenLM/Qwen3-ASR)
- [docs] [Qwen3-ForcedAligner-0.6B](https://huggingface.co/Qwen/Qwen3-ForcedAligner-0.6B)
- [docs] [Cohere Transcribe 03-2026](https://huggingface.co/CohereLabs/cohere-transcribe-03-2026)
- [docs] [pyannote speaker-diarization-community-1](https://huggingface.co/pyannote/speaker-diarization-community-1)
- [repo] [Argmax OSS Swift (WhisperKit)](https://github.com/argmaxinc/argmax-oss-swift)
- [paper] [Robust Speech Recognition via Large-Scale Weak Supervision](https://arxiv.org/abs/2212.04356)
- [repo] [openai/whisper](https://github.com/openai/whisper)
- [article] [Whisper large-v3-turbo release](https://github.com/openai/whisper/discussions/2363)
- [repo] [oMLX](https://github.com/jundot/omlx)
- [repo] [mlx-audio](https://github.com/Blaizzy/mlx-audio)
- [docs] [CLOVA Speech API](https://api.ncloud-docs.com/docs/ai-application-service-clovaspeech)
- [article] [STT model performance compared: a 35-minute Korean meeting recording, 7 models tested (in Korean)](https://blog.dongjun.win/posts/korean-stt-7-model-comparison/)
- [article] [Analysis of Korean YouTube STT (ASR) models and runtimes, 2026 (in Korean)](https://wikidocs.net/343561)
:::
