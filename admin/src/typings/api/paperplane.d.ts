declare namespace Api {
  namespace PaperPlane {
    interface PagedResponse<T> {
      items: T[];
      total: number;
    }

    interface Stats {
      totalPlanes: number;
      activePlanes: number;
      todayThrows: number;
      totalLocations: number;
      totalComments: number;
    }

    interface HomeHeadlineConfig {
      phrases: string[];
    }

    interface MoodConfig {
      key: string;
      label: string;
      iconUrl: string;
      color: string;
      sortOrder: number;
      isActive: boolean;
      isCustom: boolean;
    }

    interface ExpireOptionConfig {
      hours: number;
      label: string;
      sortOrder: number;
      isActive: boolean;
    }

    interface Location {
      id: number;
      name: string;
      sortOrder: number;
      planeCount: number;
      iconUrl: string | null;
    }

    interface Plane {
      id: string;
      shortCode: string;
      locationTag: string;
      content: string;
      mood: string;
      isAnonymous: boolean;
      authorName: string | null;
      imageUrls: string[] | null;
      createTime: string;
      expireTime: string;
      pickCount: number;
      likeCount: number;
      commentCount: number;
      reportCount: number;
      voteTitle: string | null;
      voteOptions: string[] | null;
    }

    interface UpdatePlanePayload {
      locationTag: string;
      content: string;
      mood: string;
      isAnonymous: boolean;
      authorName: string;
      imageUrls: string[];
      expireHours: number;
      voteTitle: string;
      voteOptions: string[];
    }

    interface PlaneAttitudeOption {
      optionKey: string;
      count: number;
    }

    interface PlaneAttitudeSummary {
      options: PlaneAttitudeOption[];
      myChoice: string | null;
      totalCount: number;
    }

    interface Comment {
      id: string;
      reply: string;
      nickName: string;
      createTime: string;
      parentCommentId: string | null;
      replyToNickName: string | null;
    }

    interface AdminComment {
      id: string;
      planeId: string;
      locationTag: string;
      planeContent: string;
      reply: string;
      nickName: string;
      createTime: string;
      parentCommentId: string | null;
      replyToNickName: string | null;
      replyCount: number;
    }

    interface AdminUser {
      id: string;
      username: string;
      studentId: string;
      phone: string;
      avatarUrl: string | null;
      gender: string;
      bio: string;
      isActive: boolean;
      createTime: string;
      lastLoginTime: string | null;
      thrownPlaneCount: number;
      likeCount: number;
      pickCount: number;
    }
  }
}
