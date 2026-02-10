import axios from 'axios';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface SearchParams {
    q: string;
    maxResults?: number;
    order?: 'relevance' | 'date' | 'viewCount' | 'rating';
    publishedAfter?: string;
    publishedBefore?: string;
    videoDuration?: 'any' | 'long' | 'medium' | 'short';
    type?: 'video' | 'channel' | 'playlist';
    pageToken?: string;
    apiKey: string;
    regionCode?: string;
}

export interface VideoItem {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    channelTitle: string;
    publishedAt: string;
    viewCount?: string;
    likeCount?: string;
    duration?: string;
    url: string;
}

export const searchVideos = async (params: SearchParams): Promise<{ items: VideoItem[], nextPageToken?: string, totalResults?: number }> => {
    try {
        const searchResponse = await axios.get(`${BASE_URL}/search`, {
            params: {
                part: 'snippet',
                q: params.q,
                maxResults: params.maxResults || 24,
                order: params.order || 'relevance',
                publishedAfter: params.publishedAfter,
                publishedBefore: params.publishedBefore,
                videoDuration: params.videoDuration,
                type: params.type || 'video',
                pageToken: params.pageToken,
                key: params.apiKey,
                regionCode: params.regionCode || 'KR',
            }
        });

        const videoIds = searchResponse.data.items.map((item: any) => item.id.videoId).join(',');
        const statsResponse = await axios.get(`${BASE_URL}/videos`, {
            params: {
                part: 'statistics,contentDetails',
                id: videoIds,
                key: params.apiKey
            }
        });

        const statsMap = statsResponse.data.items.reduce((acc: any, item: any) => {
            acc[item.id] = {
                viewCount: item.statistics.viewCount,
                likeCount: item.statistics.likeCount,
                duration: item.contentDetails.duration
            };
            return acc;
        }, {});

        const items = searchResponse.data.items.map((item: any) => ({
            id: item.id.videoId,
            title: item.snippet.title,
            description: item.snippet.description,
            thumbnail: item.snippet.thumbnails.medium.url,
            channelTitle: item.snippet.channelTitle,
            publishedAt: item.snippet.publishedAt,
            viewCount: statsMap[item.id.videoId]?.viewCount,
            likeCount: statsMap[item.id.videoId]?.likeCount,
            duration: statsMap[item.id.videoId]?.duration, // ISO 8601 duration
            url: `https://www.youtube.com/watch?v=${item.id.videoId}`
        }));

        return {
            items,
            nextPageToken: searchResponse.data.nextPageToken,
            totalResults: searchResponse.data.pageInfo.totalResults
        };
    } catch (error) {
        console.error('YouTube API Error:', error);
        throw error;
    }
};

// Helper to format ISO 8601 duration to MM:SS
export const formatDuration = (duration: string) => {
    if (!duration) return '';
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    if (!match) return '';

    const hours = (match[1] || '').replace('H', '');
    const minutes = (match[2] || '').replace('M', '');
    const seconds = (match[3] || '').replace('S', '');

    if (hours) {
        return `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
    }
    return `${minutes || '0'}:${seconds.padStart(2, '0')}`;
};

export const formatViewCount = (count: string) => {
    const num = parseInt(count, 10);
    if (isNaN(num)) return '0';
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
};
