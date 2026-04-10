import { computed, reactive, ref } from 'vue';
import { defineStore } from 'pinia';
import { useLoading } from '@sa/hooks';
import { useRouterPush } from '@/hooks/common/router';
import { localStg } from '@/utils/storage';
import { SetupStoreId } from '@/enum';
import { $t } from '@/locales';
import { fetchGetUserInfo, fetchLogin } from '@/service/api';
import { useRouteStore } from '../route';
import { useTabStore } from '../tab';
import { clearAuthStorage, getToken } from './shared';

export const useAuthStore = defineStore(SetupStoreId.Auth, () => {
  const routeStore = useRouteStore();
  const tabStore = useTabStore();
  const { toLogin, redirectFromLogin } = useRouterPush(false);
  const { loading: loginLoading, startLoading, endLoading } = useLoading();

  const token = ref(getToken());

  const userInfo: Api.Auth.UserInfo = reactive({
    userId: '',
    userName: '',
    roles: [],
    buttons: []
  });

  /** is super role in static route */
  const isStaticSuper = computed(() => {
    const { VITE_AUTH_ROUTE_MODE, VITE_STATIC_SUPER_ROLE } = import.meta.env;

    return VITE_AUTH_ROUTE_MODE === 'static' && (userInfo.roles ?? []).includes(VITE_STATIC_SUPER_ROLE);
  });

  /** Is login */
  const isLogin = computed(() => Boolean(token.value));

  /** Reset auth store */
  async function resetStore() {
    clearAuthStorage();
    token.value = '';
    userInfo.userId = '';
    userInfo.userName = '';
    userInfo.roles = [];
    userInfo.buttons = [];

    await routeStore.resetStore();
    await tabStore.clearTabs();

    toLogin();
  }

  /**
   * Login
   */
  async function login(userName: string, password: string, redirect = true) {
    startLoading();

    try {
      const { data, error } = await fetchLogin(userName, password);
      if (error || !data?.token) {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          '登录失败，请检查用户名或密码';
        window.$message?.error(message);
        throw error || new Error(message);
      }

      localStg.set('token', data.token);
      localStg.set('refreshToken', data.refreshToken);
      token.value = data.token;

      await initUserInfo();
      await routeStore.initAuthRoute();
      await redirectFromLogin(redirect);

      window.$notification?.success({
        title: $t('page.login.common.loginSuccess'),
        content: $t('page.login.common.welcomeBack', { userName: userInfo.userName }),
        duration: 4500
      });
    } catch (error) {
      clearAuthStorage();
      token.value = '';
      throw error;
    } finally {
      endLoading();
    }
  }

  async function initUserInfo() {
    const maybeToken = getToken();
    if (!maybeToken) return;

    token.value = maybeToken;
    try {
      const { data, error } = await fetchGetUserInfo();
      if (error || !data) {
        throw error || new Error('Unauthorized');
      }
      userInfo.userId = data.userId;
      userInfo.userName = data.userName;
      userInfo.roles = data.roles ?? [];
      userInfo.buttons = data.buttons ?? [];
    } catch {
      clearAuthStorage();
      token.value = '';
      userInfo.userId = '';
      userInfo.userName = '';
      userInfo.roles = [];
      userInfo.buttons = [];
      toLogin();
    }
  }

  return {
    token,
    userInfo,
    isStaticSuper,
    isLogin,
    loginLoading,
    resetStore,
    login,
    initUserInfo
  };
});
