import os
import csv
import time
import re
from collections import OrderedDict

from dotenv import load_dotenv
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError


# ============================================================
# CONFIG
# ============================================================

load_dotenv(".env.local", override=True)

API_KEY = os.getenv("YOUTUBE_API_KEY")

if not API_KEY:
    raise ValueError(
        "Missing YOUTUBE_API_KEY in .env"
    )

youtube = build(
    "youtube",
    "v3",
    developerKey=API_KEY
)


OUTPUT_FILE = "songs_2000.csv"

TARGET_SONGS = 2000

# Individual song duration limits
MIN_SONG_DURATION = 90          # 1.5 minutes
MAX_SONG_DURATION = 12 * 60     # 12 minutes

# Maximum pages per search query.
#
# IMPORTANT:
# YouTube search.list costs quota.
# Keeping this at 2 prevents burning quota too quickly.
MAX_PAGES_PER_QUERY = 2

REQUEST_DELAY = 0.15


# ============================================================
# SEARCH QUERIES
# ============================================================

QUERIES = [

    # --------------------------------------------------------
    # HINDI / BOLLYWOOD
    # --------------------------------------------------------

    "Hindi songs",
    "Bollywood songs",
    "Hindi hit songs",
    "Hindi popular songs",
    "Hindi romantic songs",
    "Hindi love songs",
    "Hindi sad songs",
    "Hindi party songs",
    "Hindi dance songs",
    "Hindi emotional songs",
    "Hindi chill songs",
    "Hindi acoustic songs",
    "Hindi indie songs",
    "Hindi pop songs",

    "Bollywood hit songs",
    "Bollywood romantic songs",
    "Bollywood love songs",
    "Bollywood sad songs",
    "Bollywood party songs",
    "Bollywood dance songs",
    "Bollywood emotional songs",
    "Bollywood classics",
    "Bollywood popular songs",

    # --------------------------------------------------------
    # ERAS
    # --------------------------------------------------------

    "Hindi songs 70s",
    "Hindi songs 80s",
    "Hindi songs 90s",
    "Hindi songs 2000s",
    "Hindi songs 2010s",
    "Hindi songs 2020s",

    "Bollywood songs 70s",
    "Bollywood songs 80s",
    "Bollywood songs 90s",
    "Bollywood songs 2000s",
    "Bollywood songs 2010s",
    "Bollywood songs 2020s",

    "old Hindi songs",
    "old Bollywood songs",
    "90s Bollywood songs",
    "90s Hindi songs",
    "2000s Bollywood songs",
    "2000s Hindi songs",
    "2010s Bollywood songs",
    "2010s Hindi songs",
    "new Hindi songs",
    "new Bollywood songs",

    # --------------------------------------------------------
    # HINDI ARTISTS
    # --------------------------------------------------------

    "Arijit Singh songs",
    "Shreya Ghoshal songs",
    "Sonu Nigam songs",
    "KK songs",
    "Atif Aslam Bollywood songs",
    "Mohit Chauhan songs",
    "Jubin Nautiyal songs",
    "Armaan Malik songs",
    "Neha Kakkar songs",
    "Sunidhi Chauhan songs",
    "Kumar Sanu songs",
    "Udit Narayan songs",
    "Alka Yagnik songs",
    "Shaan songs",
    "Mohammed Rafi songs",
    "Kishore Kumar songs",
    "Lata Mangeshkar songs",
    "Asha Bhosle songs",
    "Sukhwinder Singh songs",
    "Rahat Fateh Ali Khan Bollywood songs",
    "KK Hindi songs",
    "Palak Muchhal songs",
    "Monali Thakur songs",
    "Darshan Raval songs",
    "Vishal Mishra songs",
    "Ankit Tiwari songs",

    # --------------------------------------------------------
    # PUNJABI
    # --------------------------------------------------------

    "Punjabi songs",
    "Punjabi hit songs",
    "Punjabi popular songs",
    "Punjabi romantic songs",
    "Punjabi love songs",
    "Punjabi sad songs",
    "Punjabi party songs",
    "Punjabi dance songs",
    "Punjabi pop songs",
    "Punjabi bhangra songs",
    "Punjabi indie songs",
    "Punjabi new songs",
    "Punjabi old songs",

    "Punjabi songs 90s",
    "Punjabi songs 2000s",
    "Punjabi songs 2010s",
    "Punjabi songs 2020s",

    # --------------------------------------------------------
    # PUNJABI ARTISTS
    # --------------------------------------------------------

    "Sidhu Moose Wala songs",
    "Karan Aujla songs",
    "AP Dhillon songs",
    "Diljit Dosanjh songs",
    "Shubh songs",
    "Amrit Maan songs",
    "Jass Manak songs",
    "Guru Randhawa songs",
    "Badshah songs",
    "Harrdy Sandhu songs",
    "B Praak songs",
    "Jassie Gill songs",
    "Ammy Virk songs",
    "Ninja Punjabi songs",
    "Maninder Buttar songs",
    "Garry Sandhu songs",
    "Prem Dhillon songs",
    "Jordan Sandhu songs",
    "Parmish Verma songs",
    "Kaka Punjabi songs",
    "Ranjit Bawa songs",

    # --------------------------------------------------------
    # INDIAN INDIE / POP
    # --------------------------------------------------------

    "Indian indie songs",
    "Indian pop songs",
    "Indian independent songs",
    "Indian chill songs",
    "Indian acoustic songs",
    "Indian lo fi songs",
    "Hindi indie music",
    "Punjabi indie music",
    "Indian viral songs",
    "Indian trending songs",

    # --------------------------------------------------------
    # ENGLISH
    # --------------------------------------------------------

    "English songs",
    "English hit songs",
    "English popular songs",
    "English love songs",
    "English romantic songs",
    "English sad songs",
    "English party songs",
    "English dance songs",
    "English pop songs",
    "English classics",
    "English chill songs",

    "English songs 90s",
    "English songs 2000s",
    "English songs 2010s",
    "English songs 2020s",

    "English songs popular in India",
    "international songs popular in India",

    # --------------------------------------------------------
    # INTERNATIONAL ARTISTS
    # --------------------------------------------------------

    "Ed Sheeran songs",
    "Taylor Swift songs",
    "Justin Bieber songs",
    "The Weeknd songs",
    "Bruno Mars songs",
    "Adele songs",
    "Billie Eilish songs",
    "Dua Lipa songs",
    "Ariana Grande songs",
    "OneRepublic songs",
    "Maroon 5 songs",
    "Coldplay songs",
    "Imagine Dragons songs",
    "Charlie Puth songs",
    "Shawn Mendes songs",
    "Selena Gomez songs",
    "Rihanna songs",
    "Eminem songs",
    "Drake songs",
    "Post Malone songs",
    "Harry Styles songs",
    "Lady Gaga songs",
    "Katy Perry songs",
    "Avicii songs",
    "Alan Walker songs",

]


