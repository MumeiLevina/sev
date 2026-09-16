"""
Kinetic Tech — Subtitle Export Utilities
────────────────────────────────────────
Convert Whisper API JSON response to SRT, VTT, and TXT formats.
"""


def seconds_to_srt_time(seconds: float) -> str:
    """Convert seconds (float) to SRT timestamp format: HH:MM:SS,mmm"""
    total_ms = max(0, int(round(float(seconds) * 1000)))
    hours, rem = divmod(total_ms, 3600000)
    minutes, rem = divmod(rem, 60000)
    secs, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def seconds_to_vtt_time(seconds: float) -> str:
    """Convert seconds (float) to VTT timestamp format: HH:MM:SS.mmm"""
    total_ms = max(0, int(round(float(seconds) * 1000)))
    hours, rem = divmod(total_ms, 3600000)
    minutes, rem = divmod(rem, 60000)
    secs, millis = divmod(rem, 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}.{millis:03d}"


def segments_to_srt(segments: list[dict]) -> str:
    """
    Convert Whisper segments to SRT format.
    Standard SubRip format:
    1
    00:00:01,000 --> 00:00:04,000
    Subtitle text

    2
    00:00:04,500 --> 00:00:07,000
    Next subtitle text
    """
    blocks = []
    idx = 1
    for seg in (segments or []):
        text = seg.get("text", "").strip()
        if not text:
            continue
        start = seconds_to_srt_time(float(seg.get("start", 0.0)))
        end = seconds_to_srt_time(float(seg.get("end", 0.0)))
        blocks.append(f"{idx}\n{start} --> {end}\n{text}")
        idx += 1
    return "\n\n".join(blocks) + "\n" if blocks else ""


def segments_to_vtt(segments: list[dict]) -> str:
    """Convert Whisper segments to WebVTT format."""
    blocks = ["WEBVTT\n"]
    idx = 1
    for seg in (segments or []):
        text = seg.get("text", "").strip()
        if not text:
            continue
        start = seconds_to_vtt_time(float(seg.get("start", 0.0)))
        end = seconds_to_vtt_time(float(seg.get("end", 0.0)))
        blocks.append(f"{idx}\n{start} --> {end}\n{text}")
        idx += 1
    return "\n\n".join(blocks) + "\n" if len(blocks) > 1 else "WEBVTT\n"


def segments_to_txt(segments: list[dict]) -> str:
    """Convert Whisper segments to plain text (timestamps + text)."""
    lines = []
    for seg in (segments or []):
        text = seg.get("text", "").strip()
        if not text:
            continue
        start = seconds_to_vtt_time(float(seg.get("start", 0.0)))
        end = seconds_to_vtt_time(float(seg.get("end", 0.0)))
        lines.append(f"[{start} → {end}] {text}")
    return "\n".join(lines)


def segments_to_plain(segments: list[dict]) -> str:
    """Convert Whisper segments to plain text only (no timestamps)."""
    return " ".join(seg.get("text", "").strip() for seg in (segments or []) if seg.get("text", "").strip())


def export_subtitles(segments: list[dict], format: str = "srt") -> tuple[str, str]:
    """
    Export segments in the specified format.
    Returns (content_string, mime_type).
    """
    exporters = {
        "srt": (segments_to_srt, "application/x-subrip"),
        "vtt": (segments_to_vtt, "text/vtt"),
        "txt": (segments_to_txt, "text/plain"),
    }

    exporter, mime = exporters.get(format, (segments_to_srt, "application/x-subrip"))
    return exporter(segments), mime
