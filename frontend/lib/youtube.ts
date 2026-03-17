export const getYoutubeVideoId = (url: string) => {
  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname.includes("youtu.be")) {
      return parsedUrl.pathname.replace("/", "");
    }

    return parsedUrl.searchParams.get("v") ?? "";
  } catch {
    return "";
  }
};

export const getYoutubeEmbedUrl = (url: string) => {
  const videoId = getYoutubeVideoId(url);
  return videoId ? `https://www.youtube-nocookie.com/embed/${videoId}` : "";
};