# ============================================================
# BLOCKED WORDS
# ============================================================

BLOCKED_TITLE_WORDS = [

    # Playlists / collections
    "playlist",
    "full playlist",
    "music playlist",
    "song playlist",
    "full album",
    "album",
    "complete album",
    "collection",
    "compilation",
    "songs collection",
    "best of",
    "top 10",
    "top 20",
    "top 50",
    "top 100",

    # Long / continuous content
    "nonstop",
    "non-stop",
    "continuous",
    "continuous mix",
    "continuous songs",
    "1 hour",
    "2 hour",
    "3 hour",
    "4 hour",
    "5 hour",
    "6 hour",
    "8 hour",
    "10 hour",
    "12 hour",
    "24 hour",

    # Mixes
    "dj mix",
    "dj remix",
    "mega mix",
    "megamix",
    "mashup",
    "mash up",
    "medley",
    "jukebox",
    "mix",

    # Reactions / discussion
    "reaction",
    "react",
    "review",
    "interview",
    "podcast",
    "discussion",
    "talk",

    # Alternate versions
    "cover",
    "karaoke",
    "instrumental",
    "8d audio",
    "8d",
    "slowed",
    "slowed + reverb",
    "slowed and reverb",
    "slowed reverb",
    "sped up",
    "nightcore",
    "bass boosted",

    # Live
    "live concert",
    "concert",
    "live performance",
    "stage performance",
    "live version",

    # Shorts / status
    "shorts",
    "#shorts",
    "youtube shorts",
    "status video",
    "whatsapp status",
    "instagram status",

]


