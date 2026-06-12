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
      activeMoodDistribution: MoodStatItem[];
    }

    interface MoodStatItem {
      mood: string;
      count: number;
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

    interface SensitiveWordConfig {
      id: string;
      word: string;
      category: 'GENERAL' | 'ABUSE' | 'ADS' | 'CONTACT';
      matchMode: 'CONTAINS' | 'EXACT';
      handleMode: 'BLOCK' | 'REVIEW' | 'REPLACE';
      replaceText: string | null;
      scope: string;
      severity: number;
      priority: number;
      isEnabled: boolean;
      remark: string | null;
    }

    interface SensitiveWordAiSuggestion {
      id: number;
      suggestedWord: string;
      category: 'GENERAL' | 'ABUSE' | 'ADS' | 'CONTACT';
      matchMode: 'CONTAINS' | 'EXACT';
      handleMode: 'BLOCK' | 'REVIEW' | 'REPLACE';
      replaceText: string | null;
      scope: string;
      severity: number;
      priority: number;
      remark: string | null;
      sourceTextPreview: string;
      reason: string | null;
      confidence: number | null;
      createTime: string;
    }

    interface AiVoteConfig {
      isEnabled: boolean;
      baseUrl: string;
      model: string;
      temperature: number;
      maxTokens: number;
      defaultOptionCount: number;
      timeoutSeconds: number;
      enableFallback: boolean;
      perUserMinuteLimit: number;
      systemPrompt: string;
      hasApiKey: boolean;
      apiKeyMasked: string;
      updateTime: string;
      updatedBy: string | null;
    }

    interface UpdateAiVoteConfigPayload {
      isEnabled: boolean;
      baseUrl: string;
      model: string;
      temperature: number;
      maxTokens: number;
      defaultOptionCount: number;
      timeoutSeconds: number;
      enableFallback: boolean;
      perUserMinuteLimit: number;
      systemPrompt: string;
      apiKey?: string | null;
      clearApiKey?: boolean;
    }

    interface AiVoteLog {
      id: number;
      requestId: string;
      appUserId: string | null;
      contentPreview: string;
      mood: string;
      locationTag: string;
      requestedOptionCount: number;
      generatedTitle: string | null;
      generatedOptions: string[];
      source: 'ai' | 'fallback';
      status: 'success' | 'failed';
      errorMessage: string | null;
      durationMs: number;
      createTime: string;
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

    interface ReportedPlane extends Plane {
      isDeleted: boolean;
      latestReportReason: string | null;
      latestReportDetail: string | null;
      latestReportedAt: string | null;
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