# ============================================================
# YOUTUBE SEARCH
# ============================================================

def search_youtube(query, page_token=None):

    request = youtube.search().list(
        part="snippet",
        q=query,

        # Music category
        videoCategoryId="10",

        # Only videos
        type="video",

        # India
        regionCode="IN",

        relevanceLanguage="en",

        maxResults=50,

        pageToken=page_token,
    )

    return request.execute()


# ============================================================
# GET VIDEO DETAILS
# ============================================================

def get_video_details(video_ids):

    if not video_ids:
        return {}

    response = youtube.videos().list(
        part="snippet,contentDetails,statistics",
        id=",".join(video_ids),
    ).execute()

    return {
        item["id"]: item
        for item in response.get("items", [])
    }


# ============================================================
# PARSE YOUTUBE DURATION
# ============================================================

def parse_duration(duration):

    if not duration:
        return 0

    match = re.match(
        r"PT"
        r"(?:(\d+)H)?"
        r"(?:(\d+)M)?"
        r"(?:(\d+)S)?",
        duration,
    )

    if not match:
        return 0

    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    return (
        hours * 3600
        + minutes * 60
        + seconds
    )


# ============================================================
# FORMAT DURATION
# ============================================================

def format_duration(seconds):

    minutes = seconds // 60
    remaining_seconds = seconds % 60

    return f"{minutes}:{remaining_seconds:02d}"


# ============================================================
# SONG TITLE NORMALIZATION
# ============================================================

def normalize_song_title(title):

    title = title.lower()

    # Remove common YouTube metadata
    remove_phrases = [

        "official music video",
        "official video",
        "official audio",
        "official",
        "music video",
        "lyrical video",
        "lyrics video",
        "lyrics",
        "full song",
        "full video",
        "audio",
        "video",

    ]

    for phrase in remove_phrases:
        title = title.replace(
            phrase,
            ""
        )

    # Remove brackets content
    title = re.sub(
        r"\[[^\]]*\]",
        "",
        title
    )

    title = re.sub(
        r"\([^)]*\)",
        "",
        title
    )

    # Remove punctuation
    title = re.sub(
        r"[^a-z0-9\s]",
        " ",
        title
    )

    # Normalize spaces
    title = re.sub(
        r"\s+",
        " ",
        title
    ).strip()

    return title


# ============================================================
# SONG VALIDATION
# ============================================================

def looks_like_song(
    title,
    channel,
    duration
):

    text = (
        f"{title} {channel}"
        .lower()
    )

    # --------------------------------------------------------
    # Duration
    # --------------------------------------------------------

    if duration < MIN_SONG_DURATION:
        return False

    if duration > MAX_SONG_DURATION:
        return False

    # --------------------------------------------------------
    # Block bad content
    # --------------------------------------------------------

    for word in BLOCKED_TITLE_WORDS:

        if word in text:
            return False

    return True


# ============================================================
# LANGUAGE DETECTION
# ============================================================

def detect_language(
    title,
    channel
):

    text = (
        f"{title} {channel}"
        .lower()
    )

    punjabi_words = [

        "punjabi",
        "punjab",
        "sidhu",
        "moose wala",
        "diljit",
        "karan aujla",
        "ap dhillon",
        "shubh",
        "amrit maan",
        "jass manak",
        "guru randhawa",
        "harrdy sandhu",
        "b praak",
        "jassie gill",
        "ammy virk",
        "maninder buttar",
        "garry sandhu",
        "parmish verma",

    ]

    hindi_words = [

        "hindi",
        "bollywood",
        "t-series",
        "t series",
        "saregama",
        "zee music",
        "sony music india",
        "tips",
        "yash raj films",
        "yrf",
        "eros now",

    ]

    for word in punjabi_words:

        if word in text:
            return "Punjabi"

    for word in hindi_words:

        if word in text:
            return "Hindi"

    return "English/International"


# ============================================================
# ERA
# ============================================================

def detect_era(
    published_at
):

    if not published_at:
        return "Unknown"

    try:

        year = int(
            published_at[:4]
        )

    except ValueError:

        return "Unknown"

    if year < 2000:
        return "Old"

    if year < 2010:
        return "2000s"

    if year < 2020:
        return "2010s"

    return "2020s"


# ============================================================
# POPULARITY
# ============================================================

def popularity_score(
    view_count,
    like_count
):

    views = int(
        view_count or 0
    )

    likes = int(
        like_count or 0
    )

    score = (
        views
        + likes * 10
    )

    if score >= 100_000_000:
        return "Top Hit"

    if score >= 10_000_000:
        return "Very Popular"

    if score >= 1_000_000:
        return "Popular"

    if score >= 100_000:
        return "Medium"

    return "Low"


# ============================================================
# COLLECT SONGS
# ============================================================

def collect_songs():

    songs = OrderedDict()

    # Prevent same normalized song from appearing
    # through different YouTube uploads.
    song_keys = set()

    print()
    print("=" * 70)
    print("YouTube Indian Music Dataset Generator")
    print("=" * 70)
    print()
    print(
        f"Target songs       : {TARGET_SONGS}"
    )
    print(
        f"Minimum duration   : "
        f"{format_duration(MIN_SONG_DURATION)}"
    )
    print(
        f"Maximum duration   : "
        f"{format_duration(MAX_SONG_DURATION)}"
    )
    print(
        f"Search queries     : {len(QUERIES)}"
    )
    print()

    for query_number, query in enumerate(
        QUERIES,
        start=1
    ):

        if len(songs) >= TARGET_SONGS:
            break

        print(
            f"[{query_number}/{len(QUERIES)}] "
            f"{query}"
        )

        page_token = None

        for page in range(
            MAX_PAGES_PER_QUERY
        ):

            if len(songs) >= TARGET_SONGS:
                break

            try:

                response = search_youtube(
                    query=query,
                    page_token=page_token
                )

            except HttpError as e:

                print(
                    f"  API ERROR: {e}"
                )

                # Quota exceeded / forbidden
                if e.resp.status in (
                    403,
                    429
                ):

                    print()
                    print(
                        "API quota/error encountered."
                    )
                    print(
                        "Stopping safely."
                    )
                    print()

                    return songs

                break

            items = response.get(
                "items",
                []
            )

            if not items:
                break

            video_ids = [

                item["id"]["videoId"]

                for item in items

                if item.get(
                    "id",
                    {}
                ).get(
                    "videoId"
                )

            ]

            details = get_video_details(
                video_ids
            )

            accepted_this_page = 0

            for item in items:

                if len(songs) >= TARGET_SONGS:
                    break

                video_id = (
                    item["id"]
                    .get("videoId")
                )

                if not video_id:
                    continue

                # Same YouTube video
                if video_id in songs:
                    continue

                detail = details.get(
                    video_id
                )

                if not detail:
                    continue

                snippet = detail.get(
                    "snippet",
                    {}
                )

                statistics = detail.get(
                    "statistics",
                    {}
                )

                content = detail.get(
                    "contentDetails",
                    {}
                )

                title = snippet.get(
                    "title",
                    ""
                ).strip()

                channel = snippet.get(
                    "channelTitle",
                    ""
                ).strip()

                published_at = snippet.get(
                    "publishedAt",
                    ""
                )

                duration = parse_duration(
                    content.get(
                        "duration",
                        ""
                    )
                )

                # ------------------------------------------------
                # INDIVIDUAL SONG FILTER
                # ------------------------------------------------

                if not looks_like_song(
                    title,
                    channel,
                    duration
                ):
                    continue

                # ------------------------------------------------
                # SONG TITLE DEDUPLICATION
                # ------------------------------------------------

                song_key = (
                    normalize_song_title(
                        title
                    )
                )

                if not song_key:
                    continue

                if song_key in song_keys:
                    continue

                song_keys.add(
                    song_key
                )

                # ------------------------------------------------
                # STATS
                # ------------------------------------------------

                views = statistics.get(
                    "viewCount",
                    0
                )

                likes = statistics.get(
                    "likeCount",
                    0
                )

                language = detect_language(
                    title,
                    channel
                )

                era = detect_era(
                    published_at
                )

                popularity = popularity_score(
                    views,
                    likes
                )

                # ------------------------------------------------
                # SAVE
                # ------------------------------------------------

                songs[video_id] = {

                    "title": title,

                    "artist_channel":
                        channel,

                    "language":
                        language,

                    "era":
                        era,

                    "popularity":
                        popularity,

                    "views":
                        views,

                    "likes":
                        likes,

                    "duration_seconds":
                        duration,

                    "duration":
                        format_duration(
                            duration
                        ),

                    "published_at":
                        published_at,

                    "youtube_video_id":
                        video_id,

                    "youtube_url":
                        (
                            "https://www.youtube.com/"
                            f"watch?v={video_id}"
                        ),

                }

                accepted_this_page += 1

                if (
                    len(songs) % 25 == 0
                ):

                    print(
                        f"    Collected "
                        f"{len(songs)}/"
                        f"{TARGET_SONGS}"
                    )

            print(
                f"    Page {page + 1}: "
                f"{accepted_this_page} "
                f"new songs"
            )

            page_token = response.get(
                "nextPageToken"
            )

            if not page_token:
                break

            time.sleep(
                REQUEST_DELAY
            )

    return songs


# ============================================================
# SAVE CSV
# ============================================================

def save_csv(songs):

    fieldnames = [

        "id",
        "title",
        "artist_channel",
        "language",
        "era",
        "popularity",
        "views",
        "likes",
        "duration_seconds",
        "duration",
        "published_at",
        "youtube_video_id",
        "youtube_url",

    ]

    with open(
        OUTPUT_FILE,
        "w",
        newline="",
        encoding="utf-8-sig"
    ) as file:

        writer = csv.DictWriter(
            file,
            fieldnames=fieldnames
        )

        writer.writeheader()

        for index, song in enumerate(
            songs.values(),
            start=1
        ):

            row = {
                "id": index,
                **song
            }

            writer.writerow(
                row
            )

    print()
    print("=" * 70)
    print("DONE")
    print("=" * 70)
    print(
        f"Songs collected : {len(songs)}"
    )
    print(
        f"CSV file        : {OUTPUT_FILE}"
    )
    print("=" * 70)


# ============================================================
# MAIN
# ============================================================

def main():

    try:

        songs = collect_songs()

        if not songs:

            print(
                "No songs were collected."
            )

            return

        save_csv(
            songs
        )

    except KeyboardInterrupt:

        print()
        print(
            "Stopped by user."
        )

    except Exception as e:

        print()
        print(
            f"Fatal error: {e}"
        )


# ============================================================
# ENTRY POINT
# ============================================================

if __name__ == "__main__":
    main()